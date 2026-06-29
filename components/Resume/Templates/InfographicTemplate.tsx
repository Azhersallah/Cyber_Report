import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin, Award, Briefcase, GraduationCap, Languages as LangIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LanguagesSection } from './LanguagesSection';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const InfographicTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = { primary: '#f59e0b', accent: '#fbbf24', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff', ...customization.colors };
  const ht = colors.headerText;
  const formatDate = (date: string) => {
    if (date === 'present') return L.present;
    if (!date) return '';
    const [year, month] = date.split('-');
    return `${month}/${year}`;
  };

  return (
    <div className={cn("w-full min-h-[297mm]", getCvTemplateClass(customization))} style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-8 pb-6" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)` }}>
        <div className="flex items-center gap-5" style={{ color: ht }}>
          {data.photo && (
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-xl flex-shrink-0">
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-black mb-1">
              {data.personalInfo.fullName || L.yourName}
            </h1>
            {data.personalInfo.title && (
              <p className="text-base font-bold opacity-90 mb-2">{data.personalInfo.title}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-85">
              {data.personalInfo.email && <span className="flex items-center gap-1"><Mail size={11} />{data.personalInfo.email}</span>}
              {data.personalInfo.phone && <span className="flex items-center gap-1"><Phone size={11} />{data.personalInfo.phone}</span>}
              {data.personalInfo.address && <span className="flex items-center gap-1"><MapPin size={11} />{data.personalInfo.address}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Summary */}
        {data.personalInfo.summary && (
          <p className="text-sm leading-relaxed mb-6" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${colors.accent}15` }}>
            <Briefcase size={18} className="mx-auto mb-1" style={{ color: colors.primary }} />
            <div className="text-xl font-bold" style={{ color: colors.primary }}>{data.workExperience.length}</div>
            <div className="text-xs" style={{ color: colors.secondary }}>{L.experience}</div>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${colors.accent}15` }}>
            <GraduationCap size={18} className="mx-auto mb-1" style={{ color: colors.primary }} />
            <div className="text-xl font-bold" style={{ color: colors.primary }}>{data.education.length}</div>
            <div className="text-xs" style={{ color: colors.secondary }}>{L.education}</div>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${colors.accent}15` }}>
            <Award size={18} className="mx-auto mb-1" style={{ color: colors.primary }} />
            <div className="text-xl font-bold" style={{ color: colors.primary }}>{data.skills.length}</div>
            <div className="text-xs" style={{ color: colors.secondary }}>{L.skills}</div>
          </div>
        </div>

        {/* Experience */}
        {data.workExperience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 flex items-center gap-2" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
              <Briefcase size={14} />{L.workExperience}
            </h2>
            <div className="space-y-3">
              {data.workExperience.map((exp) => (
                <div key={exp.id} className="p-3 rounded-lg" style={{ backgroundColor: `${colors.accent}08` }}>
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-sm" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                    <span className="text-xs flex-shrink-0" style={{ color: colors.secondary, marginInlineStart: '8px' }}>
                      {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{ color: colors.primary }}>
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

        {/* Education & Skills */}
        <div className="grid grid-cols-2 gap-6">
          {data.education.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 flex items-center gap-2" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
                <GraduationCap size={14} />{L.education}
              </h2>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id}>
                    <h3 className="font-bold text-sm" style={{ color: colors.text }}>{edu.degree}</h3>
                    <p className="text-xs font-semibold" style={{ color: colors.accent }}>{edu.institution}</p>
                    <p className="text-xs" style={{ color: colors.secondary }}>
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.skills.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 flex items-center gap-2" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
                <Award size={14} />{L.skills}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, i) => (
                  <span key={i} className="px-2 py-1 text-xs font-bold rounded-md" style={{ backgroundColor: colors.primary, color: ht }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 flex items-center gap-2" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
              <LangIcon size={14} />{L.languages}
            </h2>
            <LanguagesSection 
              languages={data.languages}
              isRTL={isRTL}
              language={language}
              colors={colors}
              variant="badges"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InfographicTemplate;
