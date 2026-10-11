/**
 * Compresses an image File to a crisp, lightweight base64 string
 * Scales to fit within max dimensions (default 384x384) with 0.85 quality.
 * Reduces 5MB-10MB images down to ~20KB-40KB, perfectly fitting Firestore and localStorage.
 */
export function compressImage(
  file: File,
  maxWidth = 384,
  maxHeight = 384,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw image smoothed onto canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first for maximum compression efficiency, fall back to jpeg
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData && webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch (_) {}

        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
