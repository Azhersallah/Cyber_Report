import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const ModernTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#0f172a',
    accent: '#0ea5e9',
    text: '#334155',
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
      className={cn(
        "w-full min-h-[297mm]",
        getCvTemplateClass(customization)
      )}
      style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header with integrated photo */}
      <div 
        className="p-8 pb-6"
        style={{ backgroundColor: `${colors.primary}` }}
      >
        <div className="flex items-center gap-6">
          {data.photo && (
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white flex-shrink-0">
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2" style={{ color: ht }}>
              {data.personalInfo.fullName || L.yourName}
            </h1>
            {data.personalInfo.title && (
              <p className="text-xl mb-3" style={{ color: ht, opacity: 0.9 }}>
                {data.personalInfo.title}
              </p>
            )}
            
            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 text-sm" style={{ color: ht, opacity: 0.8 }}>
              {data.personalInfo.email && (
                <div className="flex items-center gap-1">
                  <Mail size={14} />
                  <span>{data.personalInfo.email}</span>
                </div>
              )}
              {data.personalInfo.phone && (
                <div className="flex items-center gap-1">
                  <Phone size={14} />
                  <span>{data.personalInfo.phone}</span>
                </div>
              )}
              {data.personalInfo.address && (
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{data.personalInfo.address}</span>
                </div>
              )}
            </div>
            
            {(data.personalInfo.linkedin || data.personalInfo.website) && (
              <div className="flex flex-wrap gap-4 text-sm mt-2" style={{ color: ht, opacity: 0.8 }}>
                {data.personalInfo.linkedin && (
                  <div className="flex items-center gap-1">
                    <Linkedin size={14} />
                    <span>{data.personalInfo.linkedin}</span>
                  </div>
                )}
                {data.personalInfo.website && (
                  <div className="flex items-center gap-1">
                    <Globe size={14} />
                    <span>{data.personalInfo.website}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-6">
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
              {data.personalInfo.summary}
            </p>
          </div>
        )}

        {/* Mixed Column Layout */}
        <div className="grid grid-cols-[1fr_300px] gap-8">
          {/* Left Column - Experience & Education */}
          <div className="space-y-6">
            {/* Work Experience */}
            {data.workExperience.length > 0 && (
              <div>
                <h2 
                  className="text-2xl font-bold mb-4 flex items-center gap-2"
                  style={{ color: colors.primary }}
                >
                  <div 
                    className="w-1 h-6 rounded-full"
                    style={{ backgroundColor: colors.accent }}
                  />
                  {L.experience}
                </h2>
                <div className="space-y-5">
                  {data.workExperience.map((exp) => (
                    <div key={exp.id} className="relative pl-6">
                      <div 
                        className="absolute left-0 top-2 w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors.accent }}
                      />
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg" style={{ color: colors.text }}>
                          {exp.jobTitle}
                        </h3>
                        <span className="text-sm whitespace-nowrap ml-4" style={{ color: colors.secondary }}>
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
              <div>
                <h2 
                  className="text-2xl font-bold mb-4 flex items-center gap-2"
                  style={{ color: colors.primary }}
                >
                  <div 
                    className="w-1 h-6 rounded-full"
                    style={{ backgroundColor: colors.accent }}
                  />
                  {L.education}
                </h2>
                <div className="space-y-5">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="relative pl-6">
                      <div 
                        className="absolute left-0 top-2 w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors.accent }}
                      />
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg" style={{ color: colors.text }}>
                          {edu.degree}
                        </h3>
                        <span className="text-sm whitespace-nowrap ml-4" style={{ color: colors.secondary }}>
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
          </div>

          {/* Right Column - Skills & Languages */}
          <div className="space-y-6">
            {data.skills.length > 0 && (
              <div 
                className="p-6 rounded-lg"
                style={{ backgroundColor: `${colors.accent}10` }}
              >
                <h2 
                  className="text-xl font-bold mb-4"
                  style={{ color: colors.primary }}
                >
                  {L.skills}
                </h2>
                <div className="space-y-2">
                  {data.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 rounded text-sm font-medium"
                      style={{ 
                        backgroundColor: colors.accent,
                        color: 'white'
                      }}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.languages && data.languages.length > 0 && (
              <div 
                className="p-6 rounded-lg"
                style={{ backgroundColor: `${colors.accent}10` }}
              >
                <h2 
                  className="text-xl font-bold mb-4"
                  style={{ color: colors.primary }}
                >
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
    </div>
  );
};

export default ModernTemplate;
