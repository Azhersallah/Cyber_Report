import { ResumeData } from '../types';

const RESUME_STORAGE_KEY = 'photoPrinterResumeData';

/**
 * Save resume data to local storage
 */
export const saveResumeData = (data: ResumeData): void => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(RESUME_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save resume data to local storage:', error);
    
    // Handle storage quota exceeded error
    if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
      console.warn('Storage quota exceeded. Resume data could not be saved.');
      // Notify user about storage issue
      if (typeof window !== 'undefined') {
        alert('Storage quota exceeded. Your resume data could not be saved. Please free up some space or reduce the size of your resume (e.g., use a smaller photo).');
      }
    }
  }
};

/**
 * Load resume data from local storage
 */
export const loadResumeData = (): ResumeData | null => {
  try {
    const serialized = localStorage.getItem(RESUME_STORAGE_KEY);
    if (!serialized) {
      return null;
    }
    
    const data = JSON.parse(serialized) as ResumeData;
    
    // Validate data structure
    if (!data.personalInfo || !Array.isArray(data.workExperience) || !Array.isArray(data.education) || !Array.isArray(data.skills)) {
      console.warn('Invalid resume data structure in storage');
      return null;
    }
    
    // Ensure languages array exists (for backward compatibility)
    if (!data.languages) {
      data.languages = [];
    }
    
    return data;
  } catch (error) {
    console.error('Failed to load resume data from local storage:', error);
    return null;
  }
};

/**
 * Clear resume data from local storage
 */
export const clearResumeData = (): void => {
  try {
    localStorage.removeItem(RESUME_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear resume data from local storage:', error);
  }
};
