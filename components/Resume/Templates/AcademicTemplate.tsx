import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const AcademicTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = { primary: '#4338ca', accent: '#6366f1', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff', ...customization.colors };
  const formatDate = (date: string) => {
    if (date === 'present') return L.present;
    if (!date) return '';
    const [year, month] = date.split('-');
    return `${month}/${year}`;
  };

  return (
    <div className={cn("w-full min-h-[297mm] p-8", getCvTemplateClass(customization))} style={{ '--cv-font-family': getCvFontFamily(customization, isRTL, 'Georgia'), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center mb-5 pb-4" style={{ borderBottom: `3px double ${colors.primary}` }}>
        {data.photo && (
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3" style={{ border: `2px solid ${colors.accent}` }}>
            <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-2xl font-bold mb-1" style={{ color: colors.primary }}>
          {data.personalInfo.fullName || L.yourName}
        </h1>
        {data.personalInfo.title && (
          <p className="text-sm italic mb-2" style={{ color: colors.accent }}>{data.personalInfo.title}</p>
        )}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs" style={{ color: colors.secondary }}>
          {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={10} />{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={10} />{data.personalInfo.phone}</span>}
          {data.personalInfo.address && <span className="flex items-center gap-1"><MapPin size={10} />{data.personalInfo.address}</span>}
          {data.personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin size={10} />{data.personalInfo.linkedin}</span>}
          {data.personalInfo.website && <span className="flex items-center gap-1"><Globe size={10} />{data.personalInfo.website}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.personalInfo.summary && (
        <div className="mb-5">
          <p className="text-sm leading-relaxed text-center italic" style={{ color: colors.text }}>
            {data.personalInfo.summary}
          </p>
        </div>
      )}

      {/* Education - prioritized for academic */}
      {data.education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
            {L.education}
          </h2>
          <div className="space-y-3">
            {data.education.map((edu) => (
              <div key={edu.id} style={{ paddingInlineStart: '12px', borderInlineStart: `2px solid ${colors.accent}40` }}>
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="font-bold text-sm" style={{ color: colors.text }}>{edu.degree}</h3>
                  <span className="text-xs flex-shrink-0" style={{ color: colors.secondary, marginInlineStart: '8px' }}>
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </span>
                </div>
                <p className="text-xs font-semibold italic mb-0.5" style={{ color: colors.accent }}>
                  {edu.institution} {edu.location && `• ${edu.location}`}
                </p>
                {(edu.gpa || edu.honors) && (
                  <p className="text-xs" style={{ color: colors.secondary }}>
                    {edu.gpa && `GPA: ${edu.gpa}`}
                    {edu.gpa && edu.honors && ' • '}
                    {edu.honors}
                  </p>
                )}
                {edu.description && (
                  <p className="text-xs leading-relaxed mt-1" style={{ color: colors.text }}>{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.workExperience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
            {L.experience}
          </h2>
          <div className="space-y-3">
            {data.workExperience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="font-bold text-sm" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                  <span className="text-xs flex-shrink-0" style={{ color: colors.secondary, marginInlineStart: '8px' }}>
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </span>
                </div>
                <p className="text-xs font-semibold italic mb-1" style={{ color: colors.accent }}>
                  {exp.company} {exp.location && `• ${exp.location}`}
                </p>
                {exp.description && (
                  <p className="text-xs leading-relaxed" style={{ color: colors.text }}>{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills & Languages side by side */}
      <div className="grid grid-cols-2 gap-6">
        {data.skills.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
              {L.skills}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill, i) => (
                <span key={i} className="text-xs py-0.5 px-2 rounded-md" style={{ backgroundColor: `${colors.accent}15`, color: colors.primary, border: `1px solid ${colors.accent}30` }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.languages && data.languages.length > 0 && (
          <div>
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
    </div>
  );
};

export default AcademicTemplate;
