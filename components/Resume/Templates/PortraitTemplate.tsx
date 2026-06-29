import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const PortraitTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#18181b',
    accent: '#a855f7',
    text: '#27272a',
    background: '#ffffff',
    secondary: '#71717a',
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
      {/* Hero header with large centered photo */}
      <div className="p-8 pb-6 text-center" style={{ backgroundColor: colors.primary }}>
        {data.photo && (
          <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4" style={{ border: `4px solid ${colors.accent}`, boxShadow: `0 0 30px ${colors.accent}30` }}>
            <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: ht }}>
          {data.personalInfo.fullName || L.yourName}
        </h1>
        {data.personalInfo.title && (
          <p className="text-base font-medium mb-3" style={{ color: colors.accent }}>{data.personalInfo.title}</p>
        )}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs" style={{ color: `${ht}cc` }}>
          {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={11} style={{ color: colors.accent }} />{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={11} style={{ color: colors.accent }} />{data.personalInfo.phone}</span>}
          {data.personalInfo.address && <span className="flex items-center gap-1"><MapPin size={11} style={{ color: colors.accent }} />{data.personalInfo.address}</span>}
          {data.personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin size={11} style={{ color: colors.accent }} />{data.personalInfo.linkedin}</span>}
          {data.personalInfo.website && <span className="flex items-center gap-1"><Globe size={11} style={{ color: colors.accent }} />{data.personalInfo.website}</span>}
        </div>
      </div>

      {/* Accent line */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${colors.accent}, ${colors.primary})` }} />

      <div className="p-8">
        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-7 text-center max-w-[85%] mx-auto">
            <p className="text-sm leading-relaxed italic" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="w-12 h-px" style={{ backgroundColor: colors.accent }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }} />
              <div className="w-12 h-px" style={{ backgroundColor: colors.accent }} />
            </div>
          </div>
        )}

        {/* Experience */}
        {data.workExperience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-center text-sm font-black uppercase tracking-[0.2em] mb-4 pb-2" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.experience}</h2>
            <div className="space-y-4">
              {data.workExperience.map((exp) => (
                <div key={exp.id} className="flex gap-4">
                  <div className="w-24 flex-shrink-0 text-right pt-0.5">
                    <span className="text-[10px] font-medium" style={{ color: colors.secondary }}>{formatDate(exp.startDate)}<br />– {formatDate(exp.endDate)}</span>
                  </div>
                  <div className="flex-1" style={{ borderInlineStart: `2px solid ${colors.accent}`, paddingInlineStart: '14px' }}>
                    <h3 className="font-bold text-sm" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                    <p className="text-xs font-semibold mb-1" style={{ color: colors.accent }}>{exp.company}{exp.location && ` · ${exp.location}`}</p>
                    {exp.description && <p className="text-xs leading-relaxed" style={{ color: colors.secondary }}>{exp.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-center text-sm font-black uppercase tracking-[0.2em] mb-4 pb-2" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.education}</h2>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex gap-4">
                  <div className="w-24 flex-shrink-0 text-right pt-0.5">
                    <span className="text-[10px] font-medium" style={{ color: colors.secondary }}>{formatDate(edu.startDate)}<br />– {formatDate(edu.endDate)}</span>
                  </div>
                  <div className="flex-1" style={{ borderInlineStart: `2px solid ${colors.accent}`, paddingInlineStart: '14px' }}>
                    <h3 className="font-bold text-sm" style={{ color: colors.text }}>{edu.degree}</h3>
                    <p className="text-xs font-semibold" style={{ color: colors.accent }}>{edu.institution}{edu.location && ` · ${edu.location}`}</p>
                    {(edu.gpa || edu.honors) && <p className="text-xs mt-0.5" style={{ color: colors.secondary }}>{edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors && ' · '}{edu.honors}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills & Languages */}
        <div className="grid grid-cols-2 gap-6">
          {data.skills.length > 0 && (
            <div>
              <h2 className="text-center text-sm font-black uppercase tracking-[0.2em] mb-3 pb-2" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.skills}</h2>
              <div className="flex flex-wrap justify-center gap-1.5">
                {data.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 text-xs font-medium rounded-full" style={{ border: `1px solid ${colors.accent}`, color: colors.primary }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
          {data.languages && data.languages.length > 0 && (
            <div>
              <h2 className="text-center text-sm font-black uppercase tracking-[0.2em] mb-3 pb-2" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.languages}</h2>
              <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={colors} variant="default" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortraitTemplate;
