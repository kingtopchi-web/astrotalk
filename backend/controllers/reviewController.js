const mongoose = require('mongoose');
const Review = require('../models/Review');
const Consultation = require('../models/Consultation');
const Expert = require('../models/Expert');
const { sendNotification } = require('../utils/notificationDispatcher');

/**
 * Re-calculate expert average rating and review count from PUBLISHED reviews only.
 */
async function updateExpertAggregateRating(expertId) {
  const expertObjId = expertId instanceof mongoose.Types.ObjectId ? expertId : new mongoose.Types.ObjectId(expertId);
  const stats = await Review.aggregate([
    { $match: { expert: expertObjId, status: 'PUBLISHED' } },
    {
      $group: {
        _id: '$expert',
        averageRating: { $avg: '$rating' },
        reviewsCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    const avg = Number(stats[0].averageRating.toFixed(1));
    const count = stats[0].reviewsCount;
    await Expert.findByIdAndUpdate(expertId, {
      rating: avg,
      reviewsCount: count
    });
    return { rating: avg, reviewsCount: count };
  } else {
    // If no published reviews left
    await Expert.findByIdAndUpdate(expertId, {
      rating: 0,
      reviewsCount: 0
    });
    return { rating: 0, reviewsCount: 0 };
  }
}

// @route   POST /api/reviews
// @desc    Submit a review for a completed consultation
// @access  Private (USER only)
exports.createReview = async (req, res) => {
  try {
    const { consultationId, rating, feedback } = req.body;

    // 1. Basic validation of consultationId
    if (!consultationId) {
      return res.status(400).json({ message: 'consultationId is required' });
    }

    // 2. Validate rating as an integer between 1 and 5
    if (rating === undefined || rating === null) {
      return res.status(400).json({ message: 'Rating is required' });
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    // Sanitize feedback string
    const trimmedFeedback = typeof feedback === 'string' ? feedback.trim() : '';
    if (trimmedFeedback.length > 2000) {
      return res.status(400).json({ message: 'Feedback must not exceed 2000 characters' });
    }

    // 3. Load consultation from DB
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // 4. Verify ownership: authenticated user must be the consultation user
    if (consultation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You are not authorized to review this consultation'
      });
    }

    // 5. Verify consultation is genuinely completed
    if (consultation.status !== 'completed') {
      return res.status(400).json({
        message: `Reviews are only allowed for completed consultations (current status: ${consultation.status})`
      });
    }

    // 6. Check if a review already exists for this consultation (application-level check)
    const existingReview = await Review.findOne({ consultation: consultationId });
    if (existingReview) {
      return res.status(409).json({
        message: 'A review has already been submitted for this consultation'
      });
    }

    // 7. Derive userId and expertId securely from trusted server records
    const expertId = consultation.expert;
    const userId = req.user._id;

    // 8. Create and persist review (with DB unique constraint safety)
    let review;
    try {
      review = await Review.create({
        consultation: consultationId,
        user: userId,
        expert: expertId,
        rating: numericRating,
        feedback: trimmedFeedback,
        status: 'PUBLISHED'
      });
    } catch (createErr) {
      // Handle race condition duplicate key error (E11000)
      if (createErr.code === 11000) {
        return res.status(409).json({
          message: 'A review has already been submitted for this consultation'
        });
      }
      throw createErr;
    }

    // 9. Update expert's aggregate rating and review count
    const updatedStats = await updateExpertAggregateRating(expertId);

    // 10. Notify expert in real time (non-blocking)
    const io = req.app.get('io');
    const expert = await Expert.findById(expertId).select('name');
    if (expert) {
      sendNotification({
        recipient: expertId,
        recipientRole: 'EXPERT',
        recipientModel: 'Expert',
        title: 'New Review Received',
        message: `${req.user.name || 'A client'} gave you a ${numericRating}-star review.`,
        actionText: 'View profile & reviews',
        link: `/expert/profile`,
        type: 'general',
        badge: 'New'
      }, io).catch(err => console.error('Review notification error:', err.message));
    }

    // 11. Populate user details for clean frontend response (omit password/internal tokens)
    await review.populate('user', 'name profileImage');

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: {
        _id: review._id,
        consultation: review.consultation,
        expert: review.expert,
        user: {
          _id: review.user._id,
          name: review.user.name,
          profileImage: review.user.profileImage
        },
        rating: review.rating,
        feedback: review.feedback,
        status: review.status,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      },
      expertStats: updatedStats
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ message: 'Internal server error while creating review' });
  }
};

// @route   GET /api/reviews/expert/:expertId
// @desc    Get all published reviews and rating distribution for an expert
// @access  Public
exports.getExpertReviews = async (req, res) => {
  try {
    const { expertId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { expert: expertId, status: 'PUBLISHED' };
    const expertObjId = new mongoose.Types.ObjectId(expertId);

    const [reviews, total, distributionAgg] = await Promise.all([
      Review.find(query)
        .populate('user', 'name profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('rating feedback user createdAt'),
      Review.countDocuments(query),
      Review.aggregate([
        { $match: { expert: expertObjId, status: 'PUBLISHED' } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Build 1-5 star distribution map
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumRating = 0;
    distributionAgg.forEach(item => {
      if (distribution[item._id] !== undefined) {
        distribution[item._id] = item.count;
        sumRating += item._id * item.count;
      }
    });

    const averageRating = total > 0 ? Number((sumRating / total).toFixed(1)) : 0;

    return res.json({
      success: true,
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit),
      averageRating,
      distribution
    });
  } catch (error) {
    console.error('Get expert reviews error:', error);
    return res.status(500).json({ message: 'Failed to fetch expert reviews' });
  }
};

// @route   GET /api/reviews/consultation/:consultationId
// @desc    Check if a consultation already has a review
// @access  Private (USER only)
exports.getConsultationReview = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const review = await Review.findOne({
      consultation: consultationId,
      user: req.user._id
    }).select('rating feedback createdAt status');

    return res.json({
      success: true,
      hasReviewed: !!review,
      review: review || null
    });
  } catch (error) {
    console.error('Get consultation review error:', error);
    return res.status(500).json({ message: 'Failed to check consultation review' });
  }
};

// @route   GET /api/reviews/my-reviews
// @desc    Get all reviews submitted by the logged-in user
// @access  Private (USER only)
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('expert', 'name specialty profileImage')
      .populate('consultation', 'type durationInMinutes startTime')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    return res.status(500).json({ message: 'Failed to fetch your reviews' });
  }
};
