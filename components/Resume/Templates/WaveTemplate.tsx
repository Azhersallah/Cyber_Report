import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const WaveTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#0e7490',
    accent: '#22d3ee',
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

  const WaveSvg: React.FC<{ flip?: boolean }> = ({ flip }) => (
    <svg viewBox="0 0 800 40" preserveAspectRatio="none" className="w-full block" style={{ height: '25px', transform: flip ? 'scaleY(-1)' : undefined }}>
      <path d={`M0,20 Q200,40 400,20 Q600,0 800,20 L800,40 L0,40 Z`} fill={colors.primary} opacity="0.08" />
      <path d={`M0,25 Q200,40 400,25 Q600,10 800,25 L800,40 L0,40 Z`} fill={colors.accent} opacity="0.06" />
    </svg>
  );

  return (
    <div
      className={cn("w-full min-h-[297mm]", getCvTemplateClass(customization))}
      style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="p-8 pb-4" style={{ backgroundColor: colors.primary }}>
        <div className="flex items-center gap-6" style={{ color: ht }}>
          {data.photo && (
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0" style={{ border: `3px solid ${colors.accent}`, boxShadow: `0 4px 15px rgba(0,0,0,0.2)` }}>
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold mb-1">{data.personalInfo.fullName || L.yourName}</h1>
            {data.personalInfo.title && (
              <p className="text-base font-medium opacity-90 mb-2">{data.personalInfo.title}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-85">
              {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={11} />{data.personalInfo.email}</span>}
              {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={11} />{data.personalInfo.phone}</span>}
              {data.personalInfo.address && <span className="flex items-center gap-1"><MapPin size={11} />{data.personalInfo.address}</span>}
              {data.personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin size={11} />{data.personalInfo.linkedin}</span>}
              {data.personalInfo.website && <span className="flex items-center gap-1"><Globe size={11} />{data.personalInfo.website}</span>}
            </div>
          </div>
        </div>
      </div>
      {/* Wave divider after header */}
      <svg viewBox="0 0 800 50" preserveAspectRatio="none" className="w-full block" style={{ height: '30px', marginTop: '-1px' }}>
        <path d="M0,0 L800,0 L800,15 Q600,50 400,15 Q200,-20 0,15 Z" fill={colors.primary} />
      </svg>

      <div className="px-8 pb-8">
        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-5">
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
          </div>
        )}

        {/* Experience */}
        {data.workExperience.length > 0 && (
          <div className="mb-2">
            <h2 className="text-base font-bold mb-3 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.experience}</h2>
            <div className="space-y-4">
              {data.workExperience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-sm" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                    <span className="text-xs whitespace-nowrap" style={{ color: colors.secondary }}>{formatDate(exp.startDate)} – {formatDate(exp.endDate)}</span>
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{ color: colors.primary }}>{exp.company}{exp.location && ` · ${exp.location}`}</p>
                  {exp.description && <p className="text-xs leading-relaxed" style={{ color: colors.secondary }}>{exp.description}</p>}
                </div>
              ))}
            </div>
            <WaveSvg />
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="mb-2">
            <h2 className="text-base font-bold mb-3 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.education}</h2>
            <div className="space-y-3">
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
            <WaveSvg />
          </div>
        )}

        {/* Skills & Languages */}
        <div className="grid grid-cols-2 gap-6">
          {data.skills.length > 0 && (
            <div>
              <h2 className="text-base font-bold mb-3 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.skills}</h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: `${colors.primary}10`, color: colors.primary, border: `1px solid ${colors.accent}40` }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
          {data.languages && data.languages.length > 0 && (
            <div>
              <h2 className="text-base font-bold mb-3 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>{L.languages}</h2>
              <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={colors} variant="default" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaveTemplate;
