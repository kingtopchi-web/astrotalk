const CategoryDocumentRequirement = require('../models/CategoryDocumentRequirement');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

/**
 * Standard default templates based on category name/slug keywords.
 * Used to automatically seed or provide requirements for known professions.
 */
const DEFAULT_CATEGORY_TEMPLATES = {
  doctor: [
    {
      docKey: 'medical_degree',
      name: 'Medical Degree (MBBS, BDS, MD, etc.)',
      description: 'Upload certified copy of degree or provisional passing certificate',
      isMandatory: true,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    },
    {
      docKey: 'medical_council_reg',
      name: 'NMC / State Medical Council Registration Certificate',
      description: 'Valid National Medical Commission or State Medical Council certificate with registration number',
      isMandatory: true,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    },
    {
      docKey: 'specialization_cert',
      name: 'Specialization Certificate',
      description: 'Post-graduate or super-specialty certificate (MD, MS, DM, MCh, Fellowship), if applicable',
      isMandatory: false,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    }
  ],
  lawyer: [
    {
      docKey: 'law_degree',
      name: 'LLB / LLM Degree Certificate',
      description: 'Recognized university law graduation or master degree certificate',
      isMandatory: true,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    },
    {
      docKey: 'bar_council_enrollment',
      name: 'State Bar Council Enrollment Certificate',
      description: 'Bar Council Certificate of Enrollment / Sanad or COP (Certificate of Practice)',
      isMandatory: true,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    }
  ],
  engineer: [
    {
      docKey: 'engineering_degree',
      name: 'Engineering Degree or Diploma (B.Tech / B.E. / M.Tech)',
      description: 'Degree or Diploma certificate from a recognized university or institute',
      isMandatory: true,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    },
    {
      docKey: 'tech_certification',
      name: 'Relevant Professional Certification or License',
      description: 'Vendor or industry certifications (AWS, GCP, Cisco, PMP, Professional Engineer license), if applicable',
      isMandatory: false,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    },
    {
      docKey: 'experience_cert',
      name: 'Experience Certificate or Employment Proof',
      description: 'Relieving letter, experience letter, or current company work verification',
      isMandatory: false,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    }
  ],
  chartered_accountant: [
    {
      docKey: 'ca_qualification_cert',
      name: 'CA Qualification Certificate',
      description: 'Official passing / completion certificate from Institute of Chartered Accountants of India (ICAI)',
      isMandatory: true,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    },
    {
      docKey: 'icai_membership_cert',
      name: 'ICAI Membership Certificate or COP Details',
      description: 'Valid Associate / Fellow Membership Certificate or active membership card',
      isMandatory: true,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    }
  ],
  psychologist: [
    {
      docKey: 'psychology_degree',
      name: 'Relevant Psychology Degree (BA, MA, MSc, MPhil, PsyD)',
      description: 'University degree in Clinical Psychology, Counselling, or Applied Psychology',
      isMandatory: true,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    },
    {
      docKey: 'counsellor_reg_cert',
      name: 'Professional Registration or Recognized Certification',
      description: 'RCI registration certificate or recognized psychological council / association credential',
      isMandatory: true,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    }
  ],
  astrologer: [
    {
      docKey: 'astrology_training_proof',
      name: 'Relevant Training or Experience Proof',
      description: 'Proof of professional astrological practice, lineage training, or institute credential',
      isMandatory: true,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    },
    {
      docKey: 'astrology_certification',
      name: 'Astrology Course / Certification',
      description: 'Jyotish Praveena, Visharada, or related certificate, if available',
      isMandatory: false,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    },
    {
      docKey: 'astrology_portfolio',
      name: 'Portfolio or Previous Work Samples',
      description: 'Sample horoscopes, consultation records, publications, or client testimonials',
      isMandatory: false,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    }
  ],
  general: [
    {
      docKey: 'identity_proof',
      name: 'Government Photo ID Proof',
      description: 'Aadhaar, Passport, Driving License, or Voter ID',
      isMandatory: true,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    },
    {
      docKey: 'professional_cert',
      name: 'Highest Educational / Professional Qualification',
      description: 'Degree, diploma, or verified certificate proving expertise in this domain',
      isMandatory: true,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: 5
    }
  ]
};

/**
 * Determine matching template key based on category / subcategory text or slug
 */
function matchCategoryTemplateKey(categoryName = '', categorySlug = '') {
  const text = `${categoryName} ${categorySlug}`.toLowerCase();

  if (text.includes('doctor') || text.includes('medic') || text.includes('health') || text.includes('physician') || text.includes('ayurveda')) {
    return 'doctor';
  }
  if (text.includes('legal') || text.includes('law') || text.includes('advocate') || text.includes('attorney')) {
    return 'lawyer';
  }
  if (text.includes('account') || text.includes('ca ') || text.includes('tax') || text.includes('finance') || text.includes('audit')) {
    return 'chartered_accountant';
  }
  if (text.includes('tech') || text.includes('engine') || text.includes('software') || text.includes('data science') || text.includes('developer')) {
    return 'engineer';
  }
  if (text.includes('psycholog') || text.includes('counsel') || text.includes('mental') || text.includes('therapy') || text.includes('wellness')) {
    return 'psychologist';
  }
  if (text.includes('astro') || text.includes('horoscope') || text.includes('tarot') || text.includes('numerology') || text.includes('vedic')) {
    return 'astrologer';
  }

  return 'general';
}

/**
 * Ensure default requirements exist in the database for a given category.
 * If none exist yet, automatically seed them from the template.
 */
async function ensureCategoryRequirements(categoryId) {
  if (!categoryId) return [];

  const existing = await CategoryDocumentRequirement.find({
    categoryId,
    status: 'ACTIVE'
  }).sort({ isMandatory: -1, createdAt: 1 });

  if (existing.length > 0) {
    return existing;
  }

  const category = await Category.findById(categoryId);
  if (!category) return [];

  const templateKey = matchCategoryTemplateKey(category.name, category.slug);
  const templateList = DEFAULT_CATEGORY_TEMPLATES[templateKey] || DEFAULT_CATEGORY_TEMPLATES.general;

  const createdDocs = [];
  for (const item of templateList) {
    const doc = await CategoryDocumentRequirement.create({
      categoryId: category._id,
      subCategoryId: null,
      docKey: item.docKey,
      name: item.name,
      description: item.description,
      isMandatory: item.isMandatory,
      allowedFormats: item.allowedFormats,
      maxFileSizeMb: item.maxFileSizeMb,
      status: 'ACTIVE'
    });
    createdDocs.push(doc);
  }

  return createdDocs;
}

/**
 * Retrieve all active document requirements for a category,
 * including subcategory-specific ones if a subcategory is provided.
 */
async function getRequirementsForCategory(categoryId, subCategoryId = null) {
  if (!categoryId) return [];

  // Seed defaults if empty
  await ensureCategoryRequirements(categoryId);

  const query = {
    categoryId,
    status: 'ACTIVE',
    $or: [
      { subCategoryId: null },
      { subCategoryId: { $exists: false } }
    ]
  };

  if (subCategoryId) {
    query.$or.push({ subCategoryId });
  }

  return await CategoryDocumentRequirement.find(query).sort({ isMandatory: -1, createdAt: 1 });
}

/**
 * Validate an uploaded file (Base64 data or data URI)
 * Checks:
 * - Format: must match pdf, jpg, jpeg, png
 * - Size: under max limit
 * - Rejects scripts/executables
 */
function validateUploadedFile(fileData, fileName = '', allowedFormats = ['pdf', 'jpg', 'jpeg', 'png'], maxMb = 5) {
  if (!fileData || typeof fileData !== 'string') {
    return { valid: false, error: 'Document file data is missing or invalid' };
  }

  // Detect mime type from data URI (e.g. data:image/png;base64,.... or data:application/pdf;base64,....)
  let mimeType = '';
  let base64Content = fileData;

  if (fileData.startsWith('data:')) {
    const match = fileData.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) {
      return { valid: false, error: 'Invalid file data URI format' };
    }
    mimeType = match[1].toLowerCase();
    base64Content = match[2];
  }

  // Calculate approximate file size in MB
  const sizeInBytes = Math.round((base64Content.length * 3) / 4);
  const sizeInMb = sizeInBytes / (1024 * 1024);

  const isImage = mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(fileName);
  const effectiveMaxMb = isImage ? 1.2 : maxMb;

  if (sizeInMb > effectiveMaxMb) {
    return { 
      valid: false, 
      error: isImage 
        ? `Image file size (${sizeInMb.toFixed(1)}MB) exceeds maximum allowed limit of 1MB.`
        : `File size (${sizeInMb.toFixed(1)}MB) exceeds maximum limit of ${maxMb}MB` 
    };
  }

  // Check extension from filename if available
  const ext = fileName ? fileName.split('.').pop().toLowerCase() : '';

  // Validate allowed mime types
  const validMimes = {
    pdf: ['application/pdf', 'application/x-pdf'],
    jpg: ['image/jpeg', 'image/pjpeg'],
    jpeg: ['image/jpeg', 'image/pjpeg'],
    png: ['image/png']
  };

  const allowedMimeList = [];
  allowedFormats.forEach(fmt => {
    const f = fmt.toLowerCase().replace('.', '');
    if (validMimes[f]) {
      allowedMimeList.push(...validMimes[f]);
    }
  });

  if (mimeType && allowedMimeList.length > 0 && !allowedMimeList.includes(mimeType)) {
    return {
      valid: false,
      error: `File type "${mimeType}" is not allowed. Accepted formats: ${allowedFormats.join(', ').toUpperCase()}`
    };
  }

  // Check malicious magic bytes or script tags in decoded content
  try {
    const bufferHead = Buffer.from(base64Content.slice(0, 512), 'base64').toString('utf8').toLowerCase();
    if (bufferHead.includes('<script') || bufferHead.includes('javascript:') || bufferHead.includes('<?php')) {
      return { valid: false, error: 'Executable scripts or malicious content detected in document' };
    }
  } catch (e) {
    // ignore decoding errors
  }

  return {
    valid: true,
    fileType: mimeType || (ext === 'pdf' ? 'application/pdf' : `image/${ext || 'jpeg'}`),
    fileSize: sizeInBytes
  };
}

module.exports = {
  DEFAULT_CATEGORY_TEMPLATES,
  matchCategoryTemplateKey,
  ensureCategoryRequirements,
  getRequirementsForCategory,
  validateUploadedFile
};

