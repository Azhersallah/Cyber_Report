import heic2any from 'heic2any';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const readFileAsDataURL = async (file: File): Promise<string> => {
  // Check if file is HEIC/HEIF based on extension or MIME type
  const fileName = file.name.toLowerCase();
  const isHeic = fileName.endsWith('.heic') || 
                 fileName.endsWith('.heif') ||
                 file.type === 'image/heic' || 
                 file.type === 'image/heif';

  if (isHeic) {
    try {
      // Convert HEIC to JPEG blob using the imported library
      const blobOrBlobs = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92
      });
      
      const blob = Array.isArray(blobOrBlobs) ? blobOrBlobs[0] : blobOrBlobs;
      
      // Read the converted blob as DataURL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("HEIC conversion error:", e);
      // Show user-friendly error
      throw new Error(`Failed to convert HEIC file "${file.name}". Please try converting it to JPEG first.`);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const chunkArray = <T,>(array: T[], size: number): T[][] => {
  if (size === 0) return []; // Handle infinite text mode or explicit 0
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};
