
export type LayoutType = '1' | '2' | '2col' | '3col' | '3row' | '3grid' | '4' | '8' | '9' | 'custom' | '2text' | '2text1' | '1text' | '1text-side' | 'onlytext' | 'businesscard' | 'businesscard-form' | 'businesscard-form-reverse' | 'invoice' | 'invoice-1' | 'invoice-4' | 'idphoto' | 'idphoto-1' | 'idphoto-2' | 'idphoto-4' | string;

export type AppMode = 'photos' | 'businesscard' | 'invoice' | 'idphoto' | 'resume' | 'envelope' | 'qrcode' | 'tasks' | 'stickers' | 'stamp';

// Business Card Builder Types
export interface BusinessCardData {
  type: 'personal' | 'company';
  fullName: string;
  title: string;
  company: string;
  department: string;
  phone1: string;
  phone2: string;
  email: string;
  website: string;
  address: string;
  tagline: string;
  logo: string | null;
  photo: string | null;
  social: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

export interface BusinessCardTemplateProps {
  data: BusinessCardData;
  customization: CustomizationOptions;
  language: Language;
  side?: 'front' | 'back';
}

export type Language = 'en' | 'ku' | 'ar';

export interface Annotation {
  id: string;
  type: 'text' | 'shape' | 'brush' | 'line' | 'blur' | 'image';
  x: number; // Percentage
  y: number; // Percentage
  width: number; // Percentage
  height: number; // Percentage
  rotation?: number; // Degrees
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string; // Text color, Border color, or Stroke color
  shapeType?: 'rectangle' | 'circle' | 'line';
  borderWidth?: number; // Used for stroke width too
  fillColor?: string;
  points?: { x: number, y: number }[]; // For brush (relative % to the annotation box)
  blurAmount?: number; // Pixel amount for blur
  locked?: boolean; // If true, layer cannot be selected or edited
  imageSrc?: string; // For image layer
  opacity?: number; // For image layer opacity (0-100)
}

export interface CropData {
  x: number; // Percentage
  y: number; // Percentage
  width: number; // Percentage
  height: number; // Percentage
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  reminderTime: string | null; // ISO string
  isCompleted: boolean;
  notified: boolean;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color?: string;
  createdAt: string;
}

export interface TasksDataPayload {
  tasks: Task[];
  notes: Note[];
}

export interface Photo {
  id: string;
  src: string;
  name: string;
  rotation: number;
  crop?: CropData;
  annotations: Annotation[];
  description?: string;
  dateText?: string;
}

export interface AppSettings {
  userName: string;
  logo: string | null;
  logoScale: number; // New setting for logo scaling
  badgeColor: string;
  showTitle: boolean;
  showLogo: boolean;
  showPageNumber: boolean;
  startPageNumber: number; // Starting page number
  showDateUser: boolean;
  showFooter: boolean;
  showPhotoBadges: boolean;
  defaultTitleFontSize: number;
  defaultTextFontSize: number;
  defaultFontFamily: string; // Default font for all pages
  footerDate: string; // Custom date for footer (DD/MM/YYYY format)
  // Section Settings
  sectionSize: number; // How many pages form a "section"
  autoUpdateSectionTitle: boolean; // If true, updating a title updates the whole section

  // Page Margin Settings (in mm)
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;

  // Auto Save Settings
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // in minutes

  // Auto Export to Word Settings
  autoExportWord: boolean; // If true, automatically export to Word when saving in Photos mode

  // AI Settings
  geminiApiKey: string;

  // Invoice Specific Settings
  invoiceStartNumber: number;
  invoiceEndNumber: number;
  invoiceLayout: '1-portrait' | '2-landscape' | '4-portrait'; // Invoice layout mode
  invoiceNumberingMode: 'all-same' | 'sequential-split'; // Numbering mode
  invoiceUploadMode: 'single' | 'individual'; // Single template or individual per section
  invoiceNumberStyle: {
    x: number; // %
    y: number; // %
    fontSize: number;
    color: string;
    fontFamily: string;
  };

  // ID Photo Specific Settings
  idPhotoLayout: '1' | '2' | '4'; // 1, 2, or 4 A6 sections per A4 page
  idPhotoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'; // Position for single A6 layout
  idPhotoPosition2: 'top' | 'bottom' | 'left' | 'right'; // Position for 2 A6 layout
  idPhotoSlotCounts: Record<number, number>; // Per-A6 section slot count (1-12), key is section index
  idPhotoType: 'standard' | 'passport'; // standard: 2.7x3.7cm (12/A6), passport: 3.7x4.7cm (6/A6)
  customCols?: number;
  customRows?: number;
}

export interface AppState {
  photos: (Photo | null)[];
  cardPhotos: (Photo | null)[];
  invoicePhotos: (Photo | null)[];
  idPhotos: (Photo | null)[];
  mode: AppMode;
  globalLayout: LayoutType;
  lastPhotosLayout: LayoutType;
  settings: AppSettings;
  theme: 'light' | 'dark';
  language: Language;
  zoom: number;
  globalTitle: string;
  pageTitles: Record<number, string>;
  pageSubtitles: Record<number, string>;
  textAreas: Record<string, string>;
  pageLayouts: Record<number, LayoutType>;
  modePageLayouts?: Record<string, Record<number, LayoutType>>; // Added for preserving layouts per tab
  currentSectionIndex: number;
  manualPageCount: number; // Tracks explicitly added pages
  selectedPageIndex: number | null; // Added for active page layout changes
  // Resume Builder State
  resumeData: ResumeData;
  selectedResumeTemplate: string;
  resumeCustomization: Record<string, CustomizationOptions>;
  resumeLanguage: Language; // Separate language for CV content only
  // Business Card Builder State
  businessCardData: BusinessCardData;
  selectedBusinessCardTemplate: string;
  businessCardCustomization: Record<string, CustomizationOptions>;
  businessCardDesignMode: boolean;
  businessCardLanguage: Language; // Separate language for business card content
  // Selected Card for Custom Size / Layout Editing
  selectedBusinessCardIndex: number | null;
  businessCardSizes: Record<string, { width: number; height: number; hidden?: boolean; x?: number; y?: number }>;
  // QR Code Generator State
  qrCodeData: QRCodeData;
  // Stamp Creator State
  stampData: StampData;
}

// Resume Builder Types
export interface PersonalInfo {
  fullName: string;
  title: string; // Professional title/headline
  phone: string;
  email: string;
  address: string;
  linkedin?: string;
  website?: string;
  summary?: string; // Professional summary/objective
}

export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string; // Format: "YYYY-MM"
  endDate: string | 'present';
  description: string;
  highlights?: string[]; // Bullet points
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string | 'present';
  gpa?: string;
  honors?: string;
  description?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
}

export interface LanguageSkill {
  id: string;
  language: string;
  proficiency: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  languages: LanguageSkill[];
  photo: string | null; // Base64 encoded image
  customSections?: CustomSection[];
}

export interface ColorScheme {
  primary: string;
  accent: string;
  text: string;
  background: string;
  secondary: string;
  headerText: string;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  thumbnail: string; // Preview image
  component: React.ComponentType<TemplateProps>;
  defaultColors: ColorScheme;
  supportedCustomizations: string[]; // e.g., ['colors', 'fonts']
}

export interface TemplateProps {
  data: ResumeData;
  customization: CustomizationOptions;
  language: Language;
}

export interface CustomizationOptions {
  colors?: Partial<ColorScheme>;
  fontSize?: 'small' | 'medium' | 'large';
  fontFamily?: string;
  spacing?: 'compact' | 'normal' | 'relaxed';
  logoSize?: number; // Logo size scale (0.5 to 2.0)
  logoSizeFront?: number; // Front side logo size
  logoSizeBack?: number; // Back side logo size
}

// QR Code Generator Types
export interface QRCodeData {
  type: 'text' | 'url' | 'email' | 'phone' | 'sms' | 'wifi' | 'location';
  content: string;
  // WiFi specific
  wifiSSID: string;
  wifiPassword: string;
  wifiSecurity: 'WPA' | 'WEP' | 'nopass';
  wifiHidden: boolean;
  // Location specific
  latitude: string;
  longitude: string;
  // Customization
  size: number;
  fgColor: string;
  bgColor: string;
  includeMargin: boolean;
  errorLevel: 'L' | 'M' | 'Q' | 'H';
  logoImage: string | null;
  logoSize: number;
}

// Stamp Creator Types
export interface StampLayer {
  id: string;
  type: 'text' | 'logo';
  text?: string;
  textType?: 'curve-up' | 'straight' | 'curve-down';
  fontFamily?: string;
  fontSize?: number;
  radiusOffset?: number; // Curvature intensity
  letterSpacing?: number;
  offsetX: number;
  offsetY: number;
}

export interface StampData {
  shape: 'circle' | 'oval' | 'rectangle' | 'square';
  width: number;
  height: number;
  outerText: string;
  innerText: string;
  centerText: string;
  fontFamily: string; // Keep as fallback/legacy
  outerFontFamily: string;
  innerFontFamily: string;
  centerFontFamily: string;
  fontSize: number;
  outerFontSize: number;
  innerFontSize: number;
  centerFontSize: number;
  outerRadiusOffset: number;
  innerRadiusOffset: number;
  letterSpacing: number;
  textColor: string;
  borderWidth: number;
  hasInnerRing: boolean;
  hasDottedRing: boolean;
  hasStars: boolean;
  starCount: number;
  distressEffect: number;
  monochrome: boolean;
  centerImage: string | null;
  centerImageSize: number;
  centerLayout: 'text-bottom' | 'text-top' | 'text-left' | 'text-right' | 'overlay';
  centerImageOffsetX: number;
  centerImageOffsetY: number;
  centerTextOffsetX: number;
  centerTextOffsetY: number;
  outerTextOffsetX: number;
  outerTextOffsetY: number;
  innerTextOffsetX: number;
  innerTextOffsetY: number;
  extraCenterText: string;
  extraCenterFontFamily: string;
  extraCenterFontSize: number;
  extraCenterTextOffsetX: number;
  extraCenterTextOffsetY: number;
  signatureThreshold: number;
  layers?: StampLayer[];
  selectedLayerId?: string | null;
  activeSavedDesignId?: string | null;
}


export const INITIAL_SETTINGS: AppSettings = {
  userName: 'User Name',
  logo: null,
  logoScale: 1.0, // Default scale 100%
  badgeColor: '#3b82f6',
  showTitle: true,
  showLogo: false,
  showPageNumber: true,
  startPageNumber: 1, // Default start from page 1
  showDateUser: true,
  showFooter: true,
  showPhotoBadges: true,
  defaultTitleFontSize: 22,
  defaultTextFontSize: 20,
  defaultFontFamily: 'Noto Naskh Arabic', // Default font
  footerDate: (() => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  })(), // Initialize with today's date
  sectionSize: 10,
  autoUpdateSectionTitle: false,

  // Page Margin Defaults (in mm) - Additional margin on top of base margins
  marginTop: 0, // Total = 4 + this value
  marginRight: 0, // Total = 3 + this value
  marginBottom: 0, // Total = 3 + this value
  marginLeft: 0, // Total = 3 + this value

  // Auto Save Settings
  autoSaveEnabled: false,
  autoSaveInterval: 5, // 5 minutes default

  // Auto Export to Word Settings
  autoExportWord: true, // Default enabled - automatically export to Word when saving in Photos mode

  // AI Settings
  geminiApiKey: '',

  // Invoice Defaults
  invoiceStartNumber: 1,
  invoiceEndNumber: 100,
  invoiceLayout: '2-landscape',
  invoiceNumberingMode: 'sequential-split',
  invoiceUploadMode: 'single',
  invoiceNumberStyle: {
    x: 85,
    y: 5,
    fontSize: 24,
    color: '#ef4444',
    fontFamily: 'Arial'
  },

  // ID Photo Defaults
  idPhotoLayout: '4', // Default to 4 A6 sections per A4 page
  idPhotoPosition: 'center', // Default position for single A6
  idPhotoPosition2: 'top', // Default position for 2 A6
  idPhotoSlotCounts: {}, // Per-A6 section slot counts (default 12 for all)
  idPhotoType: 'standard', // Default to standard 2.7x3.7cm ID photo
  customCols: 2,
  customRows: 3
};
