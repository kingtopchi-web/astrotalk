
const crypto = require('crypto');
const User = require('../models/User');
const Expert = require('../models/Expert');
const PayoutTransaction = require('../models/PayoutTransaction');
const MarketplaceProduct = require('../models/MarketplaceProduct');
const MarketplaceOrder = require('../models/MarketplaceOrder');
const MarketplaceEarning = require('../models/MarketplaceEarning');
const MarketplaceCategory = require('../models/MarketplaceCategory');
const Setting = require('../models/Setting');
const fileService = require('../services/MarketplaceFileService');
const { sendNotification } = require('../utils/notificationDispatcher');

/**
 * Helper to generate URL-safe unique slug
 */
function generateSlug(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return `${base}-${Date.now().toString().slice(-6)}`;
}

/**
 * POST /api/marketplace/seller/products
 * Add new digital product for sale (User or Expert)
 */
exports.addProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';
    const {
      title,
      description,
      features,
      terms,
      price,
      discountedPrice,
      categoryId,
      coverImage,
      digitalFile, // base64 or object { fileData, originalName }
      previewImages = [],
      tags = [],
      copyrightConfirmed
    } = req.body;

    if (!title || !description || !price || !categoryId || !coverImage || !digitalFile) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, price, category, cover image, and digital product file are required'
      });
    }

    if (!copyrightConfirmed) {
      return res.status(400).json({
        success: false,
        message: 'You must confirm ownership and rights to sell this digital content'
      });
    }

    // Verify category exists
    const category = await MarketplaceCategory.findById(categoryId);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Invalid category selected' });
    }

    // Process and store the digital file securely
    const rawFileData = digitalFile.fileData || digitalFile;
    const originalFileName = digitalFile.originalName || `${title.replace(/\s+/g, '_')}.dat`;
    const savedFileMeta = await fileService.processAndSaveFile(rawFileData, originalFileName);

    // Check auto-approve setting
    const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' }).lean();
    const autoApprove = !!settings?.marketplaceAutoApprove;
    const status = autoApprove ? 'APPROVED' : 'PENDING';

    const slug = generateSlug(title);

    const product = new MarketplaceProduct({
      title: title.trim(),
      slug,
      description: description.trim(),
      features: Array.isArray(features) ? features : (typeof features === 'string' ? features.split('\n').filter(Boolean) : []),
      terms: terms || undefined,
      price: Number(price),
      discountedPrice: discountedPrice ? Number(discountedPrice) : null,
      category: category._id,
      coverImage,
      previewImages: Array.isArray(previewImages) ? previewImages : [],
      digitalFile: savedFileMeta,
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim().toLowerCase()) : []),
      sellerId: userId,
      sellerModel: userModel,
      sellerName: req.user.name,
      sellerEmail: req.user.email,
      status,
      copyrightConfirmed: true
    });

    await product.save();

    // Notify Admin of new product submission
    if (status === 'PENDING') {
      try {
        const io = req.app.get('io');
        sendNotification({
          recipientRole: 'ADMIN',
          recipientModel: 'Admin',
          title: 'New Digital Product Submitted',
          message: `${req.user.name} submitted "${product.title}" for marketplace approval.`,
          link: '/marketplace-management',
          actionText: 'Review Product',
          type: 'general',
          badge: 'Product'
        }, io).catch(() => {});
      } catch (e) {}
    }

    res.status(201).json({
      success: true,
      message: autoApprove
        ? 'Digital product created and published successfully!'
        : 'Digital product submitted successfully! Pending Admin moderation.',
      product: {
        _id: product._id,
        title: product.title,
        slug: product.slug,
        status: product.status,
        price: product.price
      }
    });
  } catch (error) {
    console.error('Error adding digital product:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to add digital product' });
  }
};

/**
 * PUT /api/marketplace/seller/products/:id
 * Edit existing product owned by the seller
 */
exports.editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const product = await MarketplaceProduct.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Verify ownership
    if (product.sellerId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this product' });
    }

    const {
      title,
      description,
      features,
      terms,
      price,
      discountedPrice,
      categoryId,
      coverImage,
      previewImages,
      tags,
      digitalFile
    } = req.body;

    if (title) product.title = title.trim();
    if (description) product.description = description.trim();
    if (features) product.features = Array.isArray(features) ? features : features.split('\n').filter(Boolean);
    if (terms) product.terms = terms;
    if (price != null) product.price = Number(price);
    if (discountedPrice !== undefined) product.discountedPrice = discountedPrice ? Number(discountedPrice) : null;
    if (coverImage) product.coverImage = coverImage;
    if (previewImages) product.previewImages = previewImages;
    if (tags) product.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim().toLowerCase());

    if (categoryId) {
      const category = await MarketplaceCategory.findById(categoryId);
      if (category) product.category = category._id;
    }

    // If new digital file was provided, replace it
    if (digitalFile && (digitalFile.fileData || typeof digitalFile === 'string')) {
      const rawFileData = digitalFile.fileData || digitalFile;
      const originalFileName = digitalFile.originalName || `${product.title}.dat`;
      const savedFileMeta = await fileService.processAndSaveFile(rawFileData, originalFileName);

      // Delete old file
      if (product.digitalFile?.storedFileName) {
        fileService.deleteFile(product.digitalFile.storedFileName).catch(() => {});
      }
      product.digitalFile = savedFileMeta;

      // Re-trigger pending review when critical asset changes
      product.status = 'PENDING';
    }

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to update product' });
  }
};

/**
 * DELETE /api/marketplace/seller/products/:id
 * Delete or unpublish product
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const product = await MarketplaceProduct.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.sellerId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: not your product' });
    }

    // If product has been purchased, do NOT hard-delete to preserve buyer download access
    if (product.salesCount > 0) {
      product.status = 'DRAFT'; // unpublishes from catalog
      await product.save();
      return res.json({
        success: true,
        message: 'Product unpublished. Existing buyers can still access their purchased downloads.'
      });
    }

    // If never sold, safe to remove file and document
    if (product.digitalFile?.storedFileName) {
      fileService.deleteFile(product.digitalFile.storedFileName).catch(() => {});
    }
    await MarketplaceProduct.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};

/**
 * GET /api/marketplace/seller/dashboard
 * Seller financial metrics, products overview, and recent sales
 */
exports.getSellerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';

    // Automatically release pending earnings whose hold period has elapsed
    await MarketplaceEarning.updateMany(
      {
        sellerId: userId,
        sellerModel: userModel,
        status: 'PENDING',
        availableAt: { $lte: new Date() }
      },
      { $set: { status: 'AVAILABLE' } }
    );

    const [products, earnings, orders, existingPayouts] = await Promise.all([
      MarketplaceProduct.find({ sellerId: userId, sellerModel: userModel })
        .populate('category', 'name slug')
        .select('-digitalFile.storedFileName')
        .sort({ createdAt: -1 })
        .lean(),
      MarketplaceEarning.find({ sellerId: userId, sellerModel: userModel }).lean(),
      MarketplaceOrder.find({
        'items.sellerId': userId,
        paymentStatus: 'PAID'
      })
        .select('orderNumber createdAt totalAmount items.price items.productTitle items.sellerId items.sellerEarnings items.downloadCount')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      PayoutTransaction.find({
        $or: [
          { recipientId: userId, recipientModel: userModel },
          { expert: userId, payoutType: 'MARKETPLACE_SELLER' }
        ],
        payoutType: 'MARKETPLACE_SELLER',
        status: { $in: ['VERIFICATION_PENDING', 'PENDING', 'QUEUED', 'PROCESSING', 'PROCESSED'] }
      }).lean()
    ]);

    // Compute stats
    let totalSalesCount = 0;
    let grossRevenue = 0;
    let totalCommission = 0;
    let netEarnings = 0;
    let totalClearedEarnings = 0;
    let pendingClearanceBalance = 0;

    earnings.forEach(e => {
      grossRevenue += (e.grossAmount || 0);
      totalCommission += (e.commissionAmount || 0);
      netEarnings += (e.netEarnings || 0);
      if (e.status === 'AVAILABLE') {
        totalClearedEarnings += (e.netEarnings || 0);
      } else if (e.status === 'PENDING') {
        pendingClearanceBalance += (e.netEarnings || 0);
      }
    });

    const totalClaimed = (existingPayouts || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const availableBalance = Math.max(0, Math.floor(totalClearedEarnings - totalClaimed));

    products.forEach(p => {
      totalSalesCount += (p.salesCount || 0);
    });

    // Format recent sales
    const recentSales = [];
    orders.forEach(order => {
      order.items
        .filter(item => item.sellerId.toString() === userId.toString())
        .forEach(item => {
          recentSales.push({
            orderNumber: order.orderNumber,
            date: order.createdAt,
            productTitle: item.productTitle,
            price: item.price,
            netEarning: item.sellerEarnings,
            downloads: item.downloadCount
          });
        });
    });

    res.json({
      success: true,
      stats: {
        totalProducts: products.length,
        publishedProducts: products.filter(p => p.status === 'APPROVED').length,
        pendingProducts: products.filter(p => p.status === 'PENDING').length,
        rejectedProducts: products.filter(p => p.status === 'REJECTED').length,
        totalSales: totalSalesCount,
        grossRevenue,
        totalCommission,
        netEarnings,
        availableBalance,
        totalWithdrawn: totalClaimed,
        pendingClearanceBalance
      },
      products,
      recentSales: recentSales.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching seller dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve seller dashboard' });
  }
};


/**
 * GET /api/marketplace/seller/payout-status
 * Get seller bank details, available payout balance, active penny drop verification, and payout history
 */
exports.getSellerPayoutStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';
    const Model = userModel === 'Expert' ? Expert : User;

    const sellerDoc = await Model.findById(userId).lean();
    if (!sellerDoc) return res.status(404).json({ success: false, message: 'Seller not found' });

    // Auto-release any pending earnings whose holding period has passed
    await MarketplaceEarning.updateMany(
      {
        sellerId: userId,
        sellerModel: userModel,
        status: 'PENDING',
        availableAt: { $lte: new Date() }
      },
      { $set: { status: 'AVAILABLE' } }
    );

    // Sum all AVAILABLE earnings
    const availableEarnings = await MarketplaceEarning.find({
      sellerId: userId,
      sellerModel: userModel,
      status: 'AVAILABLE'
    }).lean();

    const totalClearedEarnings = availableEarnings.reduce((sum, e) => sum + (e.netEarnings || 0), 0);

    // Sum claimed payouts
    const existingPayouts = await PayoutTransaction.find({
      $or: [
        { recipientId: userId, recipientModel: userModel },
        { expert: userId, payoutType: 'MARKETPLACE_SELLER' }
      ],
      status: { $in: ['VERIFICATION_PENDING', 'PENDING', 'QUEUED', 'PROCESSING', 'PROCESSED'] }
    }).sort({ createdAt: -1 }).lean();

    const totalClaimed = existingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const availableForPayout = Math.max(0, Math.floor(totalClearedEarnings - totalClaimed));

    // Active payout pending verification or processing
    const activePayout = existingPayouts.find(p => ['VERIFICATION_PENDING', 'PENDING', 'QUEUED', 'PROCESSING'].includes(p.status)) || null;

    const globalSetting = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' }).lean();
    const minPayoutAmount = Number(globalSetting?.minPayoutAmount ?? 100);

    res.json({
      success: true,
      bankDetails: sellerDoc.bankDetails || {},
      availableForPayout,
      totalClearedEarnings,
      totalClaimed,
      minPayoutAmount,
      activePayout,
      payoutHistory: existingPayouts
    });
  } catch (error) {
    console.error('Error in getSellerPayoutStatus:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve payout status', error: error.message });
  }
};

/**
 * POST /api/marketplace/seller/bank-details
 * Save or update seller bank details for marketplace payouts (User or Expert)
 */
exports.saveSellerBankDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';
    const Model = userModel === 'Expert' ? Expert : User;

    const { accountName, accountNumber, ifscCode, bankName, upiId, passbookImage } = req.body;

    if (!accountName || !accountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        message: 'Account Holder Name, Account Number, and IFSC Code are required.'
      });
    }

    const cleanIfsc = ifscCode.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      return res.status(400).json({ success: false, message: 'Invalid IFSC code format (e.g. SBIN0001234)' });
    }

    const sellerDoc = await Model.findById(userId);
    if (!sellerDoc) return res.status(404).json({ success: false, message: 'Seller not found' });

    const finalPassbookImage = passbookImage || sellerDoc.bankDetails?.passbookImage;
    if (userModel === 'User' && !finalPassbookImage) {
      return res.status(400).json({
        success: false,
        message: 'Bank passbook or cancelled cheque image is required for bank verification.'
      });
    }

    sellerDoc.bankDetails = {
      ...(sellerDoc.bankDetails || {}),
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: cleanIfsc,
      bankName: (bankName || '').trim(),
      upiId: (upiId || '').trim(),
      passbookImage: finalPassbookImage,
      isVerified: userModel === 'Expert' ? true : false,
      verificationStatus: userModel === 'Expert' ? 'APPROVED' : 'PENDING',
      rejectionReason: '',
      submittedAt: new Date()
    };

    await sellerDoc.save();

    // Notify Admin that user submitted bank details for verification
    if (userModel === 'User') {
      try {
        const io = req.app.get('io');
        sendNotification({
          recipientRole: 'ADMIN',
          recipientModel: 'Admin',
          title: 'User Bank Passbook Submitted',
          message: `${sellerDoc.name} has submitted bank details and passbook photo for marketplace payouts verification.`,
          actionText: 'Review Bank Details',
          link: '/users',
          type: 'bank_verification_request',
          badge: 'Bank Review'
        }, io).catch(() => {});
      } catch (e) {}
    }

    res.json({
      success: true,
      message: userModel === 'User'
        ? 'Bank details and passbook submitted successfully! Verification is currently pending review by Admin.'
        : 'Bank details saved successfully for digital marketplace payouts!',
      bankDetails: sellerDoc.bankDetails
    });
  } catch (error) {
    console.error('Error saving seller bank details:', error);
    res.status(500).json({ success: false, message: 'Failed to save bank details', error: error.message });
  }
};

/**
 * POST /api/marketplace/seller/request-payout
 * Request payout for marketplace earnings with ₹1 Penny-Drop verification
 */
exports.requestSellerPayout = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';
    const Model = userModel === 'Expert' ? Expert : User;

    const sellerDoc = await Model.findById(userId);
    if (!sellerDoc) return res.status(404).json({ success: false, message: 'Seller not found' });

    const bankDetails = sellerDoc.bankDetails;
    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountName) {
      return res.status(400).json({
        success: false,
        message: 'Please add and save your bank details (Account Name, Account Number, IFSC) before requesting a payout.'
      });
    }

    // Enforce bank passbook verification for User (Marketplace Seller)
    if (userModel === 'User' && bankDetails.verificationStatus !== 'APPROVED') {
      const vStatus = bankDetails.verificationStatus || 'NOT_SUBMITTED';
      let message = 'Bank passbook verification is required before requesting a payout.';
      if (vStatus === 'PENDING') {
        message = 'Aapki bank passbook aur details abhi Admin review ke liye pending hain. Admin dwara approve hone ke baad hi payout request kiya ja sakta hai.';
      } else if (vStatus === 'REJECTED') {
        message = `Aapki bank verification Admin dwara reject ho gayi hai: "${bankDetails.rejectionReason || 'Apspasht passbook document'}". Kripya sahi passbook/cheque upload karke re-submit karein.`;
      } else {
        message = 'Kripya pehle apni bank passbook/cheque ki photo upload karein aur bank details verify karwayen.';
      }
      return res.status(400).json({
        success: false,
        message,
        verificationStatus: vStatus
      });
    }

    // Check existing active pending payout
    const activePending = await PayoutTransaction.findOne({
      $or: [
        { recipientId: userId, recipientModel: userModel },
        { expert: userId, payoutType: 'MARKETPLACE_SELLER' }
      ],
      status: { $in: ['VERIFICATION_PENDING', 'PENDING', 'QUEUED', 'PROCESSING'] }
    });

    if (activePending) {
      return res.status(400).json({
        success: false,
        message: `You already have an active payout in progress of ₹${activePending.amount} (Status: ${activePending.status}).`
      });
    }

    // Compute available balance
    const availableEarnings = await MarketplaceEarning.find({
      sellerId: userId,
      sellerModel: userModel,
      status: 'AVAILABLE'
    });
    const totalClearedEarnings = availableEarnings.reduce((sum, e) => sum + (e.netEarnings || 0), 0);

    const existingPayouts = await PayoutTransaction.find({
      $or: [
        { recipientId: userId, recipientModel: userModel },
        { expert: userId, payoutType: 'MARKETPLACE_SELLER' }
      ],
      status: { $in: ['VERIFICATION_PENDING', 'PENDING', 'QUEUED', 'PROCESSING', 'PROCESSED'] }
    });
    const totalClaimed = existingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const availableForPayout = Math.max(0, Math.floor(totalClearedEarnings - totalClaimed));

    const globalSetting = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' }).lean();
    const minPayoutAmount = Number(globalSetting?.minPayoutAmount ?? 100);

    if (availableForPayout < minPayoutAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum payout request amount is ₹${minPayoutAmount}. Your available marketplace earnings balance is ₹${availableForPayout}.`,
        availableForPayout
      });
    }

    const defaultPayoutAccount = globalSetting?.defaultPayoutAccount || 'RAZORPAY_1';
    const internalTransactionId = `MKT_PAYOUT_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const idempotencyKey = `IDEMP_MKT_${userId}_${availableForPayout}_${Date.now()}`;
    const pennyDropRef = `PENNY_MKT_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const remainingBalance = Math.max(0, availableForPayout - 1);

    const payoutRecord = new PayoutTransaction({
      recipientId: userId,
      recipientModel: userModel,
      expert: userModel === 'Expert' ? userId : undefined,
      payoutType: 'MARKETPLACE_SELLER',
      amount: availableForPayout,
      pennyDropAmount: 1,
      remainingAmount: remainingBalance,
      pennyDropConfirmed: false,
      pennyDropTransactionRef: pennyDropRef,
      currency: 'INR',
      accountCode: defaultPayoutAccount,
      status: 'VERIFICATION_PENDING',
      internalTransactionId,
      idempotencyKey,
      bankDetails: {
        accountHolderName: bankDetails.accountName || sellerDoc.name,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        bankName: bankDetails.bankName,
        upiId: bankDetails.upiId,
        passbookImage: bankDetails.passbookImage,
        bankVerificationStatus: bankDetails.verificationStatus || 'APPROVED'
      },
      notes: {
        requestedVia: 'marketplace_seller_dashboard',
        sellerName: sellerDoc.name,
        sellerModel: userModel,
        pennyDropInitiatedAt: new Date()
      }
    });

    await payoutRecord.save();

    const io = req.app.get('io');

    // Notify Administrator
    sendNotification({
      recipientRole: 'ADMIN',
      recipientModel: 'Admin',
      title: '₹1 Bank Verification Sent (Marketplace Seller Payout)',
      message: `₹1 verification transfer sent to ${sellerDoc.name} (${userModel} Seller). Total requested: ₹${availableForPayout}.`,
      actionText: 'Review Payouts',
      link: '/razorpay-accounts',
      type: 'payout_request',
      badge: 'Verification'
    }, io).catch(e => console.error(e));

    // Notify Seller
    sendNotification({
      recipient: userId,
      recipientRole: userModel === 'Expert' ? 'EXPERT' : 'USER',
      recipientModel: userModel,
      title: '₹1 Verification Amount Sent!',
      message: `Aapke bank account mein verification ke liye ₹1 bhej diya gaya hai. Kripya check karein aur confirm karein taaki remaining ₹${remainingBalance} transfer ho sake.`,
      actionText: 'Confirm ₹1 Receipt',
      link: '/marketplace/seller',
      type: 'payout_request',
      badge: 'Penny Drop'
    }, io).catch(e => console.error(e));

    res.status(201).json({
      success: true,
      requiresPennyDropConfirmation: true,
      pennyDropAmount: 1,
      remainingAmount: remainingBalance,
      totalAmount: availableForPayout,
      message: `Verification ke liye aapke bank account mein ₹1 bhej diya gaya hai. Kripya ₹1 prapt hone par confirm karein taaki baki bache ₹${remainingBalance} ka payout release ho sake.`,
      payoutId: payoutRecord._id,
      payout: payoutRecord
    });
  } catch (error) {
    console.error('Error requesting seller payout:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate payout request', error: error.message });
  }
};

/**
 * POST /api/marketplace/seller/payout/confirm-penny-drop
 * Seller confirms receipt of ₹1 verification, unlocking the remaining payout balance
 */
exports.confirmSellerPennyDrop = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';
    const { payoutId } = req.body;

    const payout = await PayoutTransaction.findOne({
      _id: payoutId,
      $or: [
        { recipientId: userId, recipientModel: userModel },
        { expert: userId, payoutType: 'MARKETPLACE_SELLER' }
      ],
      status: 'VERIFICATION_PENDING'
    });

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Active ₹1 verification request not found for this payout.'
      });
    }

    payout.pennyDropConfirmed = true;
    payout.pennyDropConfirmedAt = new Date();
    payout.status = 'PENDING'; // Ready for remaining balance payout processing
    await payout.save();

    const io = req.app.get('io');

    // Notify Administrator
    sendNotification({
      recipientRole: 'ADMIN',
      recipientModel: 'Admin',
      title: '₹1 Verification Confirmed by Seller',
      message: `${payout.bankDetails?.accountHolderName || 'Seller'} has confirmed receipt of ₹1. Remaining balance of ₹${payout.remainingAmount} is approved for payout dispatch.`,
      actionText: 'Disburse Payout',
      link: '/razorpay-accounts',
      type: 'payout_request',
      badge: 'Verified'
    }, io).catch(e => console.error(e));

    // Notify Seller
    sendNotification({
      recipient: userId,
      recipientRole: userModel === 'Expert' ? 'EXPERT' : 'USER',
      recipientModel: userModel,
      title: '₹1 Received Confirmed!',
      message: `Verification confirm ho gayi hai! Baki bacha amount ₹${payout.remainingAmount} (1 rupya deduct karke) process kiya ja raha hai.`,
      actionText: 'View Sales',
      link: '/marketplace/seller',
      type: 'payout_processed',
      badge: 'Processing'
    }, io).catch(e => console.error(e));

    res.json({
      success: true,
      message: `Verification successful! ₹1 confirm hone ke baad remaining ₹${payout.remainingAmount} payout ke liye schedule ho gaya hai.`,
      payout
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to confirm verification', error: error.message });
  }
};

/**
 * POST /api/marketplace/seller/payout/cancel
 * Cancel a pending penny-drop payout request
 */
exports.cancelSellerPayout = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';
    const { payoutId } = req.body;

    const payout = await PayoutTransaction.findOne({
      _id: payoutId,
      $or: [
        { recipientId: userId, recipientModel: userModel },
        { expert: userId, payoutType: 'MARKETPLACE_SELLER' }
      ],
      status: 'VERIFICATION_PENDING'
    });

    if (!payout) {
      return res.status(404).json({ success: false, message: 'Active pending verification payout not found.' });
    }

    payout.status = 'CANCELLED';
    payout.failureReason = 'Cancelled by seller prior to verification';
    await payout.save();

    res.json({ success: true, message: 'Payout request cancelled. Balance restored to your earnings.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel payout', error: error.message });
  }
};
