import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const HorizonTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#0d9488',
    accent: '#5eead4',
    text: '#1e293b',
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
      className={cn("w-full min-h-[297mm]", getCvTemplateClass(customization))}
      style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Layered horizon header */}
      <div style={{ background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.primary}dd 60%, ${colors.accent}88 100%)` }}>
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-end gap-6" style={{ color: ht }}>
            {data.photo && (
              <div className="w-28 h-28 rounded-full overflow-hidden flex-shrink-0 shadow-lg" style={{ border: `4px solid ${colors.accent}` }}>
                <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-extrabold mb-1">{data.personalInfo.fullName || L.yourName}</h1>
              {data.personalInfo.title && (
                <p className="text-base font-medium opacity-90">{data.personalInfo.title}</p>
              )}
            </div>
          </div>
        </div>
        {/* Contact band */}
        <div className="px-8 py-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs" style={{ backgroundColor: `${colors.accent}30`, color: ht }}>
          {data.personalInfo.email && <span className="flex items-center gap-1.5"><Mail size={11} />{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span className="flex items-center gap-1.5"><Phone size={11} />{data.personalInfo.phone}</span>}
          {data.personalInfo.address && <span className="flex items-center gap-1.5"><MapPin size={11} />{data.personalInfo.address}</span>}
          {data.personalInfo.linkedin && <span className="flex items-center gap-1.5"><Linkedin size={11} />{data.personalInfo.linkedin}</span>}
          {data.personalInfo.website && <span className="flex items-center gap-1.5"><Globe size={11} />{data.personalInfo.website}</span>}
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-6 py-4 px-5 rounded-lg" style={{ backgroundColor: `${colors.primary}08` }}>
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
          </div>
        )}

        {/* Horizontal band sections */}
        {/* Experience */}
        {data.workExperience.length > 0 && (
          <div className="mb-6">
            <div className="py-1.5 px-4 mb-4 rounded-sm" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }}>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: ht }}>{L.experience}</h2>
            </div>
            <div className="space-y-4 px-2">
              {data.workExperience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-sm" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                    <span className="text-xs whitespace-nowrap px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.primary}12`, color: colors.primary }}>{formatDate(exp.startDate)} – {formatDate(exp.endDate)}</span>
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{ color: colors.primary }}>{exp.company}{exp.location && ` · ${exp.location}`}</p>
                  {exp.description && <p className="text-xs leading-relaxed" style={{ color: colors.secondary }}>{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="mb-6">
            <div className="py-1.5 px-4 mb-4 rounded-sm" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }}>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: ht }}>{L.education}</h2>
            </div>
            <div className="space-y-3 px-2">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-sm" style={{ color: colors.text }}>{edu.degree}</h3>
                    <span className="text-xs whitespace-nowrap" style={{ color: colors.secondary }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</span>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: colors.primary }}>{edu.institution}{edu.location && ` · ${edu.location}`}</p>
                  {(edu.gpa || edu.honors) && <p className="text-xs mt-0.5" style={{ color: colors.secondary }}>{edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors && ' · '}{edu.honors}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills & Languages */}
        <div className="grid grid-cols-2 gap-6">
          {data.skills.length > 0 && (
            <div>
              <div className="py-1.5 px-4 mb-3 rounded-sm" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }}>
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: ht }}>{L.skills}</h2>
              </div>
              <div className="flex flex-wrap gap-1.5 px-2">
                {data.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: `${colors.primary}12`, color: colors.primary }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
          {data.languages && data.languages.length > 0 && (
            <div>
              <div className="py-1.5 px-4 mb-3 rounded-sm" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }}>
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: ht }}>{L.languages}</h2>
              </div>
              <div className="px-2">
                <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={colors} variant="compact" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HorizonTemplate;
