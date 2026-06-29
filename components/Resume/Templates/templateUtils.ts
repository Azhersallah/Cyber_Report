import { CustomizationOptions, Language } from '../../../types';

export function getCvTemplateClass(customization: CustomizationOptions): string {
  const spacing = customization.spacing || 'normal';
  const classes = ['cv-template'];
  if (spacing === 'compact') classes.push('cv-spacing-compact');
  if (spacing === 'relaxed') classes.push('cv-spacing-relaxed');
  return classes.join(' ');
}

export function getCvFontSize(customization: CustomizationOptions): string {
  const fontSize = customization.fontSize || 'medium';
  return { small: '13px', medium: '15px', large: '17px' }[fontSize];
}

export function getCvFontFamily(customization: CustomizationOptions, isRTL: boolean, defaultFont?: string): string {
  const font = customization.fontFamily || (defaultFont || 'Noto Kufi Arabic');
  return `"${font}", sans-serif`;
}

const CV_LABELS = {
  present: { en: 'Present', ku: 'ئێستا', ar: 'الحالي' },
  yourName: { en: 'Your Name', ku: 'ناوی تەواو', ar: 'اسمك' },
  summary: { en: 'Professional Summary', ku: 'کورتە', ar: 'الملخص المهني' },
  aboutMe: { en: 'About Me', ku: 'کورتە', ar: 'نبذة عني' },
  experience: { en: 'Experience', ku: 'ئەزموونی کار', ar: 'الخبرة المهنية' },
  workExperience: { en: 'Work Experience', ku: 'ئەزموونی کار', ar: 'الخبرة المهنية' },
  education: { en: 'Education', ku: 'خوێندن', ar: 'التعليم' },
  skills: { en: 'Skills', ku: 'لێهاتوویی', ar: 'المهارات' },
  languages: { en: 'Languages', ku: 'زمانەکان', ar: 'اللغات' },
  contact: { en: 'Contact', ku: 'پەیوەندی', ar: 'التواصل' },
  links: { en: 'Links', ku: 'بەستەرەکان', ar: 'الروابط' },
  profile: { en: 'Profile', ku: 'پرۆفایل', ar: 'الملف الشخصي' },
  projects: { en: 'Projects', ku: 'پرۆژەکان', ar: 'المشاريع' },
  certifications: { en: 'Certifications', ku: 'بڕوانامەکان', ar: 'الشهادات' },
  references: { en: 'References', ku: 'سەرچاوەکان', ar: 'المراجع' },
  native: { en: 'Native', ku: 'زمانی دایک', ar: 'اللغة الأم' },
  fluent: { en: 'Fluent', ku: 'بەڕوانی', ar: 'طلاقة' },
  advanced: { en: 'Advanced', ku: 'پێشکەوتوو', ar: 'متقدم' },
  intermediate: { en: 'Intermediate', ku: 'ناوەند', ar: 'متوسط' },
  basic: { en: 'Basic', ku: 'سەرەتایی', ar: 'مبتدئ' },
} as const;

type LabelKey = keyof typeof CV_LABELS;

export function getCvLabels(language: Language) {
  const lang = language === 'ku' ? 'ku' : language === 'ar' ? 'ar' : 'en';
  const result: Record<LabelKey, string> = {} as any;
  for (const key in CV_LABELS) {
    result[key as LabelKey] = CV_LABELS[key as LabelKey][lang];
  }
  return result;
}
