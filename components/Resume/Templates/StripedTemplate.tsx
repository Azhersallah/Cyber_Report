import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const StripedTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = { primary: '#0d9488', accent: '#14b8a6', text: '#1f2937', background: '#f0fdfa', secondary: '#6b7280', headerText: '#ffffff', ...customization.colors };
  const formatDate = (date: string) => date === 'present' ? L.present : date.split('-').join('/');

  return (
    <div className={cn("w-full min-h-[297mm]", getCvTemplateClass(customization))} style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex">
        <div className="w-2" style={{ backgroundColor: colors.primary }} />
        <div className="flex-1 p-8">
          <div className="flex items-center gap-4 mb-6">
            {data.photo && <div className="w-24 h-24 rounded-full overflow-hidden border-4" style={{ borderColor: colors.accent }}><img src={data.photo} alt="Profile" className="w-full h-full object-cover" /></div>}
            <div className="flex-1">
              <h1 className="text-3xl font-black mb-2" style={{ color: colors.primary }}>{data.personalInfo.fullName || L.yourName}</h1>
              {data.personalInfo.title && <p className="text-lg font-bold" style={{ color: colors.accent }}>{data.personalInfo.title}</p>}
            </div>
          </div>
          <div className="flex gap-4 text-sm mb-6 pb-4 border-b-2" style={{ color: colors.secondary, borderColor: colors.background }}>
            {data.personalInfo.email && <span className="flex items-center gap-2"><Mail size={14} style={{ color: colors.primary }} />{data.personalInfo.email}</span>}
            {data.personalInfo.phone && <span className="flex items-center gap-2"><Phone size={14} style={{ color: colors.primary }} />{data.personalInfo.phone}</span>}
            {data.personalInfo.address && <span className="flex items-center gap-2"><MapPin size={14} style={{ color: colors.primary }} />{data.personalInfo.address}</span>}
          </div>
          {data.personalInfo.summary && (
            <div className="mb-6 p-4 border-l-4" style={{ backgroundColor: colors.background, borderColor: colors.accent }}>
              <p className="text-sm leading-relaxed" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
            </div>
          )}
          {data.workExperience.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-1" style={{ backgroundColor: colors.primary }} />
                <h2 className="text-lg font-black uppercase" style={{ color: colors.primary }}>{L.experience}</h2>
              </div>
              {data.workExperience.map((exp) => (
                <div key={exp.id} className="mb-4 pl-4 border-l-2" style={{ borderColor: colors.accent }}>
                  <div className="flex justify-between mb-1">
                    <h3 className="font-bold text-base" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                    <span className="text-sm font-bold" style={{ color: colors.accent }}>{formatDate(exp.startDate)} - {formatDate(exp.endDate)}</span>
                  </div>
                  <p className="font-bold mb-2 text-sm" style={{ color: colors.primary }}>{exp.company}</p>
                  {exp.description && <p className="text-sm leading-relaxed" style={{ color: colors.text }}>{exp.description}</p>}
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-6">
            {data.education.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-1" style={{ backgroundColor: colors.primary }} />
                  <h2 className="text-lg font-black uppercase" style={{ color: colors.primary }}>{L.education}</h2>
                </div>
                {data.education.map((edu) => (
                  <div key={edu.id} className="mb-3">
                    <h3 className="font-bold text-sm" style={{ color: colors.text }}>{edu.degree}</h3>
                    <p className="text-sm font-semibold" style={{ color: colors.accent }}>{edu.institution}</p>
                    <p className="text-xs" style={{ color: colors.secondary }}>{formatDate(edu.startDate)} - {formatDate(edu.endDate)}</p>
                  </div>
                ))}
              </div>
            )}
            <div>
              {data.skills.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-1" style={{ backgroundColor: colors.primary }} />
                    <h2 className="text-lg font-black uppercase" style={{ color: colors.primary }}>{L.skills}</h2>
                  </div>
                  <div className="space-y-2">
                    {data.skills.map((skill, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }} />
                        <span className="text-sm font-medium" style={{ color: colors.text }}>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.languages && data.languages.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-1" style={{ backgroundColor: colors.primary }} />
                    <h2 className="text-lg font-black uppercase" style={{ color: colors.primary }}>{L.languages}</h2>
                  </div>
                  <div className="space-y-2">
                    {data.languages.map((lang, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm font-medium" style={{ color: colors.text }}>{lang.language}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ 
                          backgroundColor: colors.background,
                          color: colors.primary
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
    </div>
  );
};

export default StripedTemplate;
