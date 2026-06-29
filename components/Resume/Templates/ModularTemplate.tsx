import React from 'react';
import { TemplateProps } from '../../../types';
import { Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { getCvTemplateClass, getCvFontSize, getCvFontFamily, getCvLabels } from './templateUtils';

const ModularTemplate: React.FC<TemplateProps> = ({ data, customization, language }) => {
  const isRTL = language === 'ku' || language === 'ar';
  const L = getCvLabels(language);
  const colors = { primary: '#8b5cf6', accent: '#a78bfa', text: '#1f2937', background: '#f5f3ff', secondary: '#6b7280', headerText: '#ffffff', ...customization.colors };
  const formatDate = (date: string) => {
    if (date === 'present') return L.present;
    if (!date) return '';
    const [year, month] = date.split('-');
    return `${month}/${year}`;
  };

  const cardStyle = { backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderRadius: '12px' };

  return (
    <div className={cn("w-full min-h-[297mm] p-4", getCvTemplateClass(customization))} style={{ '--cv-font-family': getCvFontFamily(customization, isRTL), fontSize: getCvFontSize(customization), backgroundColor: colors.background, color: colors.text } as React.CSSProperties} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="col-span-2 p-5" style={cardStyle}>
          <h1 className="text-3xl font-black mb-1" style={{ color: colors.primary }}>
            {data.personalInfo.fullName || L.yourName}
          </h1>
          {data.personalInfo.title && (
            <p className="text-base font-bold mb-3" style={{ color: colors.accent }}>{data.personalInfo.title}</p>
          )}
          {data.personalInfo.summary && (
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>{data.personalInfo.summary}</p>
          )}
        </div>
        {data.photo ? (
          <div className="p-3 flex items-center justify-center" style={cardStyle}>
            <div className="w-full aspect-square rounded-xl overflow-hidden" style={{ border: `3px solid ${colors.accent}` }}>
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        ) : (
          <div className="p-4" style={cardStyle}>
            <h3 className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: colors.primary }}>
              {L.contact}
            </h3>
            <div className="space-y-1.5 text-xs" style={{ color: colors.text }}>
              {data.personalInfo.email && <div className="flex items-start gap-1.5"><Mail size={10} className="mt-0.5 flex-shrink-0" /><span className="break-all">{data.personalInfo.email}</span></div>}
              {data.personalInfo.phone && <div className="flex items-center gap-1.5"><Phone size={10} className="flex-shrink-0" />{data.personalInfo.phone}</div>}
              {data.personalInfo.address && <div className="flex items-start gap-1.5"><MapPin size={10} className="mt-0.5 flex-shrink-0" />{data.personalInfo.address}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Info Row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {data.photo && (
          <div className="p-4" style={cardStyle}>
            <h3 className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: colors.primary }}>
              {L.contact}
            </h3>
            <div className="space-y-1.5 text-xs" style={{ color: colors.text }}>
              {data.personalInfo.email && <div className="flex items-start gap-1.5"><Mail size={10} className="mt-0.5 flex-shrink-0" /><span className="break-all">{data.personalInfo.email}</span></div>}
              {data.personalInfo.phone && <div className="flex items-center gap-1.5"><Phone size={10} className="flex-shrink-0" />{data.personalInfo.phone}</div>}
              {data.personalInfo.address && <div className="flex items-start gap-1.5"><MapPin size={10} className="mt-0.5 flex-shrink-0" />{data.personalInfo.address}</div>}
            </div>
          </div>
        )}
        {data.skills.length > 0 && (
          <div className="p-4" style={cardStyle}>
            <h3 className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: colors.primary }}>
              {L.skills}
            </h3>
            <div className="flex flex-wrap gap-1">
              {data.skills.map((skill, i) => (
                <span key={i} className="px-2 py-0.5 text-xs font-medium rounded-md" style={{ backgroundColor: `${colors.accent}15`, color: colors.primary, border: `1px solid ${colors.accent}30` }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        {data.languages && data.languages.length > 0 && (
          <div className="p-4" style={cardStyle}>
            <h3 className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: colors.primary }}>
              {L.languages}
            </h3>
            <div className="space-y-1.5 text-xs" style={{ color: colors.text }}>
              {data.languages.map((lang, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="font-medium">{lang.language}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${colors.accent}15`, color: colors.primary }}>
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

      {/* Experience */}
      {data.workExperience.length > 0 && (
        <div className="p-5 mb-3" style={cardStyle}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
            {L.workExperience}
          </h2>
          <div className="space-y-3">
            {data.workExperience.map((exp) => (
              <div key={exp.id} className="pb-3" style={{ borderBottom: `1px solid ${colors.background}` }}>
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="font-bold text-sm" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                  <span className="text-xs flex-shrink-0" style={{ color: colors.secondary, marginInlineStart: '8px' }}>
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </span>
                </div>
                <p className="text-xs font-semibold mb-1" style={{ color: colors.accent }}>
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

      {/* Education */}
      {data.education.length > 0 && (
        <div className="p-5" style={cardStyle}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5" style={{ color: colors.primary, borderBottom: `2px solid ${colors.accent}` }}>
            {L.education}
          </h2>
          <div className="space-y-3">
            {data.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="font-bold text-sm" style={{ color: colors.text }}>{edu.degree}</h3>
                  <span className="text-xs flex-shrink-0" style={{ color: colors.secondary, marginInlineStart: '8px' }}>
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </span>
                </div>
                <p className="text-xs font-semibold" style={{ color: colors.accent }}>
                  {edu.institution} {edu.location && `• ${edu.location}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModularTemplate;
