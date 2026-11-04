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

    const [products, earnings, orders] = await Promise.all([
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
        .lean()
    ]);

    // Compute stats
    let totalSalesCount = 0;
    let grossRevenue = 0;
    let totalCommission = 0;
    let netEarnings = 0;
    let availableBalance = 0;

    earnings.forEach(e => {
      grossRevenue += e.grossAmount;
      totalCommission += e.commissionAmount;
      netEarnings += e.netEarnings;
      if (e.status === 'AVAILABLE') {
        availableBalance += e.netEarnings;
      }
    });

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
        availableBalance
      },
      products,
      recentSales: recentSales.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching seller dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve seller dashboard' });
  }
};

