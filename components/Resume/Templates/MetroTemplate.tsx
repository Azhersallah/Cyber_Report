import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const MetroTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#0078d4',
    accent: '#00bcf2',
    text: '#1a1a1a',
    background: '#ffffff',
    secondary: '#605e5c',
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
      {/* Metro Header - Bold flat tile */}
      <div className="p-8" style={{ backgroundColor: colors.primary }}>
        <div className="flex items-center gap-6" style={{ color: ht }}>
          {data.photo && (
            <div className="w-24 h-24 overflow-hidden flex-shrink-0" style={{ border: `3px solid ${ht}` }}>
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-black uppercase tracking-tight mb-1">
              {data.personalInfo.fullName || L.yourName}
            </h1>
            {data.personalInfo.title && (
              <p className="text-lg font-light tracking-wide opacity-90">{data.personalInfo.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact tiles row */}
      <div className="flex flex-wrap" style={{ backgroundColor: colors.accent }}>
        {data.personalInfo.email && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs" style={{ color: ht }}>
            <Mail size={12} /><span>{data.personalInfo.email}</span>
          </div>
        )}
        {data.personalInfo.phone && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs" style={{ color: ht }}>
            <Phone size={12} /><span>{data.personalInfo.phone}</span>
          </div>
        )}
        {data.personalInfo.address && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs" style={{ color: ht }}>
            <MapPin size={12} /><span>{data.personalInfo.address}</span>
          </div>
        )}
        {data.personalInfo.linkedin && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs" style={{ color: ht }}>
            <Linkedin size={12} /><span>{data.personalInfo.linkedin}</span>
          </div>
        )}
        {data.personalInfo.website && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs" style={{ color: ht }}>
            <Globe size={12} /><span>{data.personalInfo.website}</span>
          </div>
        )}
      </div>

      <div className="p-8">
        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-6 p-4" style={{ backgroundColor: `${colors.primary}08`, borderInlineStart: `4px solid ${colors.primary}` }}>
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
          </div>
        )}

        {/* Metro tile grid layout */}
        <div className="grid grid-cols-[1fr_280px] gap-6">
          {/* Left - Experience & Education */}
          <div className="space-y-6">
            {/* Experience */}
            {data.workExperience.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                    <span className="text-xs font-black" style={{ color: ht }}>W</span>
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-wide" style={{ color: colors.primary }}>{L.experience}</h2>
                </div>
                <div className="space-y-4">
                  {data.workExperience.map((exp) => (
                    <div key={exp.id} className="p-3" style={{ backgroundColor: `${colors.primary}06`, borderBottom: `2px solid ${colors.accent}` }}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-sm" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                        <span className="text-xs whitespace-nowrap px-2 py-0.5 font-medium" style={{ backgroundColor: colors.primary, color: ht }}>{formatDate(exp.startDate)} - {formatDate(exp.endDate)}</span>
                      </div>
                      <p className="text-xs font-semibold mb-1.5" style={{ color: colors.accent }}>{exp.company}{exp.location && ` • ${exp.location}`}</p>
                      {exp.description && <p className="text-xs leading-relaxed" style={{ color: colors.secondary }}>{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {data.education.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
                    <span className="text-xs font-black" style={{ color: ht }}>E</span>
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-wide" style={{ color: colors.primary }}>{L.education}</h2>
                </div>
                <div className="space-y-3">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="p-3" style={{ backgroundColor: `${colors.accent}08`, borderBottom: `2px solid ${colors.primary}` }}>
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className="font-bold text-sm" style={{ color: colors.text }}>{edu.degree}</h3>
                        <span className="text-xs whitespace-nowrap" style={{ color: colors.secondary }}>{formatDate(edu.startDate)} - {formatDate(edu.endDate)}</span>
                      </div>
                      <p className="text-xs font-semibold" style={{ color: colors.accent }}>{edu.institution}{edu.location && ` • ${edu.location}`}</p>
                      {(edu.gpa || edu.honors) && <p className="text-xs mt-0.5" style={{ color: colors.secondary }}>{edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors && ' • '}{edu.honors}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Skills & Languages */}
          <div className="space-y-4">
            {data.skills.length > 0 && (
              <div className="p-4" style={{ backgroundColor: `${colors.primary}0a` }}>
                <h2 className="text-sm font-black uppercase tracking-wide mb-3" style={{ color: colors.primary }}>{L.skills}</h2>
                <div className="space-y-1.5">
                  {data.skills.map((skill, i) => (
                    <div key={i} className="px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: colors.primary, color: ht }}>
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.languages && data.languages.length > 0 && (
              <div className="p-4" style={{ backgroundColor: `${colors.accent}0a` }}>
                <h2 className="text-sm font-black uppercase tracking-wide mb-3" style={{ color: colors.primary }}>{L.languages}</h2>
                <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={colors} variant="compact" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetroTemplate;
