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

// @route   GET /api/public/testimonials OR /api/reviews/top-reviews
// @desc    Fetch top rated published reviews for public testimonial carousel
// @access  Public
exports.getTopReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'PUBLISHED', rating: { $gte: 4 } })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'name profileImage')
      .populate('expert', 'name specialty');

    // Rich default testimonials to ensure full 9-item experience
    const seedTestimonials = [
      {
        _id: 'seed-1',
        rating: 5,
        feedback: "This app helped me to get a job in my dream company. I was stressed about getting opportunities after graduation. One prediction and consultation from an expert gave me a ray of hope and within a few months, I had an offer in hand. Thank you so much for helping me out!",
        userName: "Amar Thakur",
        userLocation: "Pune · India",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        createdAt: new Date().toISOString()
      },
      {
        _id: 'seed-2',
        rating: 5,
        feedback: "Dr. Ananya's preventive care consultation was life-changing. She patiently listened to my health concerns and gave practical lifestyle changes that improved my energy levels within weeks.",
        userName: "Pooja Sharma",
        userLocation: "Bengaluru · India",
        userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: 'seed-3',
        rating: 5,
        feedback: "Arjun Mehta helped us architect our entire cloud infrastructure. His technical depth and real-world experience saved our startup months of trial and error.",
        userName: "Vikram Malhotra",
        userLocation: "Delhi · India",
        userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        createdAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        _id: 'seed-4',
        rating: 5,
        feedback: "The legal consultation regarding our angel round term sheet was crisp and highly strategic. Adv. Rajesh spotted clauses that protected our founder equity.",
        userName: "Neha Bansal",
        userLocation: "Mumbai · India",
        userAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
        createdAt: new Date(Date.now() - 259200000).toISOString()
      },
      {
        _id: 'seed-5',
        rating: 5,
        feedback: "Got instant response in under 12 seconds for my urgent consultation. The video call was crystal clear and the expert gave actionable advice on the spot.",
        userName: "Rahul Verma",
        userLocation: "Hyderabad · India",
        userAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
        createdAt: new Date(Date.now() - 345600000).toISOString()
      },
      {
        _id: 'seed-6',
        rating: 5,
        feedback: "Sneha Kapoor's pitch deck strategy transformed our investor presentation. We secured our pre-seed funding within 3 weeks of implementing her feedback.",
        userName: "Ankit Jain",
        userLocation: "Jaipur · India",
        userAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
        createdAt: new Date(Date.now() - 432000000).toISOString()
      },
      {
        _id: 'seed-7',
        rating: 5,
        feedback: "The cognitive behavioral session helped me manage work anxiety effectively. Truly grateful for the empathy and professional conduct.",
        userName: "Divya Nair",
        userLocation: "Kochi · India",
        userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        createdAt: new Date(Date.now() - 518400000).toISOString()
      },
      {
        _id: 'seed-8',
        rating: 5,
        feedback: "Honest and transparent consultation. The expert didn't try to upsell anything, just gave honest valuation insights for our business.",
        userName: "Suresh Patel",
        userLocation: "Ahmedabad · India",
        userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
        createdAt: new Date(Date.now() - 604800000).toISOString()
      },
      {
        _id: 'seed-9',
        rating: 5,
        feedback: "Best consultation marketplace in India. Seamless recharge, instant connection, and verified experts who actually know their domains.",
        userName: "Meera Krishnan",
        userLocation: "Chennai · India",
        userAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
        createdAt: new Date(Date.now() - 691200000).toISOString()
      }
    ];

    // Format DB reviews
    const dbFormatted = reviews
      .filter(r => r.feedback && r.feedback.trim().length > 3)
      .map(r => ({
        _id: r._id,
        rating: r.rating,
        feedback: r.feedback,
        userName: r.user?.name || 'Verified Client',
        userLocation: r.expert?.name ? `Consulted with ${r.expert.name}` : 'Verified Client',
        userAvatar: r.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user?.name || 'User')}&background=F7C83C&color=000&bold=true`,
        expertConsulted: r.expert?.name || null,
        createdAt: r.createdAt
      }));

    // Prepend user DB reviews before seeds
    const combined = [...dbFormatted, ...seedTestimonials];

    // Dynamic stats
    const totalCount = await Review.countDocuments({ status: 'PUBLISHED' });
    const aggregate = await Review.aggregate([
      { $match: { status: 'PUBLISHED' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avg = aggregate.length > 0 ? Number(aggregate[0].avgRating.toFixed(1)) : 4.8;

    return res.json({
      success: true,
      testimonials: combined.slice(0, 18),
      stats: {
        averageRating: avg > 0 ? avg : 4.8,
        totalReviews: totalCount > 0 ? totalCount : 50000
      }
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

