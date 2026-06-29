import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const RibbonTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#b91c1c',
    accent: '#ef4444',
    text: '#1f2937',
    background: '#ffffff',
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

  const RibbonHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="relative mb-4">
      <div
        className="py-2 px-5 inline-block font-bold text-sm uppercase tracking-wider"
        style={{
          backgroundColor: colors.primary,
          color: ht,
          clipPath: isRTL
            ? 'polygon(8px 0, 100% 0, 100% 100%, 8px 100%, 0 50%)'
            : 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)',
        }}
      >
        {title}
      </div>
      <div className="h-0.5 mt-1" style={{ backgroundColor: `${colors.accent}30` }} />
    </div>
  );

  return (
    <div
      className={cn("w-full min-h-[297mm]", getCvTemplateClass(customization))}
      style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="p-8 pb-6" style={{ borderBottom: `4px solid ${colors.primary}` }}>
        <div className="flex items-center gap-6">
          {data.photo && (
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-md" style={{ border: `3px solid ${colors.primary}` }}>
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-black mb-1" style={{ color: colors.primary }}>
              {data.personalInfo.fullName || L.yourName}
            </h1>
            {data.personalInfo.title && (
              <p className="text-base font-medium mb-3" style={{ color: colors.accent }}>{data.personalInfo.title}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: colors.secondary }}>
              {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={11} style={{ color: colors.accent }} />{data.personalInfo.email}</span>}
              {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={11} style={{ color: colors.accent }} />{data.personalInfo.phone}</span>}
              {data.personalInfo.address && <span className="flex items-center gap-1"><MapPin size={11} style={{ color: colors.accent }} />{data.personalInfo.address}</span>}
              {data.personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin size={11} style={{ color: colors.accent }} />{data.personalInfo.linkedin}</span>}
              {data.personalInfo.website && <span className="flex items-center gap-1"><Globe size={11} style={{ color: colors.accent }} />{data.personalInfo.website}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-6">
            <RibbonHeader title={L.profile} />
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
          </div>
        )}

        {/* Experience */}
        {data.workExperience.length > 0 && (
          <div className="mb-6">
            <RibbonHeader title={L.experience} />
            <div className="space-y-4">
              {data.workExperience.map((exp) => (
                <div key={exp.id} className="relative" style={{ paddingInlineStart: '14px', borderInlineStart: `3px solid ${colors.accent}` }}>
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-sm" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                    <span className="text-xs whitespace-nowrap" style={{ color: colors.secondary }}>{formatDate(exp.startDate)} – {formatDate(exp.endDate)}</span>
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
            <RibbonHeader title={L.education} />
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} style={{ paddingInlineStart: '14px', borderInlineStart: `3px solid ${colors.accent}` }}>
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
              <RibbonHeader title={L.skills} />
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 text-xs font-medium rounded-sm" style={{ backgroundColor: `${colors.primary}10`, color: colors.primary, borderInlineStart: `2px solid ${colors.accent}` }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
          {data.languages && data.languages.length > 0 && (
            <div>
              <RibbonHeader title={L.languages} />
              <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={colors} variant="default" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RibbonTemplate;
