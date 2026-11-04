const MarketplaceProduct = require('../models/MarketplaceProduct');
const MarketplaceCategory = require('../models/MarketplaceCategory');

/**
 * GET /api/marketplace/categories
 * List active marketplace categories with product counts
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await MarketplaceCategory.find({ status: 'ACTIVE' })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    // Attach product count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await MarketplaceProduct.countDocuments({
          category: cat._id,
          status: 'APPROVED'
        });
        return { ...cat, productCount: count };
      })
    );

    res.json({
      success: true,
      categories: categoriesWithCounts
    });
  } catch (error) {
    console.error('Error fetching marketplace categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

/**
 * GET /api/marketplace/products
 * Public products catalog with search, filter, sort and pagination
 */
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      fileType,
      sort = 'latest',
      page = 1,
      limit = 12,
      featured
    } = req.query;

    const filter = { status: 'APPROVED' };

    if (category) {
      // Find category by slug or ID
      const catDoc = await MarketplaceCategory.findOne({
        $or: [{ slug: category }, { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }]
      });
      if (catDoc) {
        filter.category = catDoc._id;
      }
    }

    if (search && search.trim()) {
      const q = escapeRegex(search);
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (fileType) {
      filter['digitalFile.fileExtension'] = fileType.toLowerCase();
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { salesCount: -1 };
    else if (sort === 'rating') sortOption = { averageRating: -1 };
    else if (sort === 'price_low') sortOption = { price: 1 };
    else if (sort === 'price_high') sortOption = { price: -1 };
    else if (sort === 'views') sortOption = { viewsCount: -1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      MarketplaceProduct.find(filter)
        .populate('category', 'name slug icon')
        .select('-digitalFile.storedFileName') // NEVER expose stored private file name
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MarketplaceProduct.countDocuments(filter)
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

const { escapeRegex } = require('../utils/searchHelper');

/**
 * GET /api/marketplace/home
 * Returns curated sections for the marketplace home page
 */
exports.getHomeData = async (req, res) => {
  try {
    const [featured, latest, popular, categories, stats] = await Promise.all([
      MarketplaceProduct.find({ status: 'APPROVED', isFeatured: true })
        .populate('category', 'name slug icon')
        .select('-digitalFile.storedFileName')
        .sort({ salesCount: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      MarketplaceProduct.find({ status: 'APPROVED' })
        .populate('category', 'name slug icon')
        .select('-digitalFile.storedFileName')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      MarketplaceProduct.find({ status: 'APPROVED' })
        .populate('category', 'name slug icon')
        .select('-digitalFile.storedFileName')
        .sort({ salesCount: -1 })
        .limit(8)
        .lean(),
      MarketplaceCategory.find({ status: 'ACTIVE' })
        .sort({ displayOrder: 1, name: 1 })
        .limit(10)
        .lean(),
      MarketplaceProduct.aggregate([
        { $match: { status: 'APPROVED' } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalSales: { $sum: '$salesCount' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      featured,
      latest,
      popular,
      categories,
      stats: {
        totalProducts: stats[0]?.totalProducts || 0,
        totalSales: stats[0]?.totalSales || 0
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace home data:', error);
    res.status(500).json({ success: false, message: 'Failed to load marketplace home' });
  }
};

/**
 * GET /api/marketplace/products/:slugOrId
 * Product detail page (public)
 */
exports.getProductDetails = async (req, res) => {
  try {
    const { slugOrId } = req.params;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugOrId);
    const query = isObjectId
      ? { $or: [{ _id: slugOrId }, { slug: slugOrId }] }
      : { slug: slugOrId };

    const product = await MarketplaceProduct.findOne(query)
      .populate('category', 'name slug icon')
      .select('-digitalFile.storedFileName')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Digital product not found' });
    }

    // Increment views count asynchronously
    MarketplaceProduct.updateOne({ _id: product._id }, { $inc: { viewsCount: 1 } }).catch(() => {});

    // Fetch related products in the same category
    const relatedProducts = await MarketplaceProduct.find({
      category: product.category?._id,
      status: 'APPROVED',
      _id: { $ne: product._id }
    })
      .select('-digitalFile.storedFileName')
      .sort({ salesCount: -1 })
      .limit(4)
      .lean();

    res.json({
      success: true,
      product,
      relatedProducts
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product details' });
  }
};

