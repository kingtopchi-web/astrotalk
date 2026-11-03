const Category = require('../models/Category');
const Setting = require('../models/Setting');
const Expert = require('../models/Expert');
const ExpertService = require('../models/ExpertService');

/**
 * Resolves dynamic commission rate for an expert, category, or service.
 * Priority:
 * 1. Category-specific commissionRate (from Category model) if defined, not null, and between 0 and 100.
 * 2. Global platform commissionRate from Setting model (defaults to 20%).
 *
 * @param {Object} options - { categoryId, expertId, expert, serviceId }
 * @returns {Promise<{ percentage: number, rate: number, source: string, categoryId: any, categoryName: string|null }>}
 */
async function getEffectiveCommission(options = {}) {
  let categoryId = options.categoryId || null;

  // 1. If serviceId provided, check if service has a category
  if (!categoryId && options.serviceId) {
    try {
      const service = await ExpertService.findById(options.serviceId).select('categoryId');
      if (service && service.categoryId) {
        categoryId = service.categoryId;
      }
    } catch (err) {
      // fallback silently
    }
  }

  // 2. If expert object provided with categoryId
  if (!categoryId && options.expert) {
    categoryId = options.expert.categoryId?._id || options.expert.categoryId || null;
  }

  // 3. If expertId provided, look up expert's category
  if (!categoryId && options.expertId) {
    try {
      const expert = await Expert.findById(options.expertId).select('categoryId');
      if (expert && expert.categoryId) {
        categoryId = expert.categoryId;
      }
    } catch (err) {
      // fallback silently
    }
  }

  // 4. If categoryId found, check category's custom commissionRate
  let category = null;
  if (categoryId) {
    try {
      category = await Category.findById(categoryId).select('name commissionRate');
    } catch (err) {
      // fallback silently
    }
  }

  let percentage = null;
  let source = 'GLOBAL';

  if (
    category &&
    category.commissionRate !== null &&
    category.commissionRate !== undefined &&
    !isNaN(category.commissionRate)
  ) {
    percentage = Number(category.commissionRate);
    source = 'CATEGORY';
  } else {
    try {
      const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' }).select('platformCommissionRate');
      percentage = (settings && typeof settings.platformCommissionRate === 'number')
        ? settings.platformCommissionRate
        : 20;
    } catch (err) {
      percentage = 20;
    }
    source = 'GLOBAL';
  }

  // Sanitize within boundaries 0 to 100
  percentage = Math.min(100, Math.max(0, Number(percentage) || 0));
  const rate = Number((percentage / 100).toFixed(4));

  return {
    percentage,
    rate,
    source,
    categoryId: category ? category._id : (categoryId || null),
    categoryName: category ? category.name : null
  };
}

module.exports = {
  getEffectiveCommission
};

