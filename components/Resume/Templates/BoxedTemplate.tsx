import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const BoxedTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = { primary: '#0891b2', accent: '#06b6d4', text: '#1f2937', background: '#f0fdfa', secondary: '#6b7280', headerText: '#ffffff', ...customization.colors };
  const formatDate = (date: string) => {
    if (date === 'present') return L.present;
    if (!date) return '';
    const [year, month] = date.split('-');
    return `${month}/${year}`;
  };

  return (
    <div className={cn("w-full min-h-[297mm] p-5", getCvTemplateClass(customization))} style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Card */}
      <div className="rounded-xl p-6 mb-4" style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center gap-4 mb-3">
          {data.photo && (
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `3px solid ${colors.accent}` }}>
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-0.5" style={{ color: colors.primary }}>
              {data.personalInfo.fullName || L.yourName}
            </h1>
            {data.personalInfo.title && (
              <p className="text-sm font-medium mb-2" style={{ color: colors.accent }}>{data.personalInfo.title}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: colors.secondary }}>
              {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={10} />{data.personalInfo.email}</span>}
              {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={10} />{data.personalInfo.phone}</span>}
              {data.personalInfo.address && <span className="flex items-center gap-1"><MapPin size={10} />{data.personalInfo.address}</span>}
            </div>
          </div>
        </div>
        {data.personalInfo.summary && (
          <p className="text-xs leading-relaxed p-3 rounded-lg" style={{ backgroundColor: colors.background, color: colors.text }}>
            {data.personalInfo.summary}
          </p>
        )}
      </div>

      {/* Experience Card */}
      {data.workExperience.length > 0 && (
        <div className="rounded-xl p-6 mb-4" style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
            {L.workExperience}
          </h2>
          <div className="space-y-3">
            {data.workExperience.map((exp) => (
              <div key={exp.id} className="pb-3" style={{ borderBottom: `1px solid ${colors.background}` }}>
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="font-bold text-sm" style={{ color: colors.text }}>{exp.jobTitle}</h3>
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

      {/* Education & Skills Cards */}
      <div className="grid grid-cols-2 gap-4">
        {data.education.length > 0 && (
          <div className="rounded-xl p-5" style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
              {L.education}
            </h2>
            <div className="space-y-2.5">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="font-bold text-xs" style={{ color: colors.text }}>{edu.degree}</h3>
                  <p className="text-xs font-semibold" style={{ color: colors.accent }}>{edu.institution}</p>
                  <p className="text-xs" style={{ color: colors.secondary }}>
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-4">
          {data.skills.length > 0 && (
            <div className="rounded-xl p-5" style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
                {L.skills}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs font-medium rounded-md" style={{ backgroundColor: `${colors.accent}15`, color: colors.primary, border: `1px solid ${colors.accent}30` }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.languages && data.languages.length > 0 && (
            <div className="rounded-xl p-5" style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
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
    </div>
  );
};

export default BoxedTemplate;
