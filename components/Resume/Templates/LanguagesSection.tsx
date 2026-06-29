import React from 'react';
import { LanguageSkill, Language } from '../../../types';
import { getCvLabels } from './templateUtils';

interface LanguagesSectionProps {
  languages: LanguageSkill[];
  isRTL: boolean;
  language?: Language;
  colors: Partial<{
    primary: string;
    accent: string;
    text: string;
    background: string;
    secondary: string;
  }>;
  variant?: 'default' | 'compact' | 'inline' | 'badges';
}

export const getProficiencyLabel = (proficiency: string, isRTL: boolean, language?: Language): string => {
  if (language) {
    const L = getCvLabels(language);
    switch (proficiency) {
      case 'native': return L.native;
      case 'fluent': return L.fluent;
      case 'advanced': return L.advanced;
      case 'intermediate': return L.intermediate;
      case 'basic': return L.basic;
      default: return proficiency;
    }
  }
  switch (proficiency) {
    case 'native':
      return isRTL ? 'زمانی دایک' : 'Native';
    case 'fluent':
      return isRTL ? 'بەڕوانی' : 'Fluent';
    case 'advanced':
      return isRTL ? 'پێشکەوتوو' : 'Advanced';
    case 'intermediate':
      return isRTL ? 'ناوەند' : 'Intermediate';
    case 'basic':
      return isRTL ? 'سەرەتایی' : 'Basic';
    default:
      return proficiency;
  }
};

export const LanguagesSection: React.FC<LanguagesSectionProps> = ({ 
  languages, 
  isRTL, 
  language,
  colors,
  variant = 'default'
}) => {
  if (!languages || languages.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className="space-y-1.5 w-full">
        {languages.map((lang, index) => (
          <div key={index} className="flex justify-center items-center gap-2 text-sm">
            <span style={{ color: colors.text }}>{lang.language}</span>
            <span className="text-xs" style={{ color: colors.secondary }}>
              {getProficiencyLabel(lang.proficiency, isRTL, language)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-2">
        {languages.map((lang, index) => (
          <span
            key={index}
            className="text-sm"
            style={{ color: colors.text }}
          >
            {lang.language} ({getProficiencyLabel(lang.proficiency, isRTL, language)})
          </span>
        ))}
      </div>
    );
  }

  if (variant === 'badges') {
    return (
      <div className="flex flex-wrap gap-2">
        {languages.map((lang, index) => (
          <span
            key={index}
            className="px-3 py-1 text-sm rounded-full"
            style={{ 
              backgroundColor: `${colors.accent}20`,
              color: colors.primary
            }}
          >
            {lang.language}
          </span>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className="space-y-2">
      {languages.map((lang, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="font-medium" style={{ color: colors.text }}>
            {lang.language}
          </span>
          <span className="text-sm px-2 py-0.5 rounded" style={{ 
            backgroundColor: `${colors.accent}20`,
            color: colors.primary
          }}>
            {getProficiencyLabel(lang.proficiency, isRTL, language)}
          </span>
        </div>
      ))}
    </div>
  );
};
