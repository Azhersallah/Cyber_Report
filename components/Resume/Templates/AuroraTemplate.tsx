import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const AuroraTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#6d28d9',
    accent: '#38bdf8',
    text: '#1e293b',
    background: '#fefefe',
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
      {/* Aurora gradient header */}
      <div
        className="p-8 pb-7"
        style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent}cc 50%, ${colors.primary}bb 100%)` }}
      >
        <div className="flex items-center gap-6" style={{ color: ht }}>
          {data.photo && (
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0" style={{ boxShadow: `0 0 20px ${colors.accent}60`, border: `3px solid ${ht}40` }}>
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold mb-1 tracking-tight">{data.personalInfo.fullName || L.yourName}</h1>
            {data.personalInfo.title && (
              <p className="text-base font-light tracking-wide opacity-90 mb-3">{data.personalInfo.title}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-85">
              {data.personalInfo.email && <span className="flex items-center gap-1.5"><Mail size={11} />{data.personalInfo.email}</span>}
              {data.personalInfo.phone && <span className="flex items-center gap-1.5"><Phone size={11} />{data.personalInfo.phone}</span>}
              {data.personalInfo.address && <span className="flex items-center gap-1.5"><MapPin size={11} />{data.personalInfo.address}</span>}
              {data.personalInfo.linkedin && <span className="flex items-center gap-1.5"><Linkedin size={11} />{data.personalInfo.linkedin}</span>}
              {data.personalInfo.website && <span className="flex items-center gap-1.5"><Globe size={11} />{data.personalInfo.website}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Soft glow divider */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${colors.primary}40, ${colors.accent}60, ${colors.primary}40)` }} />

      <div className="p-8">
        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-7 p-4 rounded-2xl" style={{ background: `linear-gradient(135deg, ${colors.primary}06, ${colors.accent}08)` }}>
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
          </div>
        )}

        {/* Two column layout */}
        <div className="grid grid-cols-[1fr_260px] gap-7">
          {/* Left - Experience & Education */}
          <div className="space-y-6">
            {data.workExperience.length > 0 && (
              <div>
                <h2 className="text-base font-bold mb-4 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}40` }}>{L.experience}</h2>
                <div className="space-y-5">
                  {data.workExperience.map((exp) => (
                    <div key={exp.id} className="relative" style={{ paddingInlineStart: '18px' }}>
                      <div className="absolute top-1.5" style={{ insetInlineStart: 0, width: '8px', height: '8px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }} />
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

            {data.education.length > 0 && (
              <div>
                <h2 className="text-base font-bold mb-4 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}40` }}>{L.education}</h2>
                <div className="space-y-4">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="relative" style={{ paddingInlineStart: '18px' }}>
                      <div className="absolute top-1.5" style={{ insetInlineStart: 0, width: '8px', height: '8px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }} />
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
          </div>

          {/* Right - Skills & Languages */}
          <div className="space-y-5">
            {data.skills.length > 0 && (
              <div className="p-5 rounded-2xl" style={{ background: `linear-gradient(180deg, ${colors.primary}08, ${colors.accent}08)` }}>
                <h2 className="text-sm font-bold mb-3" style={{ color: colors.primary }}>{L.skills}</h2>
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.map((skill, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-full" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`, color: ht }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {data.languages && data.languages.length > 0 && (
              <div className="p-5 rounded-2xl" style={{ background: `linear-gradient(180deg, ${colors.accent}08, ${colors.primary}08)` }}>
                <h2 className="text-sm font-bold mb-3" style={{ color: colors.primary }}>{L.languages}</h2>
                <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={colors} variant="compact" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuroraTemplate;
