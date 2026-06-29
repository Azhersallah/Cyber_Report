import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const CreativeTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = {
    primary: '#7c3aed',
    accent: '#a78bfa',
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

  return (
    <div 
      className={cn(
        "w-full min-h-[297mm] flex",
        getCvTemplateClass(customization)
      )}
      style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Left Sidebar */}
      <div className="w-[34%] p-7" style={{ backgroundColor: colors.primary, color: ht }}>
        {/* Photo */}
        {data.photo && (
          <div className="w-28 h-28 rounded-2xl overflow-hidden mx-auto mb-6" style={{ border: `3px solid ${ht}30`, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Contact */}
        <div className="mb-6">
          <h2 className="text-xs font-bold mb-3 uppercase tracking-wider pb-1.5" style={{ borderBottom: `1px solid ${ht}25` }}>
            {L.contact}
          </h2>
          <div className="space-y-2.5 text-xs">
            {data.personalInfo.email && <div className="flex items-start gap-2"><Mail size={12} className="mt-0.5 flex-shrink-0 opacity-70" /><span className="break-all">{data.personalInfo.email}</span></div>}
            {data.personalInfo.phone && <div className="flex items-center gap-2"><Phone size={12} className="flex-shrink-0 opacity-70" /><span>{data.personalInfo.phone}</span></div>}
            {data.personalInfo.address && <div className="flex items-start gap-2"><MapPin size={12} className="mt-0.5 flex-shrink-0 opacity-70" /><span>{data.personalInfo.address}</span></div>}
            {data.personalInfo.linkedin && <div className="flex items-start gap-2"><Linkedin size={12} className="mt-0.5 flex-shrink-0 opacity-70" /><span className="break-all">{data.personalInfo.linkedin}</span></div>}
            {data.personalInfo.website && <div className="flex items-start gap-2"><Globe size={12} className="mt-0.5 flex-shrink-0 opacity-70" /><span className="break-all">{data.personalInfo.website}</span></div>}
          </div>
        </div>

        {/* Skills */}
        {data.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold mb-3 uppercase tracking-wider pb-1.5" style={{ borderBottom: `1px solid ${ht}25` }}>
              {L.skills}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${ht}15` }}>{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div>
            <h2 className="text-xs font-bold mb-3 uppercase tracking-wider pb-1.5" style={{ borderBottom: `1px solid ${ht}25` }}>
              {L.languages}
            </h2>
            <LanguagesSection languages={data.languages} isRTL={isRTL} language={language} colors={{ ...colors, text: ht, secondary: `${ht}cc` }} variant="compact" />
          </div>
        )}
      </div>

      {/* Right Content */}
      <div className="flex-1 p-7">
        {/* Name & Title */}
        <div className="mb-6 pb-5" style={{ borderBottom: `2px solid ${colors.accent}` }}>
          <h1 className="text-3xl font-bold mb-1" style={{ color: colors.primary }}>
            {data.personalInfo.fullName || L.yourName}
          </h1>
          {data.personalInfo.title && (
            <p className="text-base" style={{ color: colors.accent }}>{data.personalInfo.title}</p>
          )}
        </div>

        {/* Summary */}
        {data.personalInfo.summary && (
          <div className="mb-6">
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
          </div>
        )}

        {/* Experience */}
        {data.workExperience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4 pb-1.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.accent}40` }}>
              {L.experience}
            </h2>
            <div className="space-y-4">
              {data.workExperience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-sm font-bold" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                    <span className="text-xs whitespace-nowrap" style={{ color: colors.secondary }}>{formatDate(exp.startDate)} – {formatDate(exp.endDate)}</span>
                  </div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: colors.accent }}>{exp.company}{exp.location && ` · ${exp.location}`}</p>
                  {exp.description && <p className="text-xs leading-relaxed" style={{ color: colors.text }}>{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4 pb-1.5" style={{ color: colors.primary, borderBottom: `1px solid ${colors.accent}40` }}>
              {L.education}
            </h2>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-sm font-bold" style={{ color: colors.text }}>{edu.degree}</h3>
                    <span className="text-xs whitespace-nowrap" style={{ color: colors.secondary }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</span>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: colors.accent }}>{edu.institution}{edu.location && ` · ${edu.location}`}</p>
                  {(edu.gpa || edu.honors) && <p className="text-xs mt-0.5" style={{ color: colors.secondary }}>{edu.gpa && `GPA: ${edu.gpa}`}{edu.gpa && edu.honors && ' · '}{edu.honors}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativeTemplate;
