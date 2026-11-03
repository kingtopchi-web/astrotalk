/**
 * Advanced Client-Side Image Compressor for Admin Panel
 * 
 * Requirements:
 * 1. Maximum size must strictly be <= 1MB (1,048,576 bytes).
 * 2. If user uploads > 1MB (e.g. 2MB, 5MB, 10MB+),
 *    it automatically compresses it down to <= 1MB.
 * 3. Keeps image clear, sharp and visible.
 */

const ONE_MB = 1024 * 1024; // 1,048,576 bytes

export function getBase64ByteSize(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  const commaIndex = dataUrl.indexOf(',');
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  return Math.round((base64.length * 3) / 4);
}

export function compressImage(input, options = {}) {
  const {
    maxSizeBytes = ONE_MB,
    maxWidth = 1600,
    maxHeight = 1600,
    initialQuality = 0.85,
    outputType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    if (!input) {
      return reject(new Error('No image input provided to compressImage'));
    }

    let originalSize = 0;
    let fileName = 'image.jpg';
    if (typeof input === 'string') {
      originalSize = getBase64ByteSize(input);
    } else if (input instanceof Blob || input instanceof File) {
      originalSize = input.size;
      if (input.name) fileName = input.name;
    }

    const processImageElement = (img, cleanupUrl) => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
          return reject(new Error('Invalid image dimensions'));
        }

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
          return reject(new Error('Canvas 2D context not available'));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        if (cleanupUrl) {
          URL.revokeObjectURL(cleanupUrl);
        }

        let quality = initialQuality;
        let dataUrl = canvas.toDataURL(outputType, quality);
        let currentSize = getBase64ByteSize(dataUrl);

        let attempts = 0;
        const maxAttempts = 8;

        while (currentSize > maxSizeBytes && attempts < maxAttempts) {
          attempts++;

          if (quality > 0.55) {
            quality -= 0.10;
          } else {
            width = Math.round(width * 0.85);
            height = Math.round(height * 0.85);
            canvas.width = width;
            canvas.height = height;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
          }

          dataUrl = canvas.toDataURL(outputType, quality);
          currentSize = getBase64ByteSize(dataUrl);
        }

        const byteString = atob(dataUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: outputType });
        const compressedFile = new File([blob], fileName.replace(/\.[^/.]+$/, '.jpg'), {
          type: outputType,
          lastModified: Date.now()
        });

        resolve({
          dataUrl,
          blob,
          file: compressedFile,
          size: currentSize,
          originalSize,
          compressed: currentSize < originalSize || originalSize > maxSizeBytes
        });
      } catch (err) {
        if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
        reject(err);
      }
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';

    if (typeof input === 'string') {
      img.onload = () => processImageElement(img, null);
      img.onerror = () => reject(new Error('Failed to load image from data URL'));
      img.src = input;
    } else {
      let objectUrl = '';
      try {
        objectUrl = URL.createObjectURL(input);
        img.onload = () => processImageElement(img, objectUrl);
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          const reader = new FileReader();
          reader.onload = () => {
            img.onload = () => processImageElement(img, null);
            img.src = reader.result;
          };
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(input);
        };
        img.src = objectUrl;
      } catch (err) {
        const reader = new FileReader();
        reader.onload = () => {
          img.onload = () => processImageElement(img, null);
          img.src = reader.result;
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(input);
      }
    }
  });
}

export async function compressAvatarImage(fileOrDataUrl) {
  return compressImage(fileOrDataUrl, {
    maxSizeBytes: ONE_MB,
    maxWidth: 800,
    maxHeight: 800,
    initialQuality: 0.85,
    outputType: 'image/jpeg'
  });
}

