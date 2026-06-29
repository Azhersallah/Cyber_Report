import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

/* Corporate - Professional with accent band */
const CorporateBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#0f4c75',
    accent: customization.colors?.accent || '#3282b8',
    text: customization.colors?.text || '#1b262c',
    background: customization.colors?.background || '#ffffff',
    secondary: customization.colors?.secondary || '#6b7280',
    headerText: customization.colors?.headerText || '#ffffff',
  };

  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top header bar with company */}
      <div className="px-[16px] py-[8px] flex items-center justify-between" style={{ backgroundColor: colors.primary }}>
        <div className="flex items-center gap-[8px]">
          {data.logo && (
            <div className="w-[22px] h-[22px] rounded overflow-hidden flex-shrink-0">
              <img src={data.logo} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <p className="font-bold tracking-wide uppercase" style={{ color: colors.headerText, fontSize: scaled(9, s) }}>
              {data.company || 'Company Name'}
            </p>
            {data.tagline && (
              <p className="opacity-75 tracking-wider" style={{ color: colors.headerText, fontSize: scaled(6, s) }}>
                {data.tagline}
              </p>
            )}
          </div>
        </div>
        {data.department && (
          <span className="px-[6px] py-[2px] rounded-full uppercase tracking-wider" style={{ backgroundColor: `${colors.headerText}20`, color: colors.headerText, fontSize: scaled(6, s) }}>
            {data.department}
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 px-[16px] py-[8px] flex items-end justify-between">
        {/* Left - Personal info */}
        <div>
          <h1 className="font-bold leading-tight" style={{ color: colors.text, fontSize: scaled(13, s) }}>
            {data.fullName || 'Your Name'}
          </h1>
          <p className="font-medium mt-[1px]" style={{ color: colors.accent, fontSize: scaled(8, s) }}>
            {data.title || 'Job Title'}
          </p>
          
          {data.photo && (
            <div className="w-[26px] h-[26px] rounded-full overflow-hidden mt-[4px] border-[1.5px]" style={{ borderColor: colors.accent }}>
              <img src={data.photo} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Right - Contact */}
        <div className="space-y-[2px] text-right">
          {data.phone1 && (
            <div className="flex items-center justify-end gap-[3px]">
              <span className="text-[7px]" style={{ color: colors.text }}>{data.phone1}</span>
              <Phone size={6} style={{ color: colors.accent }} />
            </div>
          )}
          {data.phone2 && (
            <div className="flex items-center justify-end gap-[3px]">
              <span className="text-[7px]" style={{ color: colors.text }}>{data.phone2}</span>
              <Phone size={6} style={{ color: colors.accent }} />
            </div>
          )}
          {data.email && (
            <div className="flex items-center justify-end gap-[3px]">
              <span className="text-[7px]" style={{ color: colors.text }}>{data.email}</span>
              <Mail size={6} style={{ color: colors.accent }} />
            </div>
          )}
          {data.website && (
            <div className="flex items-center justify-end gap-[3px]">
              <span className="text-[7px]" style={{ color: colors.text }}>{data.website}</span>
              <Globe size={6} style={{ color: colors.accent }} />
            </div>
          )}
          {data.address && (
            <div className="flex items-center justify-end gap-[3px]">
              <span className="text-[7px]" style={{ color: colors.secondary }}>{data.address}</span>
              <MapPin size={6} style={{ color: colors.accent }} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-[3px]" style={{ backgroundColor: colors.accent }} />
    </div>
  );
};

export default CorporateBCTemplate;
