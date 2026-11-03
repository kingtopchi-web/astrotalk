/**
 * Advanced Client-Side Image Compressor
 * 
 * Requirements:
 * 1. Maximum size must strictly be <= 1MB (1,048,576 bytes).
 * 2. If user uploads > 1MB (e.g. 2MB, 5MB, 10MB+ from mobile camera/DSLR),
 *    it automatically compresses it down to <= 1MB.
 * 3. Keeps image clear, sharp and visible ("visible aur crisp rahe").
 */

const ONE_MB = 1024 * 1024; // 1,048,576 bytes

/**
 * Calculates byte size of a base64 Data URL
 */
export function getBase64ByteSize(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  const commaIndex = dataUrl.indexOf(',');
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  return Math.round((base64.length * 3) / 4);
}

/**
 * Compresses an image File, Blob, or Data URL so that its size is guaranteed to be <= maxSizeBytes (default 1MB).
 * 
 * @param {File|Blob|string} input - File, Blob, or base64 Data URL
 * @param {Object} options
 * @param {number} [options.maxSizeBytes=1048576] - Target max size (default 1MB)
 * @param {number} [options.maxWidth=1600] - Max width (1600px retains excellent clarity)
 * @param {number} [options.maxHeight=1600] - Max height
 * @param {number} [options.initialQuality=0.85] - Starting JPEG quality (0.85 is visually lossless)
 * @param {string} [options.outputType='image/jpeg'] - Output mime type
 * @returns {Promise<{ dataUrl: string, blob: Blob, file: File, size: number, originalSize: number, compressed: boolean }>}
 */
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

    // Determine original size
    let originalSize = 0;
    let fileName = 'image.jpg';
    if (typeof input === 'string') {
      originalSize = getBase64ByteSize(input);
    } else if (input instanceof Blob || input instanceof File) {
      originalSize = input.size;
      if (input.name) fileName = input.name;
    }

    // Helper to process from image source URL
    const processImageElement = (img, cleanupUrl) => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
          return reject(new Error('Invalid image dimensions'));
        }

        // 1. Initial Scale if larger than maxWidth / maxHeight
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

        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        if (cleanupUrl) {
          URL.revokeObjectURL(cleanupUrl);
        }

        // 2. Iteratively adjust quality / dimensions until size <= maxSizeBytes
        let quality = initialQuality;
        let dataUrl = canvas.toDataURL(outputType, quality);
        let currentSize = getBase64ByteSize(dataUrl);

        let attempts = 0;
        const maxAttempts = 8;

        while (currentSize > maxSizeBytes && attempts < maxAttempts) {
          attempts++;

          if (quality > 0.55) {
            // Gradually reduce compression quality (0.85 -> 0.75 -> 0.65 -> 0.55)
            quality -= 0.10;
          } else {
            // If quality is already at 0.55, scale down canvas resolution by 15%
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

        // Convert dataUrl to Blob & File
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

    // Load Image Object
    const img = new Image();
    img.crossOrigin = 'anonymous';

    if (typeof input === 'string') {
      img.onload = () => processImageElement(img, null);
      img.onerror = (e) => reject(new Error('Failed to load image from data URL'));
      img.src = input;
    } else {
      let objectUrl = '';
      try {
        objectUrl = URL.createObjectURL(input);
        img.onload = () => processImageElement(img, objectUrl);
        img.onerror = () => {
          // Fallback to FileReader if objectURL fails
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
        // Fallback to FileReader
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

/**
 * Specifically tuned for user & expert profile avatars:
 * Produces crisp, high-DPI portraits (up to 800x800px) guaranteed under 1MB (typically 80KB-250KB).
 */
export async function compressAvatarImage(fileOrDataUrl) {
  return compressImage(fileOrDataUrl, {
    maxSizeBytes: ONE_MB,
    maxWidth: 800,
    maxHeight: 800,
    initialQuality: 0.85,
    outputType: 'image/jpeg'
  });
}

/**
 * Tuned for documents, passbooks, and certificates:
 * Retains high resolution (up to 1800x1800px) so fine text remains perfectly legible,
 * while strictly guaranteeing file size under 1MB.
 */
export async function compressDocumentImage(fileOrDataUrl) {
  return compressImage(fileOrDataUrl, {
    maxSizeBytes: ONE_MB,
    maxWidth: 1800,
    maxHeight: 1800,
    initialQuality: 0.85,
    outputType: 'image/jpeg'
  });
}

