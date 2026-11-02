const Consultation = require('../models/Consultation');
const User = require('../models/User');

/**
 * Returns start and end Date objects in UTC corresponding to 00:00:00 and 23:59:59.999
 * in Indian Standard Time (IST, UTC+05:30).
 */
function getISTDayBounds(targetDate = new Date()) {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(targetDate.getTime() + istOffsetMs);

  const year = nowIST.getUTCFullYear();
  const month = nowIST.getUTCMonth();
  const day = nowIST.getUTCDate();

  const startOfDayUTC = new Date(Date.UTC(year, month, day) - istOffsetMs);
  const endOfDayUTC = new Date(Date.UTC(year, month, day + 1) - istOffsetMs - 1);

  return { startOfDayUTC, endOfDayUTC };
}

/**
 * Check whether a user is eligible for a free chat consultation:
 * Rules:
 * 1. Lifetime: At most 1 free chat consultation per listed expert.
 * 2. Daily: At most 1 free chat consultation per calendar day (IST) across the platform.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string|import('mongoose').Types.ObjectId} [expertId]
 * @returns {Promise<{
 *   isEligible: boolean,
 *   reason: 'EXPERT_ALREADY_USED'|'DAILY_LIMIT_REACHED'|'UNAUTHORIZED'|'USER_NOT_FOUND'|null,
 *   message: string|null,
 *   hasUsedToday: boolean,
 *   hasUsedWithExpert: boolean,
 *   usedExpertIds: string[]
 * }>}
 */
async function checkFreeChatEligibility(userId, expertId = null) {
  if (!userId) {
    return {
      isEligible: false,
      reason: 'UNAUTHORIZED',
      message: 'Authentication required to check free consultation eligibility.',
      hasUsedToday: false,
      hasUsedWithExpert: false,
      usedExpertIds: []
    };
  }

  const user = await User.findById(userId).select('freeChatUsedExperts lastFreeChatAt').lean();
  if (!user) {
    return {
      isEligible: false,
      reason: 'USER_NOT_FOUND',
      message: 'User account not found.',
      hasUsedToday: false,
      hasUsedWithExpert: false,
      usedExpertIds: []
    };
  }

  // 1. Authoritative check from Consultation history (all free consultations not cancelled)
  const freeConsultations = await Consultation.find({
    user: userId,
    isFree: true,
    status: { $ne: 'cancelled' }
  }).select('expert createdAt startTime status').lean();

  const consultationExpertIds = freeConsultations
    .map(c => (c.expert ? c.expert.toString() : null))
    .filter(Boolean);

  const userModelExpertIds = (user.freeChatUsedExperts || [])
    .map(id => id.toString());

  const usedExpertIdSet = new Set([...consultationExpertIds, ...userModelExpertIds]);
  const usedExpertIds = Array.from(usedExpertIdSet);

  // 2. Check daily IST limit: did the user start or have any free chat today (IST)?
  const { startOfDayUTC, endOfDayUTC } = getISTDayBounds();

  const hasConsultationToday = freeConsultations.some(c => {
    const consultationDate = c.createdAt || c.startTime;
    return consultationDate && consultationDate >= startOfDayUTC && consultationDate <= endOfDayUTC;
  });

  const hasUserLastDateToday = Boolean(
    user.lastFreeChatAt && user.lastFreeChatAt >= startOfDayUTC && user.lastFreeChatAt <= endOfDayUTC
  );

  const hasUsedToday = hasConsultationToday || hasUserLastDateToday;

  let hasUsedWithExpert = false;
  if (expertId) {
    hasUsedWithExpert = usedExpertIdSet.has(expertId.toString());
  }

  let isEligible = true;
  let reason = null;
  let message = null;

  if (expertId && hasUsedWithExpert) {
    isEligible = false;
    reason = 'EXPERT_ALREADY_USED';
    message = 'You have already used your 1-time free consultation with this expert. You can connect with other experts for free or choose a paid session.';
  } else if (hasUsedToday) {
    isEligible = false;
    reason = 'DAILY_LIMIT_REACHED';
    message = 'Daily free consultation limit reached. You can take 1 free consultation per day. Please come back tomorrow to chat with another expert for free.';
  }

  return {
    isEligible,
    reason,
    message,
    hasUsedToday,
    hasUsedWithExpert,
    usedExpertIds
  };
}

module.exports = {
  getISTDayBounds,
  checkFreeChatEligibility
};
