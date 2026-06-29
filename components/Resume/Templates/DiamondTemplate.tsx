import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const DiamondTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#1e3a5f',
    accent: '#d4af37',
    text: '#2d3748',
    background: '#ffffff',
    secondary: '#718096',
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
      style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header with diamond accent */}
      <div className="relative p-8 pb-10" style={{ backgroundColor: colors.primary }}>
        <div className="flex items-center gap-6" style={{ color: ht }}>
          {data.photo && (
            <div className="w-24 h-24 overflow-hidden flex-shrink-0" style={{ transform: 'rotate(45deg)', border: `3px solid ${colors.accent}` }}>
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" style={{ transform: 'rotate(-45deg) scale(1.42)' }} />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              {data.personalInfo.fullName || L.yourName}
            </h1>
            {data.personalInfo.title && (
              <p className="text-base font-medium" style={{ color: colors.accent }}>{data.personalInfo.title}</p>
            )}
          </div>
        </div>
        {/* Diamond divider */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-5 h-5" style={{ backgroundColor: colors.accent, transform: 'translateX(-50%) translateY(50%) rotate(45deg)' }} />
      </div>

      {/* Contact bar */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 px-8 pt-6 pb-3 text-xs" style={{ color: colors.secondary }}>
        {data.personalInfo.email && <span className="flex items-center gap-1.5"><Mail size={11} style={{ color: colors.accent }} />{data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span className="flex items-center gap-1.5"><Phone size={11} style={{ color: colors.accent }} />{data.personalInfo.phone}</span>}
        {data.personalInfo.address && <span className="flex items-center gap-1.5"><MapPin size={11} style={{ color: colors.accent }} />{data.personalInfo.address}</span>}
        {data.personalInfo.linkedin && <span className="flex items-center gap-1.5"><Linkedin size={11} style={{ color: colors.accent }} />{data.personalInfo.linkedin}</span>}
        {data.personalInfo.website && <span className="flex items-center gap-1.5"><Globe size={11} style={{ color: colors.accent }} />{data.personalInfo.website}</span>}
      </div>

      <div className="px-8 pb-8">
        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-6 text-center">
            <p className="text-sm leading-relaxed italic" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="h-px flex-1" style={{ backgroundColor: `${colors.accent}40` }} />
              <div className="w-2 h-2" style={{ backgroundColor: colors.accent, transform: 'rotate(45deg)' }} />
              <div className="h-px flex-1" style={{ backgroundColor: `${colors.accent}40` }} />
            </div>
          </div>
        )}

        {/* Experience */}
        {data.workExperience.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3" style={{ backgroundColor: colors.accent, transform: 'rotate(45deg)' }} />
              <h2 className="text-base font-bold uppercase tracking-wider" style={{ color: colors.primary }}>{L.experience}</h2>
              <div className="flex-1 h-px" style={{ backgroundColor: `${colors.accent}30` }} />
            </div>
            <div className="space-y-4">
              {data.workExperience.map((exp) => (
                <div key={exp.id} style={{ paddingInlineStart: '16px', borderInlineStart: `2px solid ${colors.accent}` }}>
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-sm" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                    <span className="text-xs whitespace-nowrap" style={{ color: colors.secondary }}>{formatDate(exp.startDate)} – {formatDate(exp.endDate)}</span>
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{ color: colors.accent }}>{exp.company}{exp.location && ` · ${exp.location}`}</p>
                  {exp.description && <p className="text-xs leading-relaxed" style={{ color: colors.secondary }}>{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3" style={{ backgroundColor: colors.accent, transform: 'rotate(45deg)' }} />
              <h2 className="text-base font-bold uppercase tracking-wider" style={{ color: colors.primary }}>{L.education}</h2>
              <div className="flex-1 h-px" style={{ backgroundColor: `${colors.accent}30` }} />
            </div>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} style={{ paddingInlineStart: '16px', borderInlineStart: `2px solid ${colors.accent}` }}>
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-sm" style={{ color: colors.text }}>{edu.degree}</h3>
                    <span className="text-xs whitespace-nowrap" style={{ color: colors.secondary }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</span>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: colors.accent }}>{edu.institution}{edu.location && ` · ${edu.location}`}</p>
                  {(edu.gpa || edu.honors) && <p className="text-xs mt-0.5" style={{ color: colors.secondary }}>{edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors && ' · '}{edu.honors}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills & Languages grid */}
        <div className="grid grid-cols-2 gap-6">
          {data.skills.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3" style={{ backgroundColor: colors.accent, transform: 'rotate(45deg)' }} />
                <h2 className="text-base font-bold uppercase tracking-wider" style={{ color: colors.primary }}>{L.skills}</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 text-xs font-medium" style={{ border: `1px solid ${colors.accent}`, color: colors.primary }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
          {data.languages && data.languages.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3" style={{ backgroundColor: colors.accent, transform: 'rotate(45deg)' }} />
                <h2 className="text-base font-bold uppercase tracking-wider" style={{ color: colors.primary }}>{L.languages}</h2>
              </div>
              <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={colors} variant="default" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiamondTemplate;
