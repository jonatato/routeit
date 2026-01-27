/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Get optimized image URL - returns WebP if supported, otherwise original
 */
export async function getOptimizedImageUrl(originalUrl: string, webpUrl?: string): Promise<string> {
  if (!webpUrl) return originalUrl;
  const webPSupported = await supportsWebP();
  return webPSupported ? webpUrl : originalUrl;
}

/**
 * Lazy load image with intersection observer (React hook)
 * Note: This is a utility function. For React components, use a proper hook implementation.
 */
export function createLazyImageLoader() {
  return {
    load: (src: string, placeholder?: string) => {
      // This would be implemented as a React hook in a component
      return { src: placeholder || src, loading: true };
    },
  };
}

/**
 * Convert image to WebP format (client-side)
 */
export async function convertToWebP(file: File, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert to WebP'));
            }
          },
          'image/webp',
          quality,
        );
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
