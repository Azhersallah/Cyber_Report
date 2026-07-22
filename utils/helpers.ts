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

import { AppState } from '../types';
import { getLayoutCapacity } from '../constants';

export const getTotalPagesCount = (state: AppState): number => {
  if (state.mode === 'invoice') {
    const numberingMode = state.settings.invoiceNumberingMode || 'all-same';
    const startNum = state.settings.invoiceStartNumber ?? 1;
    const endNum = state.settings.invoiceEndNumber ?? 100;
    const totalInvoices = Math.max(0, endNum - startNum + 1);
    const invoiceLayout = state.settings.invoiceLayout || '2-landscape';
    
    if (invoiceLayout === '2-landscape') {
        return numberingMode === 'all-same' ? totalInvoices : Math.ceil(totalInvoices / 2);
    } else if (invoiceLayout === '4-portrait') {
        return numberingMode === 'all-same' ? totalInvoices : Math.ceil(totalInvoices / 4);
    } else {
        return totalInvoices;
    }
  } else if (state.mode === 'idphoto') {
    const idPhotoLayout = state.settings.idPhotoLayout || '4';
    let currentSectionIndex = 0;
    let pageIndex = 0;
    const numA6Sections = idPhotoLayout === '1' ? 1 : idPhotoLayout === '2' ? 2 : 4;
    const capacity = numA6Sections * 12;
    const activePhotos = state.photos;

    while (currentSectionIndex < activePhotos.length || pageIndex < state.manualPageCount) {
        currentSectionIndex += capacity;
        pageIndex++;
        if (pageIndex > 1000) break;
    }
    return pageIndex;
  } else if (state.mode === 'photos') {
    let currentPhotoIndex = 0;
    let pageIndex = 0;
    const activePhotos = state.photos;
    
    while (currentPhotoIndex < activePhotos.length || pageIndex < state.manualPageCount) {
        const layoutId = state.pageLayouts[pageIndex] || state.globalLayout;
        const capacity = getLayoutCapacity(layoutId, state.settings);
        
        if (layoutId !== 'onlytext') {
            currentPhotoIndex += capacity;
        }
        pageIndex++;
        if (pageIndex > 1000) break;
    }
    return pageIndex;
  }
  
  return state.manualPageCount;
};
