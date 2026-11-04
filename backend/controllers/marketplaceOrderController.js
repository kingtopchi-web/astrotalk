const crypto = require('crypto');
const fs = require('fs');
const MarketplaceOrder = require('../models/MarketplaceOrder');
const MarketplaceCart = require('../models/MarketplaceCart');
const MarketplaceProduct = require('../models/MarketplaceProduct');
const MarketplaceEarning = require('../models/MarketplaceEarning');
const MarketplaceDownloadLog = require('../models/MarketplaceDownloadLog');
const Setting = require('../models/Setting');
const User = require('../models/User');
const Expert = require('../models/Expert');
const WalletTransaction = require('../models/WalletTransaction');
const paymentService = require('../services/RazorpayPaymentService');
const fileService = require('../services/MarketplaceFileService');
const { sendNotification } = require('../utils/notificationDispatcher');

/**
 * Helper to get platform commission percentage
 */
async function getMarketplaceCommissionRate() {
  const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' }).lean();
  return typeof settings?.marketplaceCommissionRate === 'number'
    ? settings.marketplaceCommissionRate
    : 10;
}

/**
 * POST /api/marketplace/checkout
 * Initiate checkout for digital products in cart or buy-now direct item
 */
exports.checkout = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';
    const buyerModel = userModel;
    const { items: directItems, paymentMethod = 'RAZORPAY' } = req.body;

    let checkoutItems = [];

    if (Array.isArray(directItems) && directItems.length > 0) {
      // Buy Now flow with directly passed product ID
      checkoutItems = directItems;
    } else {
      // Cart flow
      const cart = await MarketplaceCart.findOne({ userId, userModel }).populate('items.product');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Your cart is empty' });
      }
      checkoutItems = cart.items.map(i => ({ productId: i.product._id }));
    }

    const commissionRate = await getMarketplaceCommissionRate();

    // Verify products, prices, and availability on backend
    let subtotal = 0;
    const verifiedOrderItems = [];

    for (const item of checkoutItems) {
      const product = await MarketplaceProduct.findById(item.productId);
      if (!product || product.status !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: `Product "${product?.title || 'Unknown'}" is no longer available`
        });
      }

      // Security: Prevent self-purchase
      if (product.sellerId.toString() === userId.toString()) {
        return res.status(400).json({
          success: false,
          message: `You cannot purchase your own product: "${product.title}"`
        });
      }

      const itemPrice = (product.discountedPrice != null && product.discountedPrice > 0)
        ? product.discountedPrice
        : product.price;

      subtotal += itemPrice;

      const commissionAmount = Math.round((itemPrice * commissionRate) / 100);
      const sellerEarnings = itemPrice - commissionAmount;

      verifiedOrderItems.push({
        product: product._id,
        productTitle: product.title,
        productSlug: product.slug,
        coverImage: product.coverImage,
        price: itemPrice,
        sellerId: product.sellerId,
        sellerModel: product.sellerModel,
        sellerName: product.sellerName,
        platformCommissionRate: commissionRate,
        platformCommissionAmount: commissionAmount,
        sellerEarnings,
        downloadCount: 0,
        downloadAccessRevoked: false
      });
    }

    const totalAmount = subtotal; // no additional tax for digital goods by default
    const orderNumber = `MKT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // ─── 1. WALLET PAYMENT FLOW ──────────────────────────────────────────────
    if (paymentMethod === 'WALLET') {
      const BuyerModel = userModel === 'Expert' ? Expert : User;
      const buyer = await BuyerModel.findById(userId);

      if (!buyer || (buyer.walletBalance || 0) < totalAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Required: ₹${totalAmount}, Available: ₹${buyer?.walletBalance || 0}`
        });
      }

      // Deduct wallet atomically
      const balanceBefore = Number(buyer.walletBalance || 0);
      const balanceAfter = balanceBefore - totalAmount;
      buyer.walletBalance = balanceAfter;
      await buyer.save();

      // Record wallet transaction
      const walletTx = new WalletTransaction({
        user: buyer._id,
        amount: totalAmount,
        type: 'DEBIT',
        status: 'SUCCESS',
        balanceBefore,
        balanceAfter,
        description: `Marketplace purchase - Order #${orderNumber}`
      });
      await walletTx.save();

      // Create completed order
      const order = new MarketplaceOrder({
        orderNumber,
        buyerId: userId,
        buyerModel,
        buyerName: buyer.name,
        buyerEmail: buyer.email,
        items: verifiedOrderItems,
        subtotal,
        taxAmount: 0,
        totalAmount,
        paymentMethod: 'WALLET',
        paymentStatus: 'PAID',
        orderStatus: 'COMPLETED'
      });
      await order.save();

      // Credit seller earnings & update sales counts
      await processOrderSettlement(order, req.app.get('io'));

      // Clear cart
      await MarketplaceCart.findOneAndUpdate({ userId, userModel }, { $set: { items: [] } });

      return res.json({
        success: true,
        message: 'Order paid successfully via wallet',
        paymentMethod: 'WALLET',
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus
        }
      });
    }

    // ─── 2. RAZORPAY PAYMENT FLOW ───────────────────────────────────────────
    const buyer = req.user;
    const rzpOrder = await paymentService.createOrder({
      amount: totalAmount * 100, // paise
      currency: 'INR',
      receipt: `rcpt_${orderNumber.slice(-10)}`,
      notes: {
        type: 'marketplace_order',
        orderNumber,
        buyerId: userId.toString(),
        buyerEmail: buyer.email
      }
    });

    const order = new MarketplaceOrder({
      orderNumber,
      buyerId: userId,
      buyerModel,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      items: verifiedOrderItems,
      subtotal,
      taxAmount: 0,
      totalAmount,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      razorpayOrderId: rzpOrder.orderId,
      accountCode: rzpOrder.accountCode
    });
    await order.save();

    res.json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount
      },
      razorpay: {
        orderId: rzpOrder.orderId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: rzpOrder.keyId,
        accountCode: rzpOrder.accountCode
      }
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ success: false, message: error.message || 'Checkout failed' });
  }
};

/**
 * POST /api/marketplace/verify-payment
 * Verify Razorpay payment signature and fulfill order
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Incomplete payment verification payload' });
    }

    const order = await MarketplaceOrder.findOne({
      $or: [{ razorpayOrderId: razorpay_order_id }, { _id: orderId }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Marketplace order not found' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.json({
        success: true,
        message: 'Order already verified and paid',
        order
      });
    }

    // Verify HMAC SHA256 signature using the account that created the order
    const verification = await paymentService.verifyPaymentSignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      accountCode: order.accountCode
    });

    if (!verification.isAuthentic) {
      order.paymentStatus = 'FAILED';
      await order.save();
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Payment Verified! Atomically transition order to PAID and COMPLETED
    const lockedOrder = await MarketplaceOrder.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $ne: 'PAID' } },
      {
        $set: {
          paymentStatus: 'PAID',
          orderStatus: 'COMPLETED',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature
        }
      },
      { new: true }
    );

    if (!lockedOrder) {
      // Order was already settled concurrently
      return res.json({
        success: true,
        message: 'Order already verified and processed',
        order
      });
    }

    // Process seller earnings & counts exactly once
    await processOrderSettlement(lockedOrder, req.app.get('io'));

    // Clear cart
    await MarketplaceCart.findOneAndUpdate(
      { userId: lockedOrder.buyerId, userModel: lockedOrder.buyerModel },
      { $set: { items: [] } }
    );

    res.json({
      success: true,
      message: 'Payment verified successfully. Your digital downloads are now ready!',
      order: {
        _id: lockedOrder._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        items: order.items
      }
    });
  } catch (error) {
    console.error('Error verifying marketplace payment:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

/**
 * Helper to record seller earnings, update product sales counts, and dispatch notifications
 */
async function processOrderSettlement(order, io) {
  try {
    for (const item of order.items) {
      // 1. Create seller earning record
      const earning = new MarketplaceEarning({
        sellerId: item.sellerId,
        sellerModel: item.sellerModel,
        order: order._id,
        product: item.product,
        grossAmount: item.price,
        commissionRate: item.platformCommissionRate,
        commissionAmount: item.platformCommissionAmount,
        netEarnings: item.sellerEarnings,
        status: 'AVAILABLE'
      });
      await earning.save();

      // 2. Increment product sales count
      await MarketplaceProduct.findByIdAndUpdate(item.product, {
        $inc: { salesCount: 1 }
      });

      // 3. Notify Seller
      sendNotification({
        recipient: item.sellerId,
        recipientRole: item.sellerModel === 'Expert' ? 'EXPERT' : 'USER',
        recipientModel: item.sellerModel,
        title: 'New Digital Product Sale!',
        message: `Your product "${item.productTitle}" was purchased for ₹${item.price}. Your net earning: ₹${item.sellerEarnings}.`,
        link: '/marketplace/seller',
        actionText: 'View Sales',
        type: 'earnings_update',
        badge: 'Sale'
      }, io).catch(() => {});
    }

    // 4. Notify Buyer
    sendNotification({
      recipient: order.buyerId,
      recipientRole: order.buyerModel === 'Expert' ? 'EXPERT' : 'USER',
      recipientModel: order.buyerModel,
      title: 'Digital Purchase Successful!',
      message: `Your purchase of ${order.items.length} digital product(s) is confirmed. You can now download your files.`,
      link: '/marketplace/purchases',
      actionText: 'Download Files',
      type: 'general',
      badge: 'Download'
    }, io).catch(() => {});
  } catch (err) {
    console.error('Error settling marketplace order:', err);
  }
}

/**
 * GET /api/marketplace/purchases
 * Get buyer's purchased digital products
 */
exports.getMyPurchases = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';

    const orders = await MarketplaceOrder.find({
      buyerId: userId,
      buyerModel: userModel,
      paymentStatus: 'PAID'
    })
      .sort({ createdAt: -1 })
      .populate('items.product', 'title slug coverImage digitalFile description averageRating totalReviews')
      .lean();

    // Flatten to list of purchased products
    const purchases = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        purchases.push({
          orderId: order._id,
          orderNumber: order.orderNumber,
          purchasedAt: order.createdAt,
          paymentMethod: order.paymentMethod,
          price: item.price,
          product: {
            _id: item.product?._id || item.product,
            title: item.productTitle,
            slug: item.productSlug,
            coverImage: item.coverImage,
            fileExtension: item.product?.digitalFile?.fileExtension || 'file',
            fileSize: item.product?.digitalFile?.fileSize || 0
          },
          sellerName: item.sellerName,
          downloadCount: item.downloadCount || 0,
          lastDownloadedAt: item.lastDownloadedAt,
          downloadAccessRevoked: item.downloadAccessRevoked || false
        });
      });
    });

    res.json({
      success: true,
      purchases
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve purchases' });
  }
};

/**
 * GET /api/marketplace/downloads/:orderId/:productId
 * Secure streaming download endpoint for verified buyers
 */
exports.downloadProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';

    // 1. Verify order ownership & payment status
    const order = await MarketplaceOrder.findOne({
      _id: orderId,
      buyerId: userId,
      buyerModel: userModel
    });

    if (!order) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this order' });
    }

    if (order.paymentStatus !== 'PAID') {
      return res.status(403).json({ success: false, message: 'Download unavailable: Order is not paid' });
    }

    // 2. Find target item in order
    const orderItem = order.items.find(
      i => i.product.toString() === productId || i._id.toString() === productId
    );

    if (!orderItem) {
      return res.status(404).json({ success: false, message: 'Product not found in this order' });
    }

    if (orderItem.downloadAccessRevoked) {
      return res.status(403).json({
        success: false,
        message: 'Download access for this product has been revoked due to a refund or policy restriction'
      });
    }

    // 3. Fetch product for the stored private file name
    const product = await MarketplaceProduct.findById(orderItem.product);
    if (!product || !product.digitalFile?.storedFileName) {
      return res.status(404).json({ success: false, message: 'Digital file asset could not be located' });
    }

    const filePath = fileService.getFilePath(product.digitalFile.storedFileName);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Digital file is missing from private storage' });
    }

    // 4. Audit Log
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const downloadLog = new MarketplaceDownloadLog({
      order: order._id,
      product: product._id,
      buyerId: userId,
      buyerModel: userModel,
      ip,
      userAgent
    });
    await downloadLog.save();

    // Increment download count on order
    orderItem.downloadCount = (orderItem.downloadCount || 0) + 1;
    orderItem.lastDownloadedAt = new Date();
    await order.save();

    // 5. Stream file directly with safe headers
    const stat = fs.statSync(filePath);
    const downloadName = product.digitalFile.originalName || `${product.slug}.${product.digitalFile.fileExtension}`;

    res.writeHead(200, {
      'Content-Type': product.digitalFile.mimeType || 'application/octet-stream',
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'X-Content-Type-Options': 'nosniff'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    console.error('Error during secure file download:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to download digital product' });
    }
  }
};

