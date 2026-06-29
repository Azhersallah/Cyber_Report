import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';
import { LanguagesSection } from './LanguagesSection';

const MinimalTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#111827',
    accent: '#6b7280',
    text: '#1f2937',
    background: '#ffffff',
    secondary: '#9ca3af',
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
      className={cn("w-full min-h-[297mm] p-10", getCvTemplateClass(customization))}
      style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="text-center mb-6 pb-6" style={{ borderBottom: `1px solid ${colors.accent}30` }}>
        {data.photo && (
          <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4" style={{ border: `3px solid ${colors.primary}20` }}>
            <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-3xl font-semibold mb-1 tracking-wide" style={{ color: colors.primary }}>
          {data.personalInfo.fullName || L.yourName}
        </h1>
        {data.personalInfo.title && (
          <p className="text-base mb-3" style={{ color: colors.accent }}>{data.personalInfo.title}</p>
        )}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs" style={{ color: colors.secondary }}>
          {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={11} />{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={11} />{data.personalInfo.phone}</span>}
          {data.personalInfo.address && <span className="flex items-center gap-1"><MapPin size={11} />{data.personalInfo.address}</span>}
          {data.personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin size={11} />{data.personalInfo.linkedin}</span>}
          {data.personalInfo.website && <span className="flex items-center gap-1"><Globe size={11} />{data.personalInfo.website}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.personalInfo.summary && (
        <div className="mb-6 pb-6 text-center" style={{ borderBottom: `1px solid ${colors.accent}30` }}>
          <p className="text-sm leading-relaxed max-w-xl mx-auto" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Experience */}
        {data.workExperience.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] mb-4 pb-1.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.primary}` }}>
              {L.experience}
            </h2>
            <div className="space-y-4">
              {data.workExperience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-sm font-semibold" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                    <span className="text-xs" style={{ color: colors.secondary }}>{formatDate(exp.startDate)} – {formatDate(exp.endDate)}</span>
                  </div>
                  <p className="text-xs mb-1.5" style={{ color: colors.accent }}>{exp.company}{exp.location && ` · ${exp.location}`}</p>
                  {exp.description && <p className="text-xs leading-relaxed" style={{ color: colors.text }}>{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] mb-4 pb-1.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.primary}` }}>
              {L.education}
            </h2>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-sm font-semibold" style={{ color: colors.text }}>{edu.degree}</h3>
                    <span className="text-xs" style={{ color: colors.secondary }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</span>
                  </div>
                  <p className="text-xs" style={{ color: colors.accent }}>{edu.institution}{edu.location && ` · ${edu.location}`}</p>
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
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.primary}` }}>
                {L.skills}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.primary}08`, color: colors.text, border: `1px solid ${colors.primary}20` }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
          {data.languages && data.languages.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.primary}` }}>
                {L.languages}
              </h2>
              <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={colors} variant="compact" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinimalTemplate;
