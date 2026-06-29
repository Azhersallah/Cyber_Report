import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const ProfessionalTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#1e40af',
    accent: '#3b82f6',
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
        "w-full min-h-[297mm]",
        getCvTemplateClass(customization)
      )}
      style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Modern Header with colored top bar */}
      <div className="px-8 pt-0">
        <div className="h-1.5 -mx-8 mb-6" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }} />
        
        <div className={`flex gap-6 mb-6 ${data.photo ? '' : ''}`}>
          {/* Photo */}
          {data.photo && (
            <div className="w-28 h-28 rounded-xl overflow-hidden shadow-md flex-shrink-0" style={{ outline: `2px solid ${colors.accent}`, outlineOffset: '2px' }}>
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h1 
              className="text-3xl font-extrabold tracking-tight mb-1"
              style={{ color: colors.primary }}
            >
              {data.personalInfo.fullName || L.yourName}
            </h1>
            {data.personalInfo.title && (
              <p className="text-base font-medium mb-3" style={{ color: colors.accent }}>
                {data.personalInfo.title}
              </p>
            )}
            
            {/* Contact Info - modern inline style */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style={{ color: colors.secondary }}>
              {data.personalInfo.email && (
                <div className="flex items-center gap-1.5">
                  <Mail size={12} style={{ color: colors.accent }} />
                  <span>{data.personalInfo.email}</span>
                </div>
              )}
              {data.personalInfo.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={12} style={{ color: colors.accent }} />
                  <span>{data.personalInfo.phone}</span>
                </div>
              )}
              {data.personalInfo.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} style={{ color: colors.accent }} />
                  <span>{data.personalInfo.address}</span>
                </div>
              )}
              {data.personalInfo.linkedin && (
                <div className="flex items-center gap-1.5">
                  <Linkedin size={12} style={{ color: colors.accent }} />
                  <span>{data.personalInfo.linkedin}</span>
                </div>
              )}
              {data.personalInfo.website && (
                <div className="flex items-center gap-1.5">
                  <Globe size={12} style={{ color: colors.accent }} />
                  <span>{data.personalInfo.website}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-8">
        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-5 p-3 rounded-lg" style={{ backgroundColor: `${colors.primary}08` }}>
            <h2 
              className="text-sm font-bold uppercase tracking-wider mb-1.5"
              style={{ color: colors.primary }}
            >
              {L.summary}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
              {data.personalInfo.summary}
            </p>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-[2fr_1fr] gap-6">
          {/* Left Column - Experience & Education */}
          <div className="space-y-5">
            {/* Work Experience */}
            {data.workExperience.length > 0 && (
              <div>
                <h2 
                  className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 flex items-center gap-2"
                  style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}
                >
                  {L.workExperience}
                </h2>
                <div className="space-y-3.5">
                  {data.workExperience.map((exp) => (
                    <div key={exp.id} className="relative" style={{ paddingInlineStart: '12px', borderInlineStart: `2px solid ${colors.accent}30` }}>
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className="font-bold text-sm" style={{ color: colors.text }}>
                          {exp.jobTitle}
                        </h3>
                        <span className="text-xs flex-shrink-0" style={{ color: colors.secondary }}>
                          {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.accent }}>
                        {exp.company} {exp.location && `• ${exp.location}`}
                      </p>
                      {exp.description && (
                        <p className="text-xs leading-relaxed" style={{ color: colors.secondary }}>
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
                  className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 flex items-center gap-2"
                  style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}
                >
                  {L.education}
                </h2>
                <div className="space-y-3.5">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="relative" style={{ paddingInlineStart: '12px', borderInlineStart: `2px solid ${colors.accent}30` }}>
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className="font-bold text-sm" style={{ color: colors.text }}>
                          {edu.degree}
                        </h3>
                        <span className="text-xs flex-shrink-0" style={{ color: colors.secondary }}>
                          {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.accent }}>
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
                        <p className="text-xs leading-relaxed mt-1" style={{ color: colors.secondary }}>
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
          <div className="space-y-5">
            {data.skills.length > 0 && (
              <div>
                <h2 
                  className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5"
                  style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}
                >
                  {L.skills}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 text-xs rounded-md font-medium"
                      style={{ 
                        backgroundColor: `${colors.accent}15`,
                        color: colors.primary,
                        border: `1px solid ${colors.accent}30`
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.languages && data.languages.length > 0 && (
              <div>
                <h2 
                  className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5"
                  style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}
                >
                  {L.languages}
                </h2>
                <div className="space-y-2">
                  {data.languages.map((lang, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs font-medium" style={{ color: colors.text }}>
                        {lang.language}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ 
                        backgroundColor: `${colors.accent}15`,
                        color: colors.primary,
                        border: `1px solid ${colors.accent}30`
                      }}>
                        {lang.proficiency === 'native' ? L.native :
                         lang.proficiency === 'fluent' ? L.fluent :
                         lang.proficiency === 'advanced' ? L.advanced :
                         lang.proficiency === 'intermediate' ? L.intermediate :
                         L.basic}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalTemplate;
