
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { AppState, Photo, AppMode, LayoutType, AppSettings, INITIAL_SETTINGS, Language, ResumeData, CustomizationOptions, BusinessCardData, QRCodeData, StampData } from '../types';
import { generateId } from '../utils/helpers';
import { saveResumeData, loadResumeData } from '../utils/resumeStorage';
import { LAYOUTS } from '../constants';

export const getPageInfo = (
  cardIndex: number,
  pageLayouts: Record<number, LayoutType>,
  globalLayout: LayoutType
) => {
  let currentPhotoIndex = 0;
  let pageIdx = 0;
  while (true) {
    let layoutId = pageLayouts[pageIdx] || globalLayout;
    const layoutDef = LAYOUTS.find(l => l.id === layoutId) || LAYOUTS[0];
    const capacity = layoutDef.capacity;
    if (cardIndex >= currentPhotoIndex && cardIndex < currentPhotoIndex + capacity) {
      return { pageIndex: pageIdx, startIndex: currentPhotoIndex, layoutId };
    }
    currentPhotoIndex += capacity;
    pageIdx++;
    if (pageIdx > 1000) break;
  }
  return { pageIndex: 0, startIndex: 0, layoutId: globalLayout };
};

export const getCardSizeKey = (
  cardIndex: number,
  pageLayouts: Record<number, LayoutType>,
  globalLayout: LayoutType
): string => {
  const { layoutId, pageIndex, startIndex } = getPageInfo(cardIndex, pageLayouts, globalLayout);
  const localIndex = cardIndex - startIndex;
  let group = 'grid';
  if (layoutId === 'businesscard-form' || layoutId === 'businesscard-form-reverse') group = 'form';
  return `${group}_${pageIndex}_${localIndex}`;
};

// Action Types
type Action =
  | { type: 'SET_MODE'; payload: AppMode }
  | { type: 'ADD_PHOTOS'; payload: Photo[] }
  | { type: 'REMOVE_PHOTO'; payload: string }
  | { type: 'REMOVE_PHOTO_BY_INDEX'; payload: number }
  | { type: 'UPDATE_PHOTO'; payload: Photo }
  | { type: 'INSERT_PHOTOS'; payload: { index: number; photos: Photo[] } }
  | { type: 'SWAP_PHOTOS'; payload: { sourceIndex: number; targetIndex: number } }
  | { type: 'CLEAR_PHOTOS' }
  | { type: 'CLEAR_ALL' }
  | { type: 'INSERT_PAGE'; payload: { insertIndex: number; count: number; insertAtPageIndex: number } }
  | { type: 'DELETE_PAGE'; payload: { pageIndex: number; startIndex: number; count: number } }
  | { type: 'SET_LAYOUT'; payload: LayoutType }
  | { type: 'SET_PAGE_LAYOUT'; payload: { pageIndex: number; layout: LayoutType } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_GLOBAL_TITLE'; payload: string }
  | { type: 'SET_PAGE_TITLE'; payload: { pageIndex: number; title: string } }
  | { type: 'SET_PAGE_SUBTITLE'; payload: { pageIndex: number; subtitle: string } }
  | { type: 'SET_BATCH_PAGE_TITLE'; payload: { startIndex: number; count: number; title: string } }
  | { type: 'UPDATE_TEXT_AREA'; payload: { key: string; value: string } }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'FILL_CARDS'; payload: { side: 'left' | 'right'; photo: Photo } }
  | { type: 'SET_SLOT_PHOTO'; payload: { index: number; photo: Photo } }
  | { type: 'SET_SECTION_INDEX'; payload: number }
  | { type: 'LOAD_PROJECT'; payload: AppState }
  // Resume Builder Actions
  | { type: 'UPDATE_RESUME_DATA'; payload: Partial<ResumeData> }
  | { type: 'SET_RESUME_TEMPLATE'; payload: string }
  | { type: 'UPDATE_RESUME_CUSTOMIZATION'; payload: Partial<CustomizationOptions> }
  | { type: 'LOAD_RESUME_FROM_STORAGE'; payload: ResumeData }
  | { type: 'CLEAR_RESUME_DATA' }
  | { type: 'SET_RESUME_LANGUAGE'; payload: Language }
  // Business Card Builder Actions
  | { type: 'UPDATE_BUSINESS_CARD_DATA'; payload: Partial<BusinessCardData> }
  | { type: 'SET_BUSINESS_CARD_TEMPLATE'; payload: string }
  | { type: 'UPDATE_BUSINESS_CARD_CUSTOMIZATION'; payload: Partial<CustomizationOptions> }
  | { type: 'SET_BUSINESS_CARD_DESIGN_MODE'; payload: boolean }
  | { type: 'CLEAR_BUSINESS_CARD_DATA' }
  | { type: 'SELECT_BUSINESS_CARD_SLOT'; payload: number | null }
  | { type: 'SELECT_PAGE'; payload: number | null }
  | { type: 'UPDATE_BUSINESS_CARD_SIZE'; payload: { index: number; width: number; height: number; x?: number; y?: number } }
  | { type: 'DELETE_BUSINESS_CARD_SLOT'; payload: number }
  | { type: 'RESTORE_BUSINESS_CARD_SLOT'; payload: number }
  | { type: 'SET_BUSINESS_CARD_LANGUAGE'; payload: Language }
  | { type: 'RESET_PAGE'; payload: { pageIndex: number; startIndex: number; count: number } }
  // QR Code Generator Actions
  | { type: 'UPDATE_QR_CODE_DATA'; payload: Partial<QRCodeData> }
  // Stamp Creator Actions
  | { type: 'UPDATE_STAMP_DATA'; payload: Partial<StampData> }
  | { type: 'RESET_STAMP_DATA' };

function getGeneratedPagesCount(state: AppState, activePhotos: (Photo | null)[]): number {
  if (state.mode === 'invoice') {
    const invoiceLayout = state.settings.invoiceLayout || '2-landscape';
    const startNum = state.settings.invoiceStartNumber || 1;
    const endNum = state.settings.invoiceEndNumber ?? 100;
    const totalInvoices = Math.max(0, endNum - startNum + 1);
    if (invoiceLayout === '1-portrait') {
      return totalInvoices;
    } else if (invoiceLayout === '2-landscape') {
      const numberingMode = state.settings.invoiceNumberingMode || 'all-same';
      if (numberingMode === 'all-same') {
        return totalInvoices;
      } else {
        return Math.ceil(totalInvoices / 2);
      }
    } else if (invoiceLayout === '4-portrait') {
      const numberingMode = state.settings.invoiceNumberingMode || 'all-same';
      if (numberingMode === 'all-same') {
        return totalInvoices;
      } else {
        return Math.ceil(totalInvoices / 4);
      }
    }
    return 0;
  } else if (state.mode === 'idphoto') {
    const idPhotoLayout = state.settings.idPhotoLayout || '4';
    let numA6Sections = 4;
    if (idPhotoLayout === '1') numA6Sections = 1;
    else if (idPhotoLayout === '2') numA6Sections = 2;
    const capacity = numA6Sections * 12;
    
    let currentSectionIndex = 0;
    let pageIndex = 0;
    while (currentSectionIndex < activePhotos.length || pageIndex < state.manualPageCount) {
      currentSectionIndex += capacity;
      pageIndex++;
      if (pageIndex > 1000) break;
    }
    return pageIndex;
  } else {
    let currentPhotoIndex = 0;
    let pageIndex = 0;
    while (currentPhotoIndex < activePhotos.length || pageIndex < state.manualPageCount) {
      let layoutId: LayoutType = state.pageLayouts[pageIndex] || state.globalLayout;
      if (state.mode === 'businesscard') {
        const pageLayout = state.pageLayouts[pageIndex];
        if (pageLayout === 'businesscard' || pageLayout === 'businesscard-form' || pageLayout === 'businesscard-form-reverse') {
          layoutId = pageLayout;
        } else {
          if (state.globalLayout === 'businesscard-form') layoutId = 'businesscard-form';
          else if (state.globalLayout === 'businesscard-form-reverse') layoutId = 'businesscard-form-reverse';
          else layoutId = 'businesscard';
        }
      }
      
      const layoutDef = LAYOUTS.find(l => l.id === layoutId) || LAYOUTS[0];
      const capacity = layoutDef.capacity;
      if (layoutId !== 'onlytext') {
        currentPhotoIndex += capacity;
      }
      pageIndex++;
      if (pageIndex > 1000) break;
    }
    return pageIndex;
  }
}

// Initial State
const initialState: AppState = {
  photos: [],
  cardPhotos: [],
  invoicePhotos: [],
  idPhotos: [],
  mode: 'photos',
  globalLayout: '1',
  lastPhotosLayout: '1',
  settings: INITIAL_SETTINGS,
  theme: 'light',
  language: 'en',
  zoom: 1,
  globalTitle: 'New Project',
  pageTitles: {},
  pageSubtitles: {},
  textAreas: {},
  pageLayouts: {},
  currentSectionIndex: 0,
  manualPageCount: 1,
  selectedPageIndex: 0,
  // Resume Builder Initial State
  resumeData: {
    personalInfo: {
      fullName: '',
      title: '',
      phone: '',
      email: '',
      address: '',
      linkedin: '',
      website: '',
      summary: ''
    },
    workExperience: [],
    education: [],
    skills: [],
    languages: [],
    photo: null,
    customSections: []
  },
  selectedResumeTemplate: 'professional',
  resumeCustomization: {},
  resumeLanguage: 'en',
  // Business Card Builder Initial State
  businessCardData: {
    type: 'personal',
    fullName: '',
    title: '',
    company: '',
    department: '',
    phone1: '',
    phone2: '',
    email: '',
    website: '',
    address: '',
    tagline: '',
    logo: null,
    photo: null,
    social: {}
  },
  selectedBusinessCardTemplate: 'modern',
  businessCardCustomization: {},
  businessCardDesignMode: false,
  businessCardLanguage: 'en',
  selectedBusinessCardIndex: null,
  businessCardSizes: {},
  // QR Code Generator Initial State
  qrCodeData: {
    type: 'text',
    content: '',
    wifiSSID: '',
    wifiPassword: '',
    wifiSecurity: 'WPA',
    wifiHidden: false,
    latitude: '',
    longitude: '',
    size: 256,
    fgColor: '#000000',
    bgColor: '#FFFFFF',
    includeMargin: true,
    errorLevel: 'M',
    logoImage: null,
    logoSize: 20,
  },
  stampData: {
    shape: 'circle',
    width: 40,
    height: 40,
    outerText: '',
    innerText: '',
    centerText: '',
    fontFamily: 'Inter',
    outerFontFamily: 'Inter',
    innerFontFamily: 'Inter',
    centerFontFamily: 'Inter',
    fontSize: 40,
    outerFontSize: 38,
    innerFontSize: 38,
    centerFontSize: 42,
    outerRadiusOffset: -20,
    innerRadiusOffset: -50,
    letterSpacing: 2,
    textColor: '#1e3a8a',
    borderWidth: 4,
    hasInnerRing: true,
    hasDottedRing: false,
    hasStars: true,
    starCount: 2,
    distressEffect: 0,
    monochrome: false,
    centerImage: null,
    centerImageSize: 55,
    centerLayout: 'text-bottom',
    centerImageOffsetX: 0,
    centerImageOffsetY: 0,
    centerTextOffsetX: 0,
    centerTextOffsetY: 0,
    outerTextOffsetX: 0,
    outerTextOffsetY: 0,
    innerTextOffsetX: 0,
    innerTextOffsetY: 0,
    extraCenterText: '',
    extraCenterFontFamily: 'Noto Naskh Arabic',
    extraCenterFontSize: 24,
    extraCenterTextOffsetX: 0,
    extraCenterTextOffsetY: 0,
    signatureThreshold: 128,
    activeSavedDesignId: null
  }
};

// Helper to get the key for the current mode's photo array
const getPhotoKeyForMode = (mode: AppMode): keyof Pick<AppState, 'photos' | 'cardPhotos' | 'invoicePhotos' | 'idPhotos'> => {
  if (mode === 'businesscard') return 'cardPhotos';
  if (mode === 'invoice') return 'invoicePhotos';
  if (mode === 'idphoto') return 'idPhotos';
  return 'photos';
};

// Reducer
const appReducer = (state: AppState, action: Action): AppState => {
  const activeKey = getPhotoKeyForMode(state.mode);
  const activePhotos = state[activeKey] as (Photo | null)[];

  switch (action.type) {
    case 'LOAD_PROJECT': {
      const { settings: incomingSettings, ...projectContent } = action.payload;
      // Preserve the API key when loading a project
      const preservedApiKey = state.settings.geminiApiKey;
      
      // Ensure footerDate exists (backward compatibility)
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const todayDate = `${day}/${month}/${year}`;

      // Migrate invoiceTotal -> invoiceEndNumber (backward compatibility)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const migratedSettings: any = { ...incomingSettings };
      if (migratedSettings.invoiceTotal != null && incomingSettings?.invoiceEndNumber == null) {
        const start = incomingSettings?.invoiceStartNumber ?? 1;
        migratedSettings.invoiceEndNumber = start + Number(migratedSettings.invoiceTotal) - 1;
        delete migratedSettings.invoiceTotal;
      }

      // Migrate old resumeCustomization (single object) to per-template map
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let migratedCustomization = projectContent.resumeCustomization as any;
      if (migratedCustomization && (migratedCustomization.colors !== undefined || migratedCustomization.fontFamily !== undefined || migratedCustomization.fontSize !== undefined || migratedCustomization.spacing !== undefined)) {
        // Old format: single CustomizationOptions object -> wrap in per-template map
        const templateId = projectContent.selectedResumeTemplate || 'professional';
        migratedCustomization = { [templateId]: migratedCustomization };
      }

      return {
        ...state,
        ...projectContent,
        mode: 'photos',
        resumeCustomization: migratedCustomization || {},
        stampData: projectContent.stampData || initialState.stampData,
        settings: {
          ...state.settings,
          ...migratedSettings,
          geminiApiKey: preservedApiKey, // Always keep the existing API key
          footerDate: migratedSettings?.footerDate || todayDate // Use saved date or today's date for old projects
        },
        zoom: state.zoom,
        currentSectionIndex: 0
      };
    }

    case 'SET_MODE': {
      const targetMode = 'photos';
      const currentMode = state.mode;

      let nextLastPhotosLayout = state.lastPhotosLayout;
      let newLayout = state.globalLayout;

      if (currentMode === 'photos') {
        if (state.globalLayout !== 'businesscard' && state.globalLayout !== 'businesscard-form' && state.globalLayout !== 'businesscard-form-reverse' && state.globalLayout !== 'invoice' && state.globalLayout !== 'idphoto') {
          nextLastPhotosLayout = state.globalLayout;
        }
      }

      if (targetMode === 'businesscard') {
        newLayout = 'businesscard';
      } else if (targetMode === 'invoice') {
        newLayout = 'invoice';
      } else if (targetMode === 'idphoto') {
        newLayout = 'idphoto';
      } else if (targetMode === 'photos') {
        if (nextLastPhotosLayout === 'businesscard' || nextLastPhotosLayout === 'businesscard-form' || nextLastPhotosLayout === 'businesscard-form-reverse' || nextLastPhotosLayout === 'invoice' || nextLastPhotosLayout === 'idphoto') {
          newLayout = '1';
        } else {
          newLayout = nextLastPhotosLayout;
        }
      }

      // Save current page layouts to mode cache
      const updatedModePageLayouts = {
        ...(state.modePageLayouts || {}),
        [currentMode]: state.pageLayouts
      };

      // Restore target mode's page layouts
      const restoredPageLayouts = updatedModePageLayouts[targetMode] || {};

      return {
        ...state,
        mode: targetMode,
        globalLayout: newLayout,
        lastPhotosLayout: nextLastPhotosLayout,
        currentSectionIndex: 0,
        pageLayouts: restoredPageLayouts,
        modePageLayouts: updatedModePageLayouts,
        selectedPageIndex: null
      };
    }

    case 'ADD_PHOTOS': {
      const newPhotos = [...activePhotos];
      const incoming = action.payload;
      let incomingIndex = 0;
      
      // Fill null/empty slots first
      for (let i = 0; i < newPhotos.length && incomingIndex < incoming.length; i++) {
        if (newPhotos[i] === null) {
          newPhotos[i] = incoming[incomingIndex];
          incomingIndex++;
        }
      }
      
      // Append remaining incoming photos
      if (incomingIndex < incoming.length) {
        newPhotos.push(...incoming.slice(incomingIndex));
      }
      
      return { ...state, [activeKey]: newPhotos };
    }

    case 'INSERT_PHOTOS': {
      const { index, photos } = action.payload;
      const newPhotos = [...activePhotos];
      const safeIndex = Math.max(0, Math.min(index, newPhotos.length));
      newPhotos.splice(safeIndex, 0, ...photos);
      return { ...state, [activeKey]: newPhotos };
    }

    case 'SET_SLOT_PHOTO': {
      const { index, photo } = action.payload;
      const newPhotos = [...activePhotos];
      while (newPhotos.length <= index) {
        newPhotos.push(null);
      }
      newPhotos[index] = photo;
      return { ...state, [activeKey]: newPhotos };
    }

    case 'FILL_CARDS': {
      const { side, photo } = action.payload;
      const newCards = [...(state.cardPhotos || [])];
      const isFormLayout = state.globalLayout === 'businesscard-form' || state.globalLayout === 'businesscard-form-reverse';
      const minSize = isFormLayout ? 6 : 10;
      while (newCards.length < minSize) newCards.push(null);

      if (isFormLayout) {
        // Form layout: left = large form (index 0), right = 5 small cards (indices 1-5)
        if (side === 'left') {
          newCards[0] = { ...photo, id: generateId() };
        } else {
          for (let i = 1; i <= 5; i++) {
            newCards[i] = { ...photo, id: generateId() };
          }
        }
      } else {
        // Grid layout: left = even indices, right = odd indices
        const remainder = side === 'right' ? 1 : 0;
        for (let i = 0; i < newCards.length; i++) {
          if (i % 2 === remainder) {
            newCards[i] = { ...photo, id: generateId() };
          }
        }
      }
      return { ...state, cardPhotos: newCards };
    }

    case 'SWAP_PHOTOS': {
      const { sourceIndex, targetIndex } = action.payload;
      const newPhotos = [...activePhotos];
      if (sourceIndex < 0 || sourceIndex >= newPhotos.length || targetIndex < 0 || targetIndex >= newPhotos.length) {
        return state;
      }
      const temp = newPhotos[sourceIndex];
      newPhotos[sourceIndex] = newPhotos[targetIndex];
      newPhotos[targetIndex] = temp;
      return { ...state, [activeKey]: newPhotos };
    }

    case 'REMOVE_PHOTO':
      if (state.mode === 'businesscard' || state.mode === 'invoice' || state.mode === 'idphoto') {
        const newPhotos = activePhotos.map(p => (p && p.id === action.payload ? null : p));
        return { ...state, [activeKey]: newPhotos };
      }
      return { ...state, [activeKey]: activePhotos.filter(p => !p || p.id !== action.payload) };

    case 'REMOVE_PHOTO_BY_INDEX': {
      const newPhotos = [...activePhotos];
      if (action.payload >= 0 && action.payload < newPhotos.length) {
        newPhotos[action.payload] = null;
      }
      return { ...state, [activeKey]: newPhotos };
    }

    case 'UPDATE_PHOTO':
      return {
        ...state,
        [activeKey]: activePhotos.map(p => (p && p.id === action.payload.id ? action.payload : p)),
      };

    case 'CLEAR_PHOTOS':
      return {
        ...state,
        [activeKey]: [],
        currentSectionIndex: 0,
        manualPageCount: 1
      };

    case 'CLEAR_ALL': {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const todayDate = `${day}/${month}/${year}`;
      
      return {
        ...state,
        photos: [],
        cardPhotos: [],
        invoicePhotos: [],
        idPhotos: [],
        globalTitle: 'New Project',
        pageTitles: {},
        pageSubtitles: {},
        textAreas: {},
        pageLayouts: {},
        currentSectionIndex: 0,
        manualPageCount: 1,
        selectedPageIndex: 0,
        settings: {
          ...state.settings,
          footerDate: todayDate
        }
      };
    }

    case 'INSERT_PAGE': {
      const { insertIndex, count, insertAtPageIndex } = action.payload;
      let newPhotos = [...activePhotos];

      if (newPhotos.length === 0 && count > 0) {
        newPhotos = Array(count).fill(null);
      }
      while (newPhotos.length < insertIndex) {
        newPhotos.push(null);
      }
      if (count > 0) {
        const inserts = Array(count).fill(null);
        newPhotos.splice(insertIndex, 0, ...inserts);
      }

      const newPageTitles: Record<number, string> = {};
      const newPageLayouts: Record<number, LayoutType> = {};
      const newTextAreas: Record<string, string> = {};
      const newBusinessCardSizes: Record<string, any> = {};

      Object.keys(state.businessCardSizes || {}).forEach(k => {
        const parts = k.split('_');
        if (parts.length === 3) {
          const group = parts[0];
          const p = parseInt(parts[1]);
          const local = parts[2];
          
          if (p >= insertAtPageIndex) {
            newBusinessCardSizes[`${group}_${p + 1}_${local}`] = state.businessCardSizes[k];
          } else {
            newBusinessCardSizes[k] = state.businessCardSizes[k];
          }
        } else {
          newBusinessCardSizes[k] = state.businessCardSizes[k];
        }
      });

      Object.keys(state.pageTitles).forEach(k => {
        const p = parseInt(k);
        if (p >= insertAtPageIndex) newPageTitles[p + 1] = state.pageTitles[p];
        else newPageTitles[p] = state.pageTitles[p];
      });

      Object.keys(state.pageLayouts).forEach(k => {
        const p = parseInt(k);
        if (p >= insertAtPageIndex) newPageLayouts[p + 1] = state.pageLayouts[p];
        else newPageLayouts[p] = state.pageLayouts[p];
      });

      Object.keys(state.textAreas).forEach(key => {
        const match = key.match(/^page_(\d+)(.*)$/);
        if (match) {
          const pageNum = parseInt(match[1]);
          if (pageNum >= insertAtPageIndex) {
            const newKey = `page_${pageNum + 1}${match[2]}`;
            newTextAreas[newKey] = state.textAreas[key];
          } else newTextAreas[key] = state.textAreas[key];
        } else newTextAreas[key] = state.textAreas[key];
      });

      return {
        ...state,
        [activeKey]: newPhotos,
        pageTitles: newPageTitles,
        pageLayouts: newPageLayouts,
        textAreas: newTextAreas,
        businessCardSizes: newBusinessCardSizes,
        manualPageCount: state.manualPageCount + 1
      };
    }
    case 'DELETE_PAGE': {
      const { pageIndex, startIndex, count } = action.payload;
      const totalCurrentPages = getGeneratedPagesCount(state, activePhotos);
      
      if (totalCurrentPages <= 1) {
        // Just clear the contents of this single page, don't delete the page itself.
        const newPhotos = [...activePhotos];
        if (count > 0 && startIndex < newPhotos.length) {
          for (let i = startIndex; i < startIndex + count && i < newPhotos.length; i++) {
            newPhotos[i] = null;
          }
        }
        
        const newPageTitles = { ...state.pageTitles };
        delete newPageTitles[pageIndex];

        const newPageLayouts = { ...state.pageLayouts };
        delete newPageLayouts[pageIndex];

        const newTextAreas = { ...state.textAreas };
        Object.keys(newTextAreas).forEach(key => {
          const match = key.match(/^page_(\d+)(.*)$/);
          if (match && parseInt(match[1]) === pageIndex) {
            delete newTextAreas[key];
          }
        });

        const newBusinessCardSizes: Record<string, any> = {};
        Object.keys(state.businessCardSizes || {}).forEach(k => {
          const parts = k.split('_');
          if (parts.length === 3) {
            const p = parseInt(parts[1]);
            if (p !== pageIndex) {
              newBusinessCardSizes[k] = state.businessCardSizes[k];
            }
          } else {
            newBusinessCardSizes[k] = state.businessCardSizes[k];
          }
        });

        return {
          ...state,
          [activeKey]: newPhotos,
          pageTitles: newPageTitles,
          textAreas: newTextAreas,
          pageLayouts: newPageLayouts,
          businessCardSizes: newBusinessCardSizes
        };
      }

      const newPhotos = [...activePhotos];
      if (count > 0 && startIndex < newPhotos.length) {
        newPhotos.splice(startIndex, count);
      }

      const newPageTitles: Record<number, string> = {};
      const newTextAreas: Record<string, string> = {};
      const newPageLayouts: Record<number, LayoutType> = {};
      const newBusinessCardSizes: Record<string, any> = {};

      Object.keys(state.businessCardSizes || {}).forEach(k => {
        const parts = k.split('_');
        if (parts.length === 3) {
          const group = parts[0];
          const p = parseInt(parts[1]);
          const local = parts[2];
          
          if (p === pageIndex) {
            // Deleted page cards size, skip it
            return;
          } else if (p > pageIndex) {
            newBusinessCardSizes[`${group}_${p - 1}_${local}`] = state.businessCardSizes[k];
          } else {
            newBusinessCardSizes[k] = state.businessCardSizes[k];
          }
        } else {
          newBusinessCardSizes[k] = state.businessCardSizes[k];
        }
      });

      Object.keys(state.pageLayouts).forEach(k => {
        const p = parseInt(k);
        if (p === pageIndex) return;
        if (p > pageIndex) newPageLayouts[p - 1] = state.pageLayouts[p];
        else newPageLayouts[p] = state.pageLayouts[p];
      });

      Object.keys(state.pageTitles).forEach(k => {
        const pageNum = parseInt(k);
        if (pageNum === pageIndex) return;
        if (pageNum > pageIndex) newPageTitles[pageNum - 1] = state.pageTitles[pageNum];
        else newPageTitles[pageNum] = state.pageTitles[pageNum];
      });

      Object.keys(state.textAreas).forEach(key => {
        const match = key.match(/^page_(\d+)(.*)$/);
        if (match) {
          const pageNum = parseInt(match[1]);
          if (pageNum === pageIndex) return;
          if (pageNum > pageIndex) {
            const newKey = `page_${pageNum - 1}${match[2]}`;
            newTextAreas[newKey] = state.textAreas[key];
          } else newTextAreas[key] = state.textAreas[key];
        } else newTextAreas[key] = state.textAreas[key];
      });

      return {
        ...state,
        [activeKey]: newPhotos,
        pageTitles: newPageTitles,
        textAreas: newTextAreas,
        pageLayouts: newPageLayouts,
        businessCardSizes: newBusinessCardSizes,
        manualPageCount: Math.max(1, state.manualPageCount - 1)
      };
    }
    case 'RESET_PAGE': {
      const { pageIndex, startIndex, count } = action.payload;
      const newPhotos = [...activePhotos];
      
      if (count > 0 && startIndex < newPhotos.length) {
        for (let i = startIndex; i < startIndex + count && i < newPhotos.length; i++) {
          newPhotos[i] = null;
        }
      }
      
      const newPageTitles = { ...state.pageTitles };
      delete newPageTitles[pageIndex];

      const newPageLayouts = { ...state.pageLayouts };
      delete newPageLayouts[pageIndex];

      const newTextAreas = { ...state.textAreas };
      Object.keys(newTextAreas).forEach(key => {
        const match = key.match(/^page_(\d+)(.*)$/);
        if (match && parseInt(match[1]) === pageIndex) {
          delete newTextAreas[key];
        }
      });

      const newBusinessCardSizes: Record<string, any> = {};
      Object.keys(state.businessCardSizes || {}).forEach(k => {
        const parts = k.split('_');
        if (parts.length === 3) {
          const p = parseInt(parts[1]);
          if (p !== pageIndex) {
            newBusinessCardSizes[k] = state.businessCardSizes[k];
          }
        } else {
          newBusinessCardSizes[k] = state.businessCardSizes[k];
        }
      });

      return {
        ...state,
        [activeKey]: newPhotos,
        pageTitles: newPageTitles,
        textAreas: newTextAreas,
        pageLayouts: newPageLayouts,
        businessCardSizes: newBusinessCardSizes
      };
    }
    case 'SET_LAYOUT':
      return { ...state, globalLayout: action.payload };
    case 'SET_PAGE_LAYOUT':
      return {
        ...state,
        pageLayouts: {
          ...state.pageLayouts,
          [action.payload.pageIndex]: action.payload.layout
        }
      };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_GLOBAL_TITLE':
      return {
        ...state,
        globalTitle: action.payload,
        pageTitles: {}
      };
    case 'SET_PAGE_TITLE':
      return {
        ...state,
        pageTitles: { ...state.pageTitles, [action.payload.pageIndex]: action.payload.title }
      };
    case 'SET_PAGE_SUBTITLE':
      return {
        ...state,
        pageSubtitles: { ...state.pageSubtitles, [action.payload.pageIndex]: action.payload.subtitle }
      };
    case 'SET_BATCH_PAGE_TITLE': {
      const { startIndex, count, title } = action.payload;
      const updatedTitles = { ...state.pageTitles };
      for (let i = 0; i < count; i++) {
        updatedTitles[startIndex + i] = title;
      }
      return {
        ...state,
        pageTitles: updatedTitles
      };
    }
    case 'UPDATE_TEXT_AREA':
      return {
        ...state,
        textAreas: { ...state.textAreas, [action.payload.key]: action.payload.value }
      };
    case 'SET_ZOOM':
      return { ...state, zoom: Math.min(3.0, Math.max(0.2, action.payload)) };
    case 'SET_SECTION_INDEX':
      return { ...state, currentSectionIndex: action.payload };
    
    // Resume Builder Reducers
    case 'UPDATE_RESUME_DATA':
      return {
        ...state,
        resumeData: {
          ...state.resumeData,
          ...action.payload,
          personalInfo: action.payload.personalInfo 
            ? { ...state.resumeData.personalInfo, ...action.payload.personalInfo }
            : state.resumeData.personalInfo,
          workExperience: action.payload.workExperience ?? state.resumeData.workExperience,
          education: action.payload.education ?? state.resumeData.education,
          skills: action.payload.skills ?? state.resumeData.skills,
          languages: action.payload.languages ?? state.resumeData.languages,
          photo: action.payload.photo !== undefined ? action.payload.photo : state.resumeData.photo,
          customSections: action.payload.customSections ?? state.resumeData.customSections
        }
      };
    
    case 'SET_RESUME_TEMPLATE':
      return { ...state, selectedResumeTemplate: action.payload };
    
    case 'UPDATE_RESUME_CUSTOMIZATION': {
      const tpl = state.selectedResumeTemplate;
      const current = state.resumeCustomization[tpl] || {};
      return {
        ...state,
        resumeCustomization: {
          ...state.resumeCustomization,
          [tpl]: { ...current, ...action.payload }
        }
      };
    }
    
    case 'LOAD_RESUME_FROM_STORAGE':
      return { ...state, resumeData: action.payload };
    
    case 'SET_RESUME_LANGUAGE':
      return { ...state, resumeLanguage: action.payload };
    
    case 'CLEAR_RESUME_DATA':
      return {
        ...state,
        resumeData: {
          personalInfo: {
            fullName: '',
            title: '',
            phone: '',
            email: '',
            address: '',
            linkedin: '',
            website: '',
            summary: ''
          },
          workExperience: [],
          education: [],
          skills: [],
          languages: [],
          photo: null,
          customSections: []
        }
      };

    // Business Card Builder Reducers
    case 'UPDATE_BUSINESS_CARD_DATA':
      return {
        ...state,
        businessCardData: {
          ...state.businessCardData,
          ...action.payload,
          social: action.payload.social
            ? { ...state.businessCardData.social, ...action.payload.social }
            : state.businessCardData.social
        }
      };

    case 'SET_BUSINESS_CARD_TEMPLATE':
      return { ...state, selectedBusinessCardTemplate: action.payload };

    case 'UPDATE_BUSINESS_CARD_CUSTOMIZATION': {
      const bcTpl = state.selectedBusinessCardTemplate;
      const bcCurrent = state.businessCardCustomization[bcTpl] || {};
      return {
        ...state,
        businessCardCustomization: {
          ...state.businessCardCustomization,
          [bcTpl]: { ...bcCurrent, ...action.payload }
        }
      };
    }

    case 'SET_BUSINESS_CARD_DESIGN_MODE':
      return { ...state, businessCardDesignMode: action.payload };

    case 'SET_BUSINESS_CARD_LANGUAGE':
      return { ...state, businessCardLanguage: action.payload };

    case 'CLEAR_BUSINESS_CARD_DATA':
      return {
        ...state,
        businessCardData: {
          type: 'personal',
          fullName: '',
          title: '',
          company: '',
          department: '',
          phone1: '',
          phone2: '',
          email: '',
          website: '',
          address: '',
          tagline: '',
          logo: null,
          photo: null,
          social: {}
        }
      };

    case 'SELECT_BUSINESS_CARD_SLOT':
      return { ...state, selectedBusinessCardIndex: action.payload };
    case 'SELECT_PAGE':
      return { ...state, selectedPageIndex: action.payload };

    case 'UPDATE_BUSINESS_CARD_SIZE': {
      const key = getCardSizeKey(action.payload.index, state.pageLayouts, state.globalLayout);
      const sizes = { ...state.businessCardSizes };
      sizes[key] = {
        ...sizes[key],
        width: action.payload.width,
        height: action.payload.height,
        x: action.payload.x !== undefined ? action.payload.x : sizes[key]?.x,
        y: action.payload.y !== undefined ? action.payload.y : sizes[key]?.y,
        hidden: false
      };
      return { ...state, businessCardSizes: sizes };
    }

    case 'DELETE_BUSINESS_CARD_SLOT': {
      const key = getCardSizeKey(action.payload, state.pageLayouts, state.globalLayout);
      const sizes = { ...state.businessCardSizes };
      sizes[key] = {
        ...sizes[key],
        hidden: true
      };
      const newCardPhotos = [...state.cardPhotos];
      if (action.payload < newCardPhotos.length) {
        newCardPhotos[action.payload] = null;
      }
      return { 
        ...state, 
        businessCardSizes: sizes, 
        cardPhotos: newCardPhotos,
        selectedBusinessCardIndex: state.selectedBusinessCardIndex === action.payload ? null : state.selectedBusinessCardIndex
      };
    }

    case 'RESTORE_BUSINESS_CARD_SLOT': {
      const gIdx = action.payload;
      const sizes = { ...state.businessCardSizes };

      const { startIndex, layoutId } = getPageInfo(gIdx, state.pageLayouts, state.globalLayout);
      const isForm = layoutId !== 'businesscard' && gIdx === startIndex;
      const key = getCardSizeKey(gIdx, state.pageLayouts, state.globalLayout);
      const restoringWidth = sizes[key]?.width || 101.5;
      const restoringHeight = sizes[key]?.height || (isForm ? 290 : 58);

      sizes[key] = {
        ...sizes[key],
        width: restoringWidth,
        height: restoringHeight,
        hidden: false
      };

      // Balance card heights to prevent page overflow
      if (!isForm) {
        const visibleCards = [];
        let shouldBalance = false;

        if (layoutId === 'businesscard') {
          shouldBalance = true;
          const isEven = gIdx % 2 === 0;
          const offsets = isEven ? [0, 2, 4, 6, 8] : [1, 3, 5, 7, 9];
          
          offsets.forEach(offset => {
            const idx = startIndex + offset;
            const idxKey = getCardSizeKey(idx, state.pageLayouts, state.globalLayout);
            const cardSize = sizes[idxKey];
            if (idx === gIdx || !cardSize?.hidden) {
              visibleCards.push({
                index: idx,
                key: idxKey,
                height: idx === gIdx ? restoringHeight : (cardSize?.height || 58)
              });
            }
          });
        } else if (layoutId === 'businesscard-form' || layoutId === 'businesscard-form-reverse') {
          shouldBalance = true;
          for (let i = 1; i <= 5; i++) {
            const idx = startIndex + i;
            const idxKey = getCardSizeKey(idx, state.pageLayouts, state.globalLayout);
            const cardSize = sizes[idxKey];
            if (idx === gIdx || !cardSize?.hidden) {
              visibleCards.push({
                index: idx,
                key: idxKey,
                height: idx === gIdx ? restoringHeight : (cardSize?.height || 58)
              });
            }
          }
        }

        if (shouldBalance) {
          let totalHeight = visibleCards.reduce((sum, c) => sum + c.height, 0);
          if (totalHeight > 290) {
            let overflow = totalHeight - 290;

            // Shrink cards that are larger than 58 first
            const enlargedCards = visibleCards.filter(c => c.height > 58);
            const capacity = enlargedCards.reduce((sum, c) => sum + (c.height - 58), 0);

            if (capacity >= overflow) {
              enlargedCards.forEach(c => {
                const reduction = overflow * (c.height - 58) / capacity;
                c.height -= reduction;
              });
            } else {
              enlargedCards.forEach(c => {
                c.height = 58;
              });
              overflow -= capacity;

              // Shrink further down to 10 if needed
              const capacity2 = visibleCards.reduce((sum, c) => sum + (c.height - 10), 0);
              if (capacity2 >= overflow) {
                visibleCards.forEach(c => {
                  const reduction = overflow * (c.height - 10) / capacity2;
                  c.height -= reduction;
                });
              } else {
                visibleCards.forEach(c => {
                  c.height = 10;
                });
              }
            }

            // Write back precise heights (without rounding, to prevent CSS overflow due to subpixel rendering)
            visibleCards.forEach(c => {
              sizes[c.key] = {
                ...sizes[c.key],
                height: c.height
              };
            });
          }
        }
      }

      return { ...state, businessCardSizes: sizes };
    }

    // QR Code Generator Reducers
    case 'UPDATE_QR_CODE_DATA':
      return {
        ...state,
        qrCodeData: {
          ...state.qrCodeData,
          ...action.payload
        }
      };

    // Stamp Creator Reducers
    case 'UPDATE_STAMP_DATA':
      return {
        ...state,
        stampData: {
          ...state.stampData,
          ...action.payload
        }
      };

    case 'RESET_STAMP_DATA':
      return {
        ...state,
        stampData: initialState.stampData
      };
    
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.process && (window as any).process.type === 'renderer';
const ipcRenderer = isElectron ? (window as any).require('electron').ipcRenderer : null;

// Load initial theme/language synchronously to prevent flash
// Note: Theme is already applied in index.html script before React loads
function getInitialState(): AppState {
  let theme: 'light' | 'dark' = 'light';
  let language: 'en' | 'ku' | 'ar' = 'en';
  let settings = INITIAL_SETTINGS;

  try {
    // Try localStorage first (sync)
    const savedTheme = localStorage.getItem('photoPrinterTheme');
    const savedLanguage = localStorage.getItem('photoPrinterLanguage');
    const savedSettings = localStorage.getItem('photoPrinterSettings');
    const savedApiKey = localStorage.getItem('geminiApiKey');

    if (savedTheme) theme = savedTheme as 'light' | 'dark';
    if (savedLanguage) language = savedLanguage as 'en' | 'ku' | 'ar';
    if (savedSettings) {
      settings = { ...INITIAL_SETTINGS, ...JSON.parse(savedSettings) };
    }
    if (savedApiKey) {
      settings.geminiApiKey = savedApiKey;
    }

    // Theme and direction are already applied in index.html script
    // Just ensure they match (in case localStorage changed)
    const hasDarkClass = document.documentElement.classList.contains('dark');
    if (theme === 'dark' && !hasDarkClass) {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light' && hasDarkClass) {
      document.documentElement.classList.remove('dark');
    }

    // Apply language direction
    document.documentElement.dir = (language === 'ku' || language === 'ar') ? 'rtl' : 'ltr';
  } catch (e) {
    console.error("Failed to load initial settings:", e);
  }

  return {
    ...initialState,
    settings,
    theme,
    language
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, getInitialState);

  // Load resume data from local storage on mount
  React.useEffect(() => {
    const savedResumeData = loadResumeData();
    if (savedResumeData) {
      dispatch({ type: 'LOAD_RESUME_FROM_STORAGE', payload: savedResumeData });
    }
  }, []);

  // Auto-save resume data when it changes
  React.useEffect(() => {
    // Debounce save to avoid excessive writes
    const timeoutId = setTimeout(() => {
      saveResumeData(state.resumeData);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state.resumeData]);

  // Load settings from JSON file (Electron) on mount
  React.useEffect(() => {
    const loadSettingsFromFile = async () => {
      if (!isElectron || !ipcRenderer) return;

      try {
        const savedData = await ipcRenderer.invoke('load-settings');

        if (savedData) {
          dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
              ...savedData.settings,
              geminiApiKey: savedData.geminiApiKey || savedData.settings?.geminiApiKey || ''
            }
          });

          // Only change theme if different
          if (savedData.theme && savedData.theme !== state.theme) {
            dispatch({ type: 'TOGGLE_THEME' });
          }
          if (savedData.language && savedData.language !== state.language) {
            dispatch({ type: 'SET_LANGUAGE', payload: savedData.language });
          }
        }
      } catch (e) {
        console.error("Failed to load settings from file:", e);
      }
    };

    loadSettingsFromFile();
  }, []);

  // Save settings to JSON file when they change
  const isFirstRender = React.useRef(true);

  useEffect(() => {
    // Skip first render (initial load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Save settings
    const saveSettingsToFile = async () => {
      const dataToSave = {
        settings: state.settings,
        theme: state.theme,
        language: state.language,
        geminiApiKey: state.settings.geminiApiKey
      };

      try {
        if (isElectron && ipcRenderer) {
          // Save to JSON file in Electron
          await ipcRenderer.invoke('save-settings', dataToSave);
        }

        // Also save to localStorage as fallback
        localStorage.setItem('photoPrinterSettings', JSON.stringify(state.settings));
        localStorage.setItem('photoPrinterTheme', state.theme);
        localStorage.setItem('photoPrinterLanguage', state.language);
        if (state.settings.geminiApiKey) {
          localStorage.setItem('geminiApiKey', state.settings.geminiApiKey);
        }
      } catch (e) {
        console.warn("Failed to save settings:", e);
      }
    };

    saveSettingsToFile();

    // Apply theme and language
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (state.language === 'ku' || state.language === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [state.settings, state.theme, state.language]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
