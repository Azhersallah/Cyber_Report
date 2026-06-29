import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe, Code } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';
import { LanguagesSection } from './LanguagesSection';

const TechTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#0891b2',
    accent: '#06b6d4',
    text: '#0f172a',
    background: '#ecfeff',
    secondary: '#64748b',
    headerText: '#ffffff',
    ...customization.colors
  };
  const ht = colors.headerText;

  const formatDate = (date: string) => {
    if (date === 'present') return L.present;
    if (!date) return '';
    const [year, month] = date.split('-');
    return `${month}/${year}`;
  };

  return (
    <div 
      className={cn("w-full min-h-[297mm]", getCvTemplateClass(customization))}
      style={{ '--cv-font-family': getCvFontFamily(customization, isRTL, 'Inter'), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Modern Tech Header */}
      <div className="relative p-8 pb-6 overflow-hidden" style={{ backgroundColor: colors.primary }}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-16 gap-px h-full">
            {Array.from({ length: 160 }).map((_, i) => (
              <div key={i} className="bg-white" />
            ))}
          </div>
        </div>
        
        <div className="relative flex items-center gap-6" style={{ color: ht }}>
          {data.photo && (
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-3 border-white/20 shadow-2xl flex-shrink-0">
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Code size={20} className="opacity-80" />
              <span className="text-xs font-mono opacity-75 tracking-wider">{'<developer>'}</span>
            </div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight">
              {data.personalInfo.fullName || L.yourName}
            </h1>
            {data.personalInfo.title && (
              <p className="text-lg mb-3 opacity-90 font-medium">{data.personalInfo.title}</p>
            )}
            <div className="flex flex-wrap gap-3 text-xs font-mono opacity-90">
              {data.personalInfo.email && <span className="flex items-center gap-2">📧 {data.personalInfo.email}</span>}
              {data.personalInfo.phone && <span className="flex items-center gap-2">📱 {data.personalInfo.phone}</span>}
              {data.personalInfo.linkedin && <span className="flex items-center gap-2">💼 {data.personalInfo.linkedin}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-6 p-4 rounded-xl border-l-4" style={{ 
            backgroundColor: colors.background, 
            borderColor: colors.accent 
          }}>
            <p className="text-sm leading-snug" style={{ color: colors.text }}>
              <span className="font-mono font-bold" style={{ color: colors.accent }}>{'// '}</span>
              {data.personalInfo.summary}
            </p>
          </div>
        )}

        {/* Skills - Prominent */}
        {data.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 font-mono flex items-center gap-2" style={{ color: colors.primary }}>
              <span style={{ color: colors.accent }}>{'const'}</span> 
              <span>skills = [</span>
            </h2>
            <div className="flex flex-wrap gap-2 pl-6">
              {data.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg border-2 transition-all hover:shadow-md"
                  style={{ 
                    backgroundColor: colors.background,
                    borderColor: colors.accent,
                    color: colors.text
                  }}
                >
                  "{skill}"{index < data.skills.length - 1 && ','}
                </span>
              ))}
            </div>
            <p className="font-mono mt-2 text-lg" style={{ color: colors.primary }}>];</p>
          </div>
        )}

        {/* Experience */}
        {data.workExperience.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 font-mono" style={{ color: colors.primary }}>
              <span style={{ color: colors.accent }}>{'function'}</span> getExperience() {'{'}
            </h2>
            <div className="space-y-4 pl-6">
              {data.workExperience.map((exp, idx) => (
                <div key={exp.id} className="border-l-3 pl-4 pb-4 border-b last:border-b-0" style={{ 
                  borderColor: colors.accent,
                  borderLeftWidth: '3px',
                  borderBottomColor: colors.background
                }}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-base font-bold font-mono" style={{ color: colors.text }}>
                      {exp.jobTitle}
                    </h3>
                    <span className="text-xs font-mono whitespace-nowrap ml-4 px-2 py-0.5 rounded-full" style={{ 
                      color: colors.accent,
                      backgroundColor: colors.background
                    }}>
                      {formatDate(exp.startDate)} → {formatDate(exp.endDate)}
                    </span>
                  </div>
                  <p className="text-sm font-mono font-semibold mb-2" style={{ color: colors.accent }}>
                    @ {exp.company}
                  </p>
                  {exp.description && (
                    <p className="text-sm leading-snug" style={{ color: colors.text }}>
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="font-mono mt-4 text-lg" style={{ color: colors.primary }}>{'}'}</p>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 font-mono" style={{ color: colors.primary }}>
              <span style={{ color: colors.accent }}>{'class'}</span> Education {'{'}
            </h2>
            <div className="space-y-3 pl-6">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="text-base font-bold font-mono mb-0.5" style={{ color: colors.text }}>
                    {edu.degree}
                  </h3>
                  <p className="text-sm font-mono font-semibold mb-0.5" style={{ color: colors.accent }}>
                    {edu.institution}
                  </p>
                  <p className="text-xs font-mono" style={{ color: colors.secondary }}>
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </p>
                </div>
              ))}
            </div>
            <p className="font-mono mt-4 text-lg" style={{ color: colors.primary }}>{'}'}</p>
          </div>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 font-mono" style={{ color: colors.primary }}>
              <span style={{ color: colors.accent }}>{'const'}</span> languages = [
            </h2>
            <div className="pl-6">
              <LanguagesSection 
                languages={data.languages}
                isRTL={isRTL}
                language={language}
                colors={colors}
                variant="compact"
              />
            </div>
            <p className="font-mono mt-4 text-lg" style={{ color: colors.primary }}>];</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechTemplate;
