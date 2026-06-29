import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const MosaicTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#7c3aed',
    accent: '#c084fc',
    text: '#1e1b4b',
    background: '#faf5ff',
    secondary: '#6b7280',
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
      {/* Mosaic header tiles */}
      <div className="grid grid-cols-[1fr_auto] gap-0">
        <div className="p-7" style={{ backgroundColor: colors.primary }}>
          <h1 className="text-3xl font-black mb-1" style={{ color: ht }}>
            {data.personalInfo.fullName || L.yourName}
          </h1>
          {data.personalInfo.title && (
            <p className="text-base font-medium" style={{ color: colors.accent }}>{data.personalInfo.title}</p>
          )}
        </div>
        {data.photo && (
          <div className="w-32 h-full overflow-hidden" style={{ backgroundColor: colors.accent }}>
            <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Contact mosaic strip */}
      <div className="grid grid-cols-5 gap-px" style={{ backgroundColor: `${colors.primary}20` }}>
        {data.personalInfo.email && (
          <div className="flex items-center gap-1.5 px-3 py-2 text-xs" style={{ backgroundColor: colors.background }}>
            <Mail size={11} style={{ color: colors.primary }} /><span className="truncate">{data.personalInfo.email}</span>
          </div>
        )}
        {data.personalInfo.phone && (
          <div className="flex items-center gap-1.5 px-3 py-2 text-xs" style={{ backgroundColor: colors.background }}>
            <Phone size={11} style={{ color: colors.primary }} /><span>{data.personalInfo.phone}</span>
          </div>
        )}
        {data.personalInfo.address && (
          <div className="flex items-center gap-1.5 px-3 py-2 text-xs" style={{ backgroundColor: colors.background }}>
            <MapPin size={11} style={{ color: colors.primary }} /><span className="truncate">{data.personalInfo.address}</span>
          </div>
        )}
        {data.personalInfo.linkedin && (
          <div className="flex items-center gap-1.5 px-3 py-2 text-xs" style={{ backgroundColor: colors.background }}>
            <Linkedin size={11} style={{ color: colors.primary }} /><span className="truncate">{data.personalInfo.linkedin}</span>
          </div>
        )}
        {data.personalInfo.website && (
          <div className="flex items-center gap-1.5 px-3 py-2 text-xs" style={{ backgroundColor: colors.background }}>
            <Globe size={11} style={{ color: colors.primary }} /><span className="truncate">{data.personalInfo.website}</span>
          </div>
        )}
      </div>

      <div className="p-7">
        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: `${colors.primary}08`, border: `1px solid ${colors.primary}15` }}>
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
          </div>
        )}

        {/* Mosaic card grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Experience - spans full width */}
          {data.workExperience.length > 0 && (
            <div className="col-span-2 p-5 rounded-xl" style={{ backgroundColor: '#ffffff', border: `1px solid ${colors.primary}15` }}>
              <h2 className="text-sm font-black uppercase tracking-wider mb-4 pb-2" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.experience}</h2>
              <div className="space-y-4">
                {data.workExperience.map((exp) => (
                  <div key={exp.id} className="p-3 rounded-lg" style={{ backgroundColor: `${colors.primary}05` }}>
                    <div className="flex justify-between items-start mb-0.5">
                      <h3 className="font-bold text-sm" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                      <span className="text-xs whitespace-nowrap px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.accent}25`, color: colors.primary }}>{formatDate(exp.startDate)} – {formatDate(exp.endDate)}</span>
                    </div>
                    <p className="text-xs font-semibold mb-1" style={{ color: colors.accent }}>{exp.company}{exp.location && ` · ${exp.location}`}</p>
                    {exp.description && <p className="text-xs leading-relaxed" style={{ color: colors.secondary }}>{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education card */}
          {data.education.length > 0 && (
            <div className="p-5 rounded-xl" style={{ backgroundColor: '#ffffff', border: `1px solid ${colors.primary}15` }}>
              <h2 className="text-sm font-black uppercase tracking-wider mb-4 pb-2" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.education}</h2>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id}>
                    <h3 className="font-bold text-sm" style={{ color: colors.text }}>{edu.degree}</h3>
                    <p className="text-xs font-semibold" style={{ color: colors.accent }}>{edu.institution}</p>
                    <p className="text-xs" style={{ color: colors.secondary }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</p>
                    {(edu.gpa || edu.honors) && <p className="text-xs" style={{ color: colors.secondary }}>{edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors && ' · '}{edu.honors}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills + Languages stacked card */}
          <div className="space-y-4">
            {data.skills.length > 0 && (
              <div className="p-5 rounded-xl" style={{ backgroundColor: '#ffffff', border: `1px solid ${colors.primary}15` }}>
                <h2 className="text-sm font-black uppercase tracking-wider mb-3 pb-2" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.skills}</h2>
                <div className="grid grid-cols-2 gap-1.5">
                  {data.skills.map((skill, i) => (
                    <span key={i} className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-center" style={{ backgroundColor: `${colors.primary}10`, color: colors.primary }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {data.languages && data.languages.length > 0 && (
              <div className="p-5 rounded-xl" style={{ backgroundColor: '#ffffff', border: `1px solid ${colors.primary}15` }}>
                <h2 className="text-sm font-black uppercase tracking-wider mb-3 pb-2" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.languages}</h2>
                <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={colors} variant="default" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MosaicTemplate;
