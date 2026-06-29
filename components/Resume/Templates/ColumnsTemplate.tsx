import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const ColumnsTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#1e40af',
    accent: '#60a5fa',
    text: '#1e293b',
    background: '#ffffff',
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
      style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Clean header */}
      <div className="px-7 pt-7 pb-5" style={{ borderBottom: `3px solid ${colors.primary}` }}>
        <div className="flex items-center gap-5">
          {data.photo && (
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0" style={{ border: `2px solid ${colors.primary}` }}>
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight mb-0.5" style={{ color: colors.primary }}>
              {data.personalInfo.fullName || L.yourName}
            </h1>
            {data.personalInfo.title && (
              <p className="text-sm font-medium" style={{ color: colors.accent }}>{data.personalInfo.title}</p>
            )}
          </div>
        </div>
        {/* Contact row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs" style={{ color: colors.secondary }}>
          {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={10} style={{ color: colors.accent }} />{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={10} style={{ color: colors.accent }} />{data.personalInfo.phone}</span>}
          {data.personalInfo.address && <span className="flex items-center gap-1"><MapPin size={10} style={{ color: colors.accent }} />{data.personalInfo.address}</span>}
          {data.personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin size={10} style={{ color: colors.accent }} />{data.personalInfo.linkedin}</span>}
          {data.personalInfo.website && <span className="flex items-center gap-1"><Globe size={10} style={{ color: colors.accent }} />{data.personalInfo.website}</span>}
        </div>
      </div>

      {/* Summary - full width */}
      {data.personalInfo.summary && (
        <div className="px-7 py-4" style={{ backgroundColor: `${colors.primary}05` }}>
          <p className="text-sm leading-relaxed" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
        </div>
      )}

      {/* Three column layout */}
      <div className="grid grid-cols-3 gap-px px-0" style={{ backgroundColor: `${colors.primary}12` }}>
        {/* Column 1 - Experience */}
        <div className="p-5 space-y-4" style={{ backgroundColor: colors.background }}>
          {data.workExperience.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.experience}</h2>
              <div className="space-y-3">
                {data.workExperience.map((exp) => (
                  <div key={exp.id}>
                    <h3 className="font-bold text-xs leading-tight" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                    <p className="text-[10px] font-semibold" style={{ color: colors.accent }}>{exp.company}</p>
                    {exp.location && <p className="text-[10px]" style={{ color: colors.secondary }}>{exp.location}</p>}
                    <p className="text-[10px] mb-1" style={{ color: colors.secondary }}>{formatDate(exp.startDate)} – {formatDate(exp.endDate)}</p>
                    {exp.description && <p className="text-[10px] leading-relaxed" style={{ color: colors.secondary }}>{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 2 - Education */}
        <div className="p-5 space-y-4" style={{ backgroundColor: colors.background }}>
          {data.education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.education}</h2>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id}>
                    <h3 className="font-bold text-xs leading-tight" style={{ color: colors.text }}>{edu.degree}</h3>
                    <p className="text-[10px] font-semibold" style={{ color: colors.accent }}>{edu.institution}</p>
                    {edu.location && <p className="text-[10px]" style={{ color: colors.secondary }}>{edu.location}</p>}
                    <p className="text-[10px]" style={{ color: colors.secondary }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</p>
                    {(edu.gpa || edu.honors) && <p className="text-[10px]" style={{ color: colors.secondary }}>{edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors && ' · '}{edu.honors}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 3 - Skills & Languages */}
        <div className="p-5 space-y-4" style={{ backgroundColor: colors.background }}>
          {data.skills.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.skills}</h2>
              <div className="space-y-1">
                {data.skills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.accent }} />
                    <span style={{ color: colors.text }}>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.languages && data.languages.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.languages}</h2>
              <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={colors} variant="compact" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColumnsTemplate;
