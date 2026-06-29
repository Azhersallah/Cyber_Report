import heic2any from 'heic2any';

/**
 * Convert HEIC image to JPEG
 */
export const convertHeicToJpeg = async (file: File): Promise<Blob> => {
  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    });
    
    // heic2any can return Blob or Blob[], handle both cases
    return Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
  } catch (error) {
    console.error('Failed to convert HEIC to JPEG:', error);
    throw new Error('Failed to convert HEIC image');
  }
};

/**
 * Resize image while maintaining aspect ratio
 */
export const resizeImage = (
  imageDataUrl: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64
      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(resizedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Process uploaded photo: convert HEIC if needed, resize, and return base64
 */
export const processUploadedPhoto = async (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800
): Promise<string> => {
  try {
    let processedFile = file;
    
    // Convert HEIC to JPEG if needed
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      const convertedBlob = await convertHeicToJpeg(file);
      processedFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg'
      });
    }
    
    // Read file as data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(processedFile);
    });
    
    // Resize image
    const resizedDataUrl = await resizeImage(dataUrl, maxWidth, maxHeight);
    
    return resizedDataUrl;
  } catch (error) {
    console.error('Failed to process photo:', error);
    throw error;
  }
};

/**
 * Get image dimensions from data URL
 */
export const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = dataUrl;
  });
};
