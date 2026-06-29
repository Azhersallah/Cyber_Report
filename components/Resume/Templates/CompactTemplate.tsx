import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const CompactTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#0f766e',
    accent: '#14b8a6',
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
      {/* Compact colored header bar */}
      <div className="px-7 py-5" style={{ backgroundColor: colors.primary }}>
        <div className="flex items-center gap-5">
          {data.photo && (
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `2px solid ${ht}40` }}>
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1" style={{ color: ht }}>
            <h1 className="text-2xl font-bold mb-0.5">
              {data.personalInfo.fullName || L.yourName}
            </h1>
            {data.personalInfo.title && <p className="text-sm mb-2" style={{ opacity: 0.85 }}>{data.personalInfo.title}</p>}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs" style={{ opacity: 0.75 }}>
              {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={10} />{data.personalInfo.email}</span>}
              {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={10} />{data.personalInfo.phone}</span>}
              {data.personalInfo.address && <span className="flex items-center gap-1"><MapPin size={10} />{data.personalInfo.address}</span>}
              {data.personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin size={10} />{data.personalInfo.linkedin}</span>}
              {data.personalInfo.website && <span className="flex items-center gap-1"><Globe size={10} />{data.personalInfo.website}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-7 py-5">
        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-5 pb-4" style={{ borderBottom: `1px solid ${colors.accent}25` }}>
            <p className="text-xs leading-relaxed" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-5">
          {/* Left: Experience + Education */}
          <div className="col-span-2 space-y-5">
            {data.workExperience.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
                  {L.experience}
                </h2>
                <div className="space-y-3">
                  {data.workExperience.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="text-sm font-bold" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                        <span className="text-xs whitespace-nowrap" style={{ color: colors.secondary }}>{formatDate(exp.startDate)} – {formatDate(exp.endDate)}</span>
                      </div>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.accent }}>{exp.company}{exp.location && ` · ${exp.location}`}</p>
                      {exp.description && <p className="text-xs leading-relaxed" style={{ color: colors.text }}>{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.education.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
                  {L.education}
                </h2>
                <div className="space-y-2">
                  {data.education.map((edu) => (
                    <div key={edu.id}>
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="text-sm font-bold" style={{ color: colors.text }}>{edu.degree}</h3>
                        <span className="text-xs whitespace-nowrap" style={{ color: colors.secondary }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</span>
                      </div>
                      <p className="text-xs font-semibold" style={{ color: colors.accent }}>{edu.institution}</p>
                      {(edu.gpa || edu.honors) && <p className="text-xs mt-0.5" style={{ color: colors.secondary }}>{edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors && ' · '}{edu.honors}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Skills + Languages */}
          <div className="space-y-5">
            {data.skills.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
                  {L.skills}
                </h2>
                <div className="flex flex-wrap gap-1">
                  {data.skills.map((skill, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${colors.accent}15`, color: colors.text }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {data.languages && data.languages.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
                  {L.languages}
                </h2>
                <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={colors} variant="compact" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactTemplate;
