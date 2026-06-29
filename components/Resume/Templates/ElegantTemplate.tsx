import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const ElegantTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#1e293b',
    accent: '#475569',
    text: '#334155',
    background: '#ffffff',
    secondary: '#94a3b8',
    headerText: '#ffffff',
    ...customization.colors
  };

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
      {/* Elegant Header */}
      <div className="px-10 pt-8 pb-6 mb-1" style={{ borderBottom: `3px solid ${colors.primary}` }}>
        <div className="flex items-center gap-6">
          {data.photo && (
            <div className="w-28 h-28 rounded-full overflow-hidden flex-shrink-0" style={{ border: `3px solid ${colors.accent}`, boxShadow: `0 0 0 6px ${colors.accent}15` }}>
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1" style={{ color: colors.primary, letterSpacing: '0.02em' }}>
              {data.personalInfo.fullName || L.yourName}
            </h1>
            {data.personalInfo.title && (
              <p className="text-base mb-3 italic" style={{ color: colors.accent }}>{data.personalInfo.title}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: colors.secondary }}>
              {data.personalInfo.email && <span className="flex items-center gap-1.5"><Mail size={12} />{data.personalInfo.email}</span>}
              {data.personalInfo.phone && <span className="flex items-center gap-1.5"><Phone size={12} />{data.personalInfo.phone}</span>}
              {data.personalInfo.address && <span className="flex items-center gap-1.5"><MapPin size={12} />{data.personalInfo.address}</span>}
              {data.personalInfo.linkedin && <span className="flex items-center gap-1.5"><Linkedin size={12} />{data.personalInfo.linkedin}</span>}
              {data.personalInfo.website && <span className="flex items-center gap-1.5"><Globe size={12} />{data.personalInfo.website}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="px-10 py-6 space-y-5">
        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="pb-5" style={{ borderBottom: `1px solid ${colors.accent}25` }}>
            <p className="text-sm leading-relaxed italic" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
          </div>
        )}

        {/* Experience */}
        {data.workExperience.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-3" style={{ color: colors.primary }}>
              <span className="flex-1 h-px" style={{ backgroundColor: colors.accent + '30' }} />
              {L.experience}
              <span className="flex-1 h-px" style={{ backgroundColor: colors.accent + '30' }} />
            </h2>
            <div className="space-y-4">
              {data.workExperience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-sm font-bold" style={{ color: colors.primary }}>{exp.jobTitle}</h3>
                    <span className="text-xs italic" style={{ color: colors.secondary }}>{formatDate(exp.startDate)} – {formatDate(exp.endDate)}</span>
                  </div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: colors.accent }}>{exp.company}{exp.location && ` · ${exp.location}`}</p>
                  {exp.description && <p className="text-xs leading-relaxed" style={{ color: colors.text }}>{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-3" style={{ color: colors.primary }}>
              <span className="flex-1 h-px" style={{ backgroundColor: colors.accent + '30' }} />
              {L.education}
              <span className="flex-1 h-px" style={{ backgroundColor: colors.accent + '30' }} />
            </h2>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-sm font-bold" style={{ color: colors.primary }}>{edu.degree}</h3>
                    <span className="text-xs italic" style={{ color: colors.secondary }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</span>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: colors.accent }}>{edu.institution}{edu.location && ` · ${edu.location}`}</p>
                  {(edu.gpa || edu.honors) && <p className="text-xs mt-0.5" style={{ color: colors.secondary }}>{edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors && ' · '}{edu.honors}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills & Languages */}
        <div className="grid grid-cols-2 gap-8">
          {data.skills.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-3" style={{ color: colors.primary }}>
                <span className="flex-1 h-px" style={{ backgroundColor: colors.accent + '30' }} />
                {L.skills}
                <span className="flex-1 h-px" style={{ backgroundColor: colors.accent + '30' }} />
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded" style={{ backgroundColor: `${colors.primary}08`, color: colors.text, border: `1px solid ${colors.accent}30` }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
          {data.languages && data.languages.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-3" style={{ color: colors.primary }}>
                <span className="flex-1 h-px" style={{ backgroundColor: colors.accent + '30' }} />
                {L.languages}
                <span className="flex-1 h-px" style={{ backgroundColor: colors.accent + '30' }} />
              </h2>
              <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={colors} variant="compact" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ElegantTemplate;
