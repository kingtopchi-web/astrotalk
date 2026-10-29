const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Expert = require('../models/Expert');

// Levenshtein distance for typo tolerance
function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const d = [];
  for (let i = 0; i <= b.length; i++) d[i] = [i];
  for (let j = 0; j <= a.length; j++) d[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[b.length][a.length];
}

function isFuzzyWordMatch(queryWord, targetWord) {
  const q = (queryWord || '').toLowerCase().trim();
  const t = (targetWord || '').toLowerCase().trim();
  if (!q || !t) return false;
  if (t === q || t.includes(q) || q.includes(t)) return true;
  // Allow 1 typo for words of length 4-6, 2 typos for words > 6
  const maxDist = t.length > 6 ? 2 : (t.length >= 4 ? 1 : 0);
  if (maxDist < 1) return false;
  return levenshteinDistance(q, t) <= maxDist;
}

// Tokenize query string into clean lowercase terms
function extractTokens(term) {
  if (!term) return [];
  return term
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

// Build regex array with stemming (plural/singular/verb endings)
function buildSearchRegexes(term) {
  const tokens = extractTokens(term);
  const regexes = [];

  const fullEscaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  regexes.push({ re: new RegExp(fullEscaped, 'i'), isPhrase: true, token: term.trim() });

  tokens.forEach(tok => {
    // If very short (<= 3 chars like 'law', 'dr', 'it', 'ai', 'tax'), use boundary to prevent false positives in substrings
    if (tok.length <= 3) {
      regexes.push({ re: new RegExp(`\\b${tok}\\b`, 'i'), token: tok, isShort: true });
    } else {
      regexes.push({ re: new RegExp(tok, 'i'), token: tok });

      // Stemming variations
      let stem = tok;
      if (tok.endsWith('ies')) stem = tok.slice(0, -3);
      else if (tok.endsWith('es')) stem = tok.slice(0, -2);
      else if (tok.endsWith('ers') || tok.endsWith('ors') || tok.endsWith('ing')) stem = tok.slice(0, -3);
      else if (tok.endsWith('s') && !tok.endsWith('ss')) stem = tok.slice(0, -1);
      else if (tok.endsWith('er') || tok.endsWith('or') || tok.endsWith('ed')) stem = tok.slice(0, -2);

      if (stem.length >= 3 && stem !== tok) {
        regexes.push({ re: new RegExp(stem, 'i'), token: stem, isStem: true });
      }
    }
  });

  return { tokens, regexes };
}

// Curated synonyms & domain intent mappings
const DOMAIN_SYNONYMS = {
  legal: ['law', 'lawyer', 'advocate', 'attorney', 'court', 'contract', 'legal advisor', 'legal advice', 'legal advisors'],
  law: ['legal', 'lawyer', 'advocate', 'attorney', 'legal advisors', 'legal advice'],
  lawyer: ['legal', 'law', 'advocate', 'attorney', 'legal advisors', 'legal advice'],
  advocate: ['legal', 'law', 'lawyer', 'attorney', 'legal advisor'],
  advisor: ['advisor', 'advisors', 'adviser', 'advisers', 'advice', 'consultant'],
  advisors: ['advisor', 'advisors', 'adviser', 'advisers', 'advice', 'consultant'],
  advice: ['advisor', 'advisors', 'adviser', 'guidance', 'consultant'],
  doctor: ['physician', 'medical', 'medicine', 'health', 'clinic', 'specialist', 'dr'],
  doctors: ['doctor', 'physician', 'medical', 'medicine', 'health', 'clinic'],
  health: ['doctor', 'medical', 'physician', 'wellness', 'ayurveda'],
  astrology: ['astrologer', 'astrologers', 'vedic', 'kundli', 'horoscope', 'numerology', 'tarot', 'jyotish', 'zodiac'],
  astrologer: ['astrology', 'astrologers', 'vedic', 'kundli', 'horoscope', 'numerology', 'tarot', 'jyotish'],
  astrologers: ['astrology', 'astrologer', 'vedic', 'kundli', 'horoscope', 'numerology', 'tarot'],
  vedic: ['astrology', 'astrologer', 'kundli', 'horoscope', 'numerology'],
  kundli: ['astrology', 'astrologer', 'vedic', 'horoscope'],
  tarot: ['astrology', 'numerology', 'reading', 'tarot reading'],
  career: ['mentor', 'mentors', 'mentorship', 'resume', 'interview', 'job', 'guidance'],
  mentors: ['career', 'mentor', 'mentorship', 'guidance'],
  mentor: ['career', 'mentors', 'mentorship', 'guidance'],
  tech: ['software', 'developer', 'engineer', 'coding', 'programming', 'ai', 'fullstack', 'it'],
  it: ['tech', 'software', 'developer', 'engineer', 'tech & it'],
  software: ['tech', 'developer', 'engineer', 'coding', 'programming'],
  developer: ['tech', 'software', 'engineer', 'coding'],
  coding: ['tech', 'developer', 'software', 'fullstack'],
  finance: ['financial', 'funding', 'tax', 'taxation', 'business', 'venture', 'investment'],
  funding: ['startup', 'finance', 'venture', 'investment', 'funding'],
  tax: ['finance', 'taxation', 'financial'],
  wellness: ['therapy', 'counseling', 'mental', 'stress', 'mind', 'psychology'],
  therapy: ['wellness', 'counseling', 'mental', 'therapist'],
  counseling: ['wellness', 'therapy', 'mental', 'counselor']
};

/**
 * Executes a fuzzy, tokenized, and category-aware search for Experts
 */
async function searchExperts({
  searchTerm = '',
  categoryId = null,
  subCategoryId = null,
  onlineStatus = null,
  page = 1,
  limit = 12
}) {
  const queryTerm = (searchTerm || '').trim();
  const baseFilter = {
    verificationStatus: 'APPROVED',
    status: 'ACTIVE'
  };

  // Online status filter (if explicitly specified and not 'any' or 'all')
  if (onlineStatus && onlineStatus !== 'any' && onlineStatus !== 'all') {
    baseFilter.onlineStatus = onlineStatus;
  }

  // Category & subcategory direct filters
  if (categoryId) baseFilter.categoryId = categoryId;
  if (subCategoryId) baseFilter.subCategoryId = subCategoryId;

  // Case 1: No search term -> standard query
  if (!queryTerm) {
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    // Online experts first, then by rating, then newest
    const [experts, total] = await Promise.all([
      Expert.find(baseFilter)
        .select('-password -documents -rejectionReason -rejectedAt -rejectedBy -approvedBy')
        .populate('categoryId', 'name slug')
        .populate('subCategoryId', 'name slug')
        .sort({ onlineStatus: -1, rating: -1, createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Expert.countDocuments(baseFilter)
    ]);

    return {
      data: experts,
      page: parseInt(page),
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit) || 1,
      categories: []
    };
  }

  // Case 2: Search term provided -> Tokenized, Fuzzy & Cross-Entity Search
  const { tokens, regexes } = buildSearchRegexes(queryTerm);

  // Collect synonyms
  const synonymTerms = new Set();
  tokens.forEach(tok => {
    if (DOMAIN_SYNONYMS[tok]) {
      DOMAIN_SYNONYMS[tok].forEach(s => synonymTerms.add(s));
    }
  });

  // Step 1: Find matching categories and subcategories
  const catConditions = [];
  regexes.forEach(({ re }) => {
    catConditions.push({ name: re }, { slug: re });
  });
  synonymTerms.forEach(syn => {
    catConditions.push({ name: new RegExp(syn, 'i') }, { slug: new RegExp(syn, 'i') });
  });

  // Load all active categories and subcategories for fuzzy fallback if needed
  const [matchingCats, matchingSubs, allCats, allSubs] = await Promise.all([
    Category.find({ status: 'ACTIVE', $or: catConditions }).select('_id name slug icon description'),
    SubCategory.find({ status: 'ACTIVE', $or: catConditions.map(c => ({ name: c.name || c.slug })) }).select('_id categoryId name slug'),
    Category.find({ status: 'ACTIVE' }).select('_id name slug icon description'),
    SubCategory.find({ status: 'ACTIVE' }).select('_id categoryId name slug')
  ]);

  const matchedCatMap = new Map();
  matchingCats.forEach(c => matchedCatMap.set(c._id.toString(), c));

  // Also check fuzzy Levenshtein match against all categories
  tokens.forEach(tok => {
    allCats.forEach(c => {
      const catWords = extractTokens(c.name);
      if (catWords.some(w => isFuzzyWordMatch(tok, w))) {
        matchedCatMap.set(c._id.toString(), c);
      }
    });
    allSubs.forEach(s => {
      const subWords = extractTokens(s.name);
      if (subWords.some(w => isFuzzyWordMatch(tok, w))) {
        if (s.categoryId) {
          const parent = allCats.find(c => c._id.toString() === s.categoryId.toString());
          if (parent) matchedCatMap.set(parent._id.toString(), parent);
        }
      }
    });
  });

  const finalMatchedCats = Array.from(matchedCatMap.values());
  const matchedCatIds = finalMatchedCats.map(c => c._id);
  const matchedSubIds = matchingSubs.map(s => s._id);

  // Step 2: Build Expert $or conditions
  const expertOrs = [];

  // A. Linked Categories & Subcategories
  if (matchedCatIds.length > 0) {
    expertOrs.push({ categoryId: { $in: matchedCatIds } });
  }
  if (matchedSubIds.length > 0) {
    expertOrs.push({ subCategoryId: { $in: matchedSubIds } });
  }

  // B. Direct text match on Expert attributes
  regexes.forEach(({ re }) => {
    expertOrs.push({ name: re });
    expertOrs.push({ specialty: re });
    expertOrs.push({ specialization: re });
    expertOrs.push({ bio: re });
  });

  // C. Synonym matches on specialty / specialization
  synonymTerms.forEach(syn => {
    const synRe = new RegExp(syn, 'i');
    expertOrs.push({ specialty: synRe });
    expertOrs.push({ specialization: synRe });
  });

  const expertQuery = {
    ...baseFilter,
    $or: expertOrs
  };

  const PUBLIC_EXPERT_FIELDS = 'name specialty qualification specialization experience bio languages rates pricePerMinute rating reviewsCount profileImage categoryId subCategoryId onlineStatus status verificationStatus availability';

  let candidateExperts = await Expert.find(expertQuery)
    .select(PUBLIC_EXPERT_FIELDS)
    .populate('categoryId', 'name slug')
    .populate('subCategoryId', 'name slug');

  // Fallback: If 0 experts found, try fuzzy scan on all approved active experts (typo tolerance)
  if (candidateExperts.length === 0) {
    const allApproved = await Expert.find(baseFilter)
      .select(PUBLIC_EXPERT_FIELDS)
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug');

    candidateExperts = allApproved.filter(exp => {
      const targetWords = [
        ...extractTokens(exp.name),
        ...extractTokens(exp.specialty),
        ...extractTokens(exp.specialization),
        ...extractTokens(exp.categoryId?.name)
      ];
      return tokens.some(t => targetWords.some(w => isFuzzyWordMatch(t, w)));
    });
  }

  // Step 3: Relevance Scoring & Sorting
  const qClean = queryTerm.toLowerCase();
  const scored = candidateExperts.map(expert => {
    let score = 0;
    const expName = (expert.name || '').toLowerCase();
    const expSpec = (expert.specialty || '').toLowerCase();
    const expSpecialization = (expert.specialization || '').toLowerCase();
    const catName = (expert.categoryId?.name || '').toLowerCase();
    const subName = (expert.subCategoryId?.name || '').toLowerCase();

    // Exact full query match
    if (catName === qClean) score += 60;
    else if (catName.includes(qClean) || qClean.includes(catName)) score += 35;

    if (expName.includes(qClean)) score += 50;
    if (expSpec.includes(qClean)) score += 40;
    if (expSpecialization.includes(qClean)) score += 30;

    // Token level scoring
    tokens.forEach(tok => {
      if (catName.includes(tok)) score += 20;
      if (subName.includes(tok)) score += 15;
      if (expName.includes(tok)) score += 25;
      if (expSpec.includes(tok)) score += 20;
      if (expSpecialization.includes(tok)) score += 15;

      // Stem match
      if (tok.length >= 4) {
        const stem = tok.slice(0, -1);
        if (catName.includes(stem)) score += 10;
        if (expSpec.includes(stem)) score += 10;
      }
    });

    // Online status slight boost
    if (expert.onlineStatus === 'online') score += 5;
    else if (expert.onlineStatus === 'busy') score += 2;

    // Rating boost (0 to 5)
    score += (Number(expert.rating) || 0);

    return { expert, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Filter out noisy weak matches if there are strong relevant matches
  let finalScored = scored;
  if (scored.length > 0 && scored[0].score >= 40) {
    const minThreshold = Math.max(25, scored[0].score * 0.35);
    finalScored = scored.filter(s => s.score >= minThreshold);
  }

  const total = finalScored.length;
  const parsedLimit = parseInt(limit) || 12;
  const parsedPage = parseInt(page) || 1;
  const skip = (Math.max(1, parsedPage) - 1) * parsedLimit;
  const paginatedData = finalScored.slice(skip, skip + parsedLimit).map(s => s.expert);

  return {
    data: paginatedData,
    page: parsedPage,
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit) || 1,
    categories: finalMatchedCats.slice(0, 4)
  };
}

/**
 * Fast search for the top global search bar dropdown
 */
async function getGlobalSearchResults(query, limit = 6) {
  const q = (query || '').trim();
  if (!q) {
    return { experts: [], categories: [] };
  }

  const result = await searchExperts({
    searchTerm: q,
    page: 1,
    limit
  });

  return {
    experts: result.data,
    categories: result.categories
  };
}

module.exports = {
  searchExperts,
  getGlobalSearchResults,
  isFuzzyWordMatch,
  buildSearchRegexes
};
