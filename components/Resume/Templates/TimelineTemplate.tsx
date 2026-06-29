import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const TimelineTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = { primary: '#16a34a', accent: '#22c55e', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff', ...customization.colors };
  const formatDate = (date: string) => {
    if (date === 'present') return L.present;
    if (!date) return '';
    const [year, month] = date.split('-');
    return `${month}/${year}`;
  };

  return (
    <div className={cn("w-full min-h-[297mm] p-8", getCvTemplateClass(customization))} style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-start gap-6 mb-6 pb-5" style={{ borderBottom: `2px solid ${colors.accent}30` }}>
        {data.photo && (
          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `3px solid ${colors.accent}` }}>
            <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1" style={{ color: colors.primary }}>
            {data.personalInfo.fullName || L.yourName}
          </h1>
          {data.personalInfo.title && (
            <p className="text-base font-medium mb-2" style={{ color: colors.accent }}>{data.personalInfo.title}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: colors.secondary }}>
            {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={11} />{data.personalInfo.email}</span>}
            {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={11} />{data.personalInfo.phone}</span>}
            {data.personalInfo.address && <span className="flex items-center gap-1"><MapPin size={11} />{data.personalInfo.address}</span>}
          </div>
          {data.personalInfo.summary && (
            <p className="text-sm leading-relaxed mt-3" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
          )}
        </div>
      </div>

      {/* Experience Timeline */}
      {data.workExperience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
            {L.workExperience}
          </h2>
          <div className="relative" style={{ marginInlineStart: '6px' }}>
            <div className="absolute top-0 bottom-0 w-0.5" style={{ backgroundColor: `${colors.accent}40`, insetInlineStart: '0' }} />
            {data.workExperience.map((exp) => (
              <div key={exp.id} className="relative pb-5" style={{ paddingInlineStart: '24px' }}>
                <div className="absolute top-1.5 w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary, insetInlineStart: '-5px', border: `2px solid ${colors.background}` }} />
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="text-sm font-bold" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                  <span className="text-xs flex-shrink-0" style={{ color: colors.secondary, marginInlineStart: '8px' }}>
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </span>
                </div>
                <p className="text-xs font-semibold mb-1" style={{ color: colors.accent }}>
                  {exp.company} {exp.location && `• ${exp.location}`}
                </p>
                {exp.description && (
                  <p className="text-xs leading-relaxed" style={{ color: colors.secondary }}>{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education & Skills */}
      <div className="grid grid-cols-2 gap-6">
        {data.education.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
              {L.education}
            </h2>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="font-bold text-sm" style={{ color: colors.text }}>{edu.degree}</h3>
                  <p className="text-xs font-semibold" style={{ color: colors.accent }}>{edu.institution}</p>
                  <p className="text-xs" style={{ color: colors.secondary }}>
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.skills.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
              {L.skills}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill, i) => (
                <span key={i} className="px-2.5 py-1 text-xs rounded-md font-medium" style={{ backgroundColor: `${colors.accent}15`, color: colors.primary, border: `1px solid ${colors.accent}30` }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Languages */}
      {data.languages && data.languages.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
            {L.languages}
          </h2>
          <LanguagesSection 
            languages={data.languages}
            isRTL={isRTL}
            language={language}
            colors={colors}
            variant="compact"
          />
        </div>
      )}
    </div>
  );
};

export default TimelineTemplate;
