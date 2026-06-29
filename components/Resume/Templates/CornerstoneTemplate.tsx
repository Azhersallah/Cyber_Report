import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const CornerstoneTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#334155',
    accent: '#f59e0b',
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
      className={cn("w-full min-h-[297mm] relative", getCvTemplateClass(customization))}
      style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top-left corner accent */}
      <div className="absolute top-0" style={{ insetInlineStart: 0, width: '120px', height: '6px', backgroundColor: colors.accent }} />
      <div className="absolute top-0" style={{ insetInlineStart: 0, width: '6px', height: '120px', backgroundColor: colors.accent }} />

      {/* Bottom-right corner accent */}
      <div className="absolute bottom-0" style={{ insetInlineEnd: 0, width: '120px', height: '6px', backgroundColor: colors.accent }} />
      <div className="absolute bottom-0" style={{ insetInlineEnd: 0, width: '6px', height: '120px', backgroundColor: colors.accent }} />

      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-6 mb-6 pb-5" style={{ borderBottom: `2px solid ${colors.primary}` }}>
          {data.photo && (
            <div className="w-24 h-24 overflow-hidden flex-shrink-0" style={{ border: `3px solid ${colors.accent}` }}>
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: colors.primary }}>
              {data.personalInfo.fullName || L.yourName}
            </h1>
            {data.personalInfo.title && (
              <p className="text-base font-semibold mb-2" style={{ color: colors.accent }}>{data.personalInfo.title}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: colors.secondary }}>
              {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={11} style={{ color: colors.accent }} />{data.personalInfo.email}</span>}
              {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={11} style={{ color: colors.accent }} />{data.personalInfo.phone}</span>}
              {data.personalInfo.address && <span className="flex items-center gap-1"><MapPin size={11} style={{ color: colors.accent }} />{data.personalInfo.address}</span>}
              {data.personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin size={11} style={{ color: colors.accent }} />{data.personalInfo.linkedin}</span>}
              {data.personalInfo.website && <span className="flex items-center gap-1"><Globe size={11} style={{ color: colors.accent }} />{data.personalInfo.website}</span>}
            </div>
          </div>
        </div>

        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-6 p-4" style={{ borderInlineStart: `4px solid ${colors.accent}`, backgroundColor: `${colors.primary}05` }}>
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
          </div>
        )}

        {/* Two column layout */}
        <div className="grid grid-cols-[1fr_270px] gap-7">
          {/* Left */}
          <div className="space-y-6">
            {/* Experience */}
            {data.workExperience.length > 0 && (
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider mb-4 pb-1.5 flex items-center gap-2" style={{ color: colors.primary }}>
                  <div className="w-3 h-3" style={{ backgroundColor: colors.accent }} />
                  {L.experience}
                  <div className="flex-1 h-px" style={{ backgroundColor: `${colors.primary}20` }} />
                </h2>
                <div className="space-y-4">
                  {data.workExperience.map((exp) => (
                    <div key={exp.id} className="p-3" style={{ borderInlineStart: `3px solid ${colors.accent}`, borderBottom: `1px solid ${colors.primary}10` }}>
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
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider mb-4 pb-1.5 flex items-center gap-2" style={{ color: colors.primary }}>
                  <div className="w-3 h-3" style={{ backgroundColor: colors.accent }} />
                  {L.education}
                  <div className="flex-1 h-px" style={{ backgroundColor: `${colors.primary}20` }} />
                </h2>
                <div className="space-y-3">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="p-3" style={{ borderInlineStart: `3px solid ${colors.accent}`, borderBottom: `1px solid ${colors.primary}10` }}>
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

          {/* Right */}
          <div className="space-y-5">
            {data.skills.length > 0 && (
              <div className="p-4" style={{ border: `2px solid ${colors.primary}15`, borderTop: `3px solid ${colors.accent}` }}>
                <h2 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: colors.primary }}>{L.skills}</h2>
                <div className="space-y-1.5">
                  {data.skills.map((skill, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5" style={{ backgroundColor: colors.accent }} />
                      <span style={{ color: colors.text }}>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.languages && data.languages.length > 0 && (
              <div className="p-4" style={{ border: `2px solid ${colors.primary}15`, borderTop: `3px solid ${colors.accent}` }}>
                <h2 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: colors.primary }}>{L.languages}</h2>
                <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={colors} variant="compact" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CornerstoneTemplate;
