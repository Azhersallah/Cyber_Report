import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';
import { LanguagesSection } from './LanguagesSection';

const ExecutiveTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#1e40af',
    accent: '#3b82f6',
    text: '#1f2937',
    background: '#f8fafc',
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
      {/* Professional Header with subtle gradient */}
      <div className="p-8 pb-6" style={{ 
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`
      }}>
        <div className="flex items-center gap-6">
          {data.photo && (
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl flex-shrink-0">
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1" style={{ color: ht }}>
            <h1 className="text-4xl font-bold mb-2 tracking-tight">
              {data.personalInfo.fullName || L.yourName}
            </h1>
            {data.personalInfo.title && (
              <p className="text-xl mb-3 opacity-95 font-light">{data.personalInfo.title}</p>
            )}
            <div className="flex flex-wrap gap-4 text-xs opacity-95">
              {data.personalInfo.email && (
                <span className="flex items-center gap-2">
                  <Mail size={14} />
                  {data.personalInfo.email}
                </span>
              )}
              {data.personalInfo.phone && (
                <span className="flex items-center gap-2">
                  <Phone size={14} />
                  {data.personalInfo.phone}
                </span>
              )}
              {data.personalInfo.address && (
                <span className="flex items-center gap-2">
                  <MapPin size={14} />
                  {data.personalInfo.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Professional Summary */}
        {data.personalInfo.summary && (
          <div className="mb-6 p-4 rounded-xl border-l-4" style={{ 
            backgroundColor: colors.background,
            borderColor: colors.accent
          }}>
            <h2 className="text-base font-bold mb-2 uppercase tracking-wide" style={{ color: colors.primary }}>
              {L.summary}
            </h2>
            <p className="text-sm leading-snug" style={{ color: colors.text }}>
              {data.personalInfo.summary}
            </p>
          </div>
        )}

        {/* Work Experience */}
        {data.workExperience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 uppercase tracking-wide" style={{ 
              color: colors.primary, 
              borderColor: colors.accent 
            }}>
              {L.workExperience}
            </h2>
            <div className="space-y-4">
              {data.workExperience.map((exp) => (
                <div key={exp.id} className="relative pl-6 border-l-3" style={{ borderColor: colors.accent, borderLeftWidth: '3px' }}>
                  <div className="absolute -left-2 top-1 w-4 h-4 rounded-full border-3 border-white" style={{ 
                    backgroundColor: colors.accent,
                    borderWidth: '3px'
                  }} />
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <h3 className="text-base font-bold mb-0.5" style={{ color: colors.text }}>
                        {exp.jobTitle}
                      </h3>
                      <p className="text-sm font-semibold" style={{ color: colors.accent }}>
                        {exp.company}
                      </p>
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap ml-4 px-2 py-0.5 rounded-full" style={{ 
                      color: colors.accent,
                      backgroundColor: colors.background
                    }}>
                      {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                    </span>
                  </div>
                  {exp.location && (
                    <p className="text-xs mb-2 flex items-center gap-1" style={{ color: colors.secondary }}>
                      <MapPin size={12} />
                      {exp.location}
                    </p>
                  )}
                  {exp.description && (
                    <p className="text-sm leading-snug" style={{ color: colors.text }}>
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Skills Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Education */}
          {data.education.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 uppercase tracking-wide" style={{ 
                color: colors.primary, 
                borderColor: colors.accent 
              }}>
                {L.education}
              </h2>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id}>
                    <h3 className="text-base font-bold mb-0.5" style={{ color: colors.text }}>
                      {edu.degree}
                    </h3>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: colors.accent }}>
                      {edu.institution}
                    </p>
                    <p className="text-xs" style={{ color: colors.secondary }}>
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {data.skills.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 uppercase tracking-wide" style={{ 
                color: colors.primary, 
                borderColor: colors.accent 
              }}>
                {L.skills}
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:shadow-md"
                    style={{ 
                      backgroundColor: colors.background,
                      color: colors.primary,
                      border: `2px solid ${colors.accent}`
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 uppercase tracking-wide" style={{ 
                color: colors.primary, 
                borderColor: colors.accent 
              }}>
                {L.languages}
              </h2>
              <LanguagesSection 
                languages={data.languages}
                isRTL={isRTL}
                language={language}
                colors={colors}
                variant="default"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveTemplate;
