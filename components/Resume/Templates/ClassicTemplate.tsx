import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const ClassicTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#1f2937',
    accent: '#374151',
    text: '#1f2937',
    background: '#ffffff',
    secondary: '#6b7280',
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
      className={cn(
        "w-full min-h-[297mm] p-12",
        getCvTemplateClass(customization)
      )}
      style={{ '--cv-font-family': getCvFontFamily(customization, isRTL, 'Georgia'), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header with Photo on Left */}
      <div className="flex gap-6 mb-8 pb-6 border-b-2" style={{ borderColor: `${colors.accent}40` }}>
        {data.photo && (
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 flex-shrink-0" style={{ borderColor: `${colors.accent}40` }}>
            <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="flex-1">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: colors.primary }}
          >
            {data.personalInfo.fullName || L.yourName}
          </h1>
          {data.personalInfo.title && (
            <p className="text-lg mb-3" style={{ color: colors.secondary }}>
              {data.personalInfo.title}
            </p>
          )}
          
          {/* Contact Info */}
          <div className="space-y-1 text-sm" style={{ color: colors.text }}>
            {data.personalInfo.email && (
              <div className="flex items-center gap-2">
                <Mail size={14} />
                <span>{data.personalInfo.email}</span>
              </div>
            )}
            {data.personalInfo.phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} />
                <span>{data.personalInfo.phone}</span>
              </div>
            )}
            {data.personalInfo.address && (
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>{data.personalInfo.address}</span>
              </div>
            )}
            {data.personalInfo.linkedin && (
              <div className="flex items-center gap-2">
                <Linkedin size={14} />
                <span>{data.personalInfo.linkedin}</span>
              </div>
            )}
            {data.personalInfo.website && (
              <div className="flex items-center gap-2">
                <Globe size={14} />
                <span>{data.personalInfo.website}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {data.personalInfo.summary && (
        <div className="mb-6">
          <h2 
            className="text-xl font-bold mb-3 uppercase tracking-wide"
            style={{ color: colors.primary }}
          >
            {L.summary}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
            {data.personalInfo.summary}
          </p>
        </div>
      )}

      {/* Work Experience */}
      {data.workExperience.length > 0 && (
        <div className="mb-6">
          <h2 
            className="text-xl font-bold mb-3 uppercase tracking-wide"
            style={{ color: colors.primary }}
          >
            {L.workExperience}
          </h2>
          <div className="space-y-4">
            {data.workExperience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-base" style={{ color: colors.text }}>
                    {exp.jobTitle}
                  </h3>
                  <span className="text-sm" style={{ color: colors.secondary }}>
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </span>
                </div>
                <p className="text-sm font-semibold mb-2" style={{ color: colors.accent }}>
                  {exp.company} {exp.location && `• ${exp.location}`}
                </p>
                {exp.description && (
                  <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div className="mb-6">
          <h2 
            className="text-xl font-bold mb-3 uppercase tracking-wide"
            style={{ color: colors.primary }}
          >
            {L.education}
          </h2>
          <div className="space-y-4">
            {data.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-base" style={{ color: colors.text }}>
                    {edu.degree}
                  </h3>
                  <span className="text-sm" style={{ color: colors.secondary }}>
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </span>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: colors.accent }}>
                  {edu.institution} {edu.location && `• ${edu.location}`}
                </p>
                {(edu.gpa || edu.honors) && (
                  <p className="text-sm mb-1" style={{ color: colors.secondary }}>
                    {edu.gpa && `GPA: ${edu.gpa}`}
                    {edu.gpa && edu.honors && ' • '}
                    {edu.honors}
                  </p>
                )}
                {edu.description && (
                  <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-6">
          <h2 
            className="text-xl font-bold mb-3 uppercase tracking-wide"
            style={{ color: colors.primary }}
          >
            {L.skills}
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {data.skills.map((skill, index) => (
              <span
                key={index}
                className="text-sm"
                style={{ color: colors.text }}
              >
                • {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {data.languages && data.languages.length > 0 && (
        <div>
          <h2 
            className="text-xl font-bold mb-3 uppercase tracking-wide"
            style={{ color: colors.primary }}
          >
            {L.languages}
          </h2>
          <LanguagesSection 
            languages={data.languages}
            isRTL={isRTL}
            language={language}
            colors={colors}
            variant="inline"
          />
        </div>
      )}
    </div>
  );
};

export default ClassicTemplate;
