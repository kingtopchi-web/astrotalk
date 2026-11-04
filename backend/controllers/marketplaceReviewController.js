const MarketplaceReview = require('../models/MarketplaceReview');
const MarketplaceOrder = require('../models/MarketplaceOrder');
const MarketplaceProduct = require('../models/MarketplaceProduct');

/**
 * POST /api/marketplace/reviews
 * Submit a review for a purchased digital product
 */
exports.addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';

    if (!productId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Product ID, rating, and comment are required' });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Verify verified purchase
    const order = await MarketplaceOrder.findOne({
      buyerId: userId,
      buyerModel: userModel,
      paymentStatus: 'PAID',
      'items.product': productId
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'Only verified buyers who purchased this product can leave a review'
      });
    }

    // Check if review already exists
    let review = await MarketplaceReview.findOne({ product: productId, userId });
    if (review) {
      review.rating = numRating;
      review.comment = comment.trim();
      await review.save();
    } else {
      review = new MarketplaceReview({
        product: productId,
        order: order._id,
        userId,
        userModel,
        userName: req.user.name,
        rating: numRating,
        comment: comment.trim(),
        isVerifiedPurchase: true,
        status: 'PUBLISHED'
      });
      await review.save();
    }

    // Recalculate product rating
    const allReviews = await MarketplaceReview.find({ product: productId, status: 'PUBLISHED' });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / (allReviews.length || 1);

    await MarketplaceProduct.findByIdAndUpdate(productId, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: allReviews.length
    });

    res.json({
      success: true,
      message: 'Thank you! Your review has been submitted.',
      review
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
};

/**
 * GET /api/marketplace/reviews/:productId
 * Get reviews for a product
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      MarketplaceReview.find({ product: productId, status: 'PUBLISHED' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MarketplaceReview.countDocuments({ product: productId, status: 'PUBLISHED' })
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve reviews' });
  }
};

