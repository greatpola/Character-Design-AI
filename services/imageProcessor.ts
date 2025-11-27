
import { GeneratedImage } from '../types';

export const imageProcessor = {
  /**
   * Converts a base64 image into an Instagram-optimized format.
   * Adds a blurred background and centers the image.
   */
  async createInstagramFormat(
    originalImage: GeneratedImage, 
    format: 'feed' | 'story'
  ): Promise<GeneratedImage> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // 1. Set Dimensions
        // Feed: 4:5 (1080 x 1350)
        // Story: 9:16 (1080 x 1920)
        const width = 1080;
        const height = format === 'feed' ? 1350 : 1920;
        
        canvas.width = width;
        canvas.height = height;

        // 2. Draw Blurred Background
        // We simulate a blur by drawing the image scaled up significantly
        ctx.filter = 'blur(40px) brightness(0.9)';
        // Draw image to fill the canvas completely (cover)
        const scaleBg = Math.max(width / img.width, height / img.height);
        const bgW = img.width * scaleBg;
        const bgH = img.height * scaleBg;
        const bgX = (width - bgW) / 2;
        const bgY = (height - bgH) / 2;
        ctx.drawImage(img, bgX, bgY, bgW, bgH);

        // Reset filter for foreground
        ctx.filter = 'none';

        // 3. Draw Main Image (Contain)
        // Leave some padding
        const padding = 80;
        const maxWidth = width - (padding * 2);
        const maxHeight = height - (padding * 3); // More space at bottom for text

        const scaleFg = Math.min(maxWidth / img.width, maxHeight / img.height);
        const fgW = img.width * scaleFg;
        const fgH = img.height * scaleFg;
        const fgX = (width - fgW) / 2;
        const fgY = (height - fgH) / 2;

        // Drop shadow for pop
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;

        ctx.drawImage(img, fgX, fgY, fgW, fgH);

        // 4. Add Branding Text
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        const text = 'Created by Character Studio AI';
        ctx.fillText(text, width / 2, height - 40);

        // 5. Export
        const dataUrl = canvas.toDataURL(originalImage.mimeType);
        // Remove prefix to get raw base64
        const base64Data = dataUrl.split(',')[1];

        resolve({
          data: base64Data,
          mimeType: originalImage.mimeType
        });
      };

      img.onerror = (e) => reject(e);
      img.src = `data:${originalImage.mimeType};base64,${originalImage.data}`;
    });
  }
};
