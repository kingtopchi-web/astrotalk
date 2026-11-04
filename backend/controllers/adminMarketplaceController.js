const MarketplaceProduct = require('../models/MarketplaceProduct');
const MarketplaceCategory = require('../models/MarketplaceCategory');
const MarketplaceOrder = require('../models/MarketplaceOrder');
const MarketplaceEarning = require('../models/MarketplaceEarning');
const MarketplaceReview = require('../models/MarketplaceReview');
const Setting = require('../models/Setting');
const { escapeRegex } = require('../utils/searchHelper');
const { sendNotification } = require('../utils/notificationDispatcher');

/**
 * GET /api/admin/marketplace/products
 * List all products for moderation
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { status, search, category, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (search && search.trim()) {
      const q = escapeRegex(search);
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { sellerName: { $regex: q, $options: 'i' } },
        { sellerEmail: { $regex: q, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [products, total, counts] = await Promise.all([
      MarketplaceProduct.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MarketplaceProduct.countDocuments(filter),
      MarketplaceProduct.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const statusCounts = { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0, SUSPENDED: 0, DRAFT: 0 };
    counts.forEach(c => {
      if (statusCounts[c._id] !== undefined) statusCounts[c._id] = c.count;
      statusCounts.ALL += c.count;
    });

    res.json({
      success: true,
      products,
      statusCounts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching admin marketplace products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

/**
 * PATCH /api/admin/marketplace/products/:id/status
 * Moderation action: Approve, Reject, Suspend
 */
exports.updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, isFeatured } = req.body;

    const product = await MarketplaceProduct.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (status) {
      product.status = status;
      if (status === 'REJECTED') {
        product.rejectionReason = rejectionReason || 'Content did not meet marketplace quality guidelines';
      } else if (status === 'APPROVED') {
        product.rejectionReason = '';
      }
    }

    if (isFeatured !== undefined) {
      product.isFeatured = !!isFeatured;
    }

    await product.save();

    // Notify seller
    const io = req.app.get('io');
    if (status === 'APPROVED') {
      sendNotification({
        recipient: product.sellerId,
        recipientRole: product.sellerModel === 'Expert' ? 'EXPERT' : 'USER',
        recipientModel: product.sellerModel,
        title: 'Product Approved & Published!',
        message: `Your digital product "${product.title}" has been approved by Admin and is now live on the marketplace.`,
        link: `/marketplace/products/${product.slug}`,
        actionText: 'View in Shop',
        type: 'general',
        badge: 'Approved'
      }, io).catch(() => {});
    } else if (status === 'REJECTED') {
      sendNotification({
        recipient: product.sellerId,
        recipientRole: product.sellerModel === 'Expert' ? 'EXPERT' : 'USER',
        recipientModel: product.sellerModel,
        title: 'Product Submission Rejected',
        message: `Your product "${product.title}" was rejected: ${product.rejectionReason}`,
        link: '/marketplace/seller',
        actionText: 'Update Product',
        type: 'general',
        badge: 'Rejected'
      }, io).catch(() => {});
    }

    res.json({
      success: true,
      message: `Product status updated to ${product.status}`,
      product
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ success: false, message: 'Failed to update product status' });
  }
};

/**
 * Categories Management
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await MarketplaceCategory.find().sort({ displayOrder: 1, name: 1 }).lean();
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, displayOrder } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const existing = await MarketplaceCategory.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const category = new MarketplaceCategory({
      name: name.trim(),
      slug,
      description: description || '',
      icon: icon || 'package',
      displayOrder: Number(displayOrder) || 0
    });
    await category.save();

    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, status, displayOrder } = req.body;

    const category = await MarketplaceCategory.findById(id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (icon) category.icon = icon;
    if (status) category.status = status;
    if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);

    await category.save();
    res.json({ success: true, message: 'Category updated successfully', category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const productsInCat = await MarketplaceProduct.countDocuments({ category: id });
    if (productsInCat > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: contains ${productsInCat} product(s). Please reassign or delete them first.`
      });
    }

    await MarketplaceCategory.findByIdAndDelete(id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};

/**
 * GET /api/admin/marketplace/orders
 * List all orders
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.paymentStatus = status;
    }

    if (search && search.trim()) {
      const q = escapeRegex(search);
      filter.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { buyerName: { $regex: q, $options: 'i' } },
        { buyerEmail: { $regex: q, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      MarketplaceOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MarketplaceOrder.countDocuments(filter)
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

/**
 * POST /api/admin/marketplace/orders/:id/refund
 * Process refund on order: revokes download access and updates ledger
 */
exports.refundOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Customer refund requested' } = req.body;

    const order = await MarketplaceOrder.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.paymentStatus === 'REFUNDED') {
      return res.status(400).json({ success: false, message: 'Order is already marked refunded' });
    }

    order.paymentStatus = 'REFUNDED';
    order.orderStatus = 'REFUNDED';
    order.refundDetails = {
      refundedAt: new Date(),
      refundId: `REF_${Date.now()}`,
      amount: order.totalAmount,
      reason
    };

    // Revoke download access on all items
    order.items.forEach(item => {
      item.downloadAccessRevoked = true;
    });
    await order.save();

    // Mark seller earnings as REFUNDED
    await MarketplaceEarning.updateMany(
      { order: order._id },
      { $set: { status: 'REFUNDED' } }
    );

    // Notify buyer
    const io = req.app.get('io');
    sendNotification({
      recipient: order.buyerId,
      recipientRole: order.buyerModel === 'Expert' ? 'EXPERT' : 'USER',
      recipientModel: order.buyerModel,
      title: 'Marketplace Purchase Refunded',
      message: `Your order #${order.orderNumber} (₹${order.totalAmount}) has been refunded. Reason: ${reason}. Digital download access has been revoked.`,
      type: 'refund_request',
      badge: 'Refund'
    }, io).catch(() => {});

    res.json({
      success: true,
      message: 'Order refunded successfully and digital download access revoked.',
      order
    });
  } catch (error) {
    console.error('Error refunding order:', error);
    res.status(500).json({ success: false, message: 'Failed to process refund' });
  }
};

/**
 * GET /api/admin/marketplace/earnings
 * Financial overview of marketplace
 */
exports.getEarningsOverview = async (req, res) => {
  try {
    const [earnings, topProducts] = await Promise.all([
      MarketplaceEarning.find().populate('product', 'title price').lean(),
      MarketplaceProduct.find({ status: 'APPROVED' })
        .sort({ salesCount: -1 })
        .limit(5)
        .select('title price salesCount averageRating')
        .lean()
    ]);

    let totalVolume = 0;
    let totalCommission = 0;
    let totalSellerEarnings = 0;

    earnings.forEach(e => {
      if (e.status !== 'REFUNDED') {
        totalVolume += e.grossAmount;
        totalCommission += e.commissionAmount;
        totalSellerEarnings += e.netEarnings;
      }
    });

    res.json({
      success: true,
      totals: {
        grossSales: totalVolume,
        platformCommission: totalCommission,
        sellerPayoutDue: totalSellerEarnings,
        orderCount: earnings.length
      },
      summary: {
        totalVolume,
        totalCommission,
        totalSellerEarnings,
        totalTransactions: earnings.length
      },
      topProducts,
      recentEarnings: earnings.slice(-20).reverse()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch earnings overview' });
  }
};

/**
 * Settings
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' }).lean();
    res.json({
      success: true,
      settings: {
        marketplaceCommissionRate: settings?.marketplaceCommissionRate ?? 10,
        marketplaceAllowedExtensions: settings?.marketplaceAllowedExtensions || [
          'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'zip', 'rar', 'csv', 'txt', 'mp3', 'mp4'
        ],
        marketplaceMaxFileSizeMb: settings?.marketplaceMaxFileSizeMb ?? 50,
        marketplaceAutoApprove: !!settings?.marketplaceAutoApprove
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load marketplace settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const {
      marketplaceCommissionRate,
      marketplaceAllowedExtensions,
      marketplaceMaxFileSizeMb,
      marketplaceAutoApprove
    } = req.body;

    const settings = await Setting.findOneAndUpdate(
      { singletonKey: 'GLOBAL_SETTINGS' },
      {
        $set: {
          marketplaceCommissionRate: Number(marketplaceCommissionRate) || 10,
          marketplaceAllowedExtensions: Array.isArray(marketplaceAllowedExtensions)
            ? marketplaceAllowedExtensions.map(e => e.toLowerCase().trim().replace('.', ''))
            : ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'zip', 'rar', 'csv', 'txt', 'mp3', 'mp4'],
          marketplaceMaxFileSizeMb: Number(marketplaceMaxFileSizeMb) || 50,
          marketplaceAutoApprove: !!marketplaceAutoApprove
        }
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Marketplace configuration saved successfully',
      settings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

/**
 * Reviews moderation
 */
exports.getReviews = async (req, res) => {
  try {
    const reviews = await MarketplaceReview.find()
      .populate('product', 'title coverImage')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
};

exports.updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const review = await MarketplaceReview.findByIdAndUpdate(id, { status }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    res.json({ success: true, message: `Review status changed to ${status}`, review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update review' });
  }
};

