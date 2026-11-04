const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Setting = require('../models/Setting');

// Dedicated private storage directory (not served publicly by static middleware)
const STORAGE_DIR = path.join(__dirname, '..', 'uploads', 'marketplace_files');

// Ensure directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Magic bytes signatures for safe file verification
const FILE_SIGNATURES = {
  pdf: [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
  png: [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
  jpg: [Buffer.from([0xFF, 0xD8, 0xFF])],
  jpeg: [Buffer.from([0xFF, 0xD8, 0xFF])],
  zip: [Buffer.from([0x50, 0x4B, 0x03, 0x04]), Buffer.from([0x50, 0x4B, 0x05, 0x06])],
  docx: [Buffer.from([0x50, 0x4B, 0x03, 0x04])],
  xlsx: [Buffer.from([0x50, 0x4B, 0x03, 0x04])],
  pptx: [Buffer.from([0x50, 0x4B, 0x03, 0x04])],
  rar: [Buffer.from([0x52, 0x61, 0x72, 0x21])], // Rar!
  mp3: [Buffer.from([0x49, 0x44, 0x33]), Buffer.from([0xFF, 0xFB]), Buffer.from([0xFF, 0xF3])], // ID3 or sync
  mp4: [Buffer.from('ftyp', 'utf8')] // offset 4
};

const MIME_MAP = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  csv: 'text/csv',
  txt: 'text/plain',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4'
};

class MarketplaceFileService {
  /**
   * Validate and save an uploaded digital file
   */
  async processAndSaveFile(filePayload, originalName = 'product-file.dat') {
    if (!filePayload) {
      throw new Error('Digital product file is missing');
    }

    // Extract raw base64 or buffer
    let buffer;
    let declaredMime = '';

    if (typeof filePayload === 'string') {
      if (filePayload.startsWith('data:')) {
        const parts = filePayload.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (mimeMatch) declaredMime = mimeMatch[1].toLowerCase();
        buffer = Buffer.from(parts[1], 'base64');
      } else {
        buffer = Buffer.from(filePayload, 'base64');
      }
    } else if (Buffer.isBuffer(filePayload)) {
      buffer = filePayload;
    } else {
      throw new Error('Invalid file payload format');
    }

    const fileSize = buffer.length;
    if (fileSize === 0) {
      throw new Error('Uploaded file is empty (0 bytes)');
    }

    // Load admin settings
    const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' }).lean();
    const maxMb = settings?.marketplaceMaxFileSizeMb || 50;
    const allowedExtensions = (settings?.marketplaceAllowedExtensions || [
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'zip', 'rar', 'csv', 'txt', 'mp3', 'mp4'
    ]).map(e => e.toLowerCase().replace('.', ''));

    // Check size limit
    const sizeInMb = fileSize / (1024 * 1024);
    if (sizeInMb > maxMb) {
      throw new Error(`File size (${sizeInMb.toFixed(1)} MB) exceeds maximum allowed limit of ${maxMb} MB`);
    }

    // Check extension
    const cleanOriginalName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = cleanOriginalName.split('.').pop().toLowerCase();

    if (!ext || !allowedExtensions.includes(ext)) {
      throw new Error(`File extension .${ext} is not allowed. Allowed formats: ${allowedExtensions.join(', ').toUpperCase()}`);
    }

    // Malware / executable check
    const headText = buffer.slice(0, 1024).toString('utf8').toLowerCase();
    const dangerousPatterns = [
      '<script', '<?php', 'eval(', 'base64_decode(', '#!/bin/', 'cmd.exe',
      'powershell', 'wscript.shell', 'system('
    ];
    for (const pat of dangerousPatterns) {
      if (headText.includes(pat)) {
        throw new Error('File rejected: Malicious or executable code pattern detected in upload');
      }
    }

    // Magic bytes signature verification where defined
    if (FILE_SIGNATURES[ext]) {
      let signatureMatches = false;
      for (const sig of FILE_SIGNATURES[ext]) {
        if (ext === 'mp4') {
          // ftyp is usually at offset 4
          if (buffer.length >= 8 && buffer.slice(4, 8).equals(sig)) {
            signatureMatches = true;
            break;
          }
        } else if (buffer.length >= sig.length && buffer.slice(0, sig.length).equals(sig)) {
          signatureMatches = true;
          break;
        }
      }
      if (!signatureMatches) {
        throw new Error(`File content signature does not match declared format (.${ext})`);
      }
    }

    const mimeType = declaredMime || MIME_MAP[ext] || 'application/octet-stream';

    // Generate safe storage filename using UUID
    const randomHash = crypto.randomBytes(16).toString('hex');
    const storedFileName = `MKT_FILE_${Date.now()}_${randomHash}.${ext}`;
    const targetPath = path.join(STORAGE_DIR, storedFileName);

    // Save to private disk
    await fs.promises.writeFile(targetPath, buffer);

    return {
      originalName: cleanOriginalName,
      storedFileName,
      mimeType,
      fileSize,
      fileExtension: ext
    };
  }

  /**
   * Get safe absolute file path
   */
  getFilePath(storedFileName) {
    if (!storedFileName || typeof storedFileName !== 'string') return null;
    const clean = path.basename(storedFileName);
    const fullPath = path.join(STORAGE_DIR, clean);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    return null;
  }

  /**
   * Delete a stored private file
   */
  async deleteFile(storedFileName) {
    try {
      const filePath = this.getFilePath(storedFileName);
      if (filePath) {
        await fs.promises.unlink(filePath);
      }
    } catch (e) {
      console.warn('Marketplace file deletion error:', e.message);
    }
  }
}

module.exports = new MarketplaceFileService();

