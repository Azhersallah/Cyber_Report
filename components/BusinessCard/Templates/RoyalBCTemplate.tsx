import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const RoyalBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#1a1a2e',
    accent: customization.colors?.accent || '#d4af37',
    text: customization.colors?.text || '#1a1a2e',
    background: customization.colors?.background || '#fefdfb',
    secondary: customization.colors?.secondary || '#8a7e6b',
    headerText: customization.colors?.headerText || '#ffffff',
  };

  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="h-[4px] flex">
        <div className="flex-1" style={{ backgroundColor: colors.accent }} />
        <div className="w-[30px]" style={{ backgroundColor: colors.primary }} />
        <div className="flex-1" style={{ backgroundColor: colors.accent }} />
      </div>
      <div className="flex-1 flex flex-col justify-between p-[14px] pt-[10px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold leading-tight tracking-tight" style={{ color: colors.primary, fontFamily: font, fontSize: scaled(15, s) }}>
              {data.fullName || 'Your Name'}
            </h1>
            <div className="flex items-center gap-[5px] mt-[3px]">
              <div className="w-[14px] h-[1.5px]" style={{ backgroundColor: colors.accent }} />
              <p className="uppercase tracking-[0.2em] font-semibold" style={{ color: colors.accent, fontSize: scaled(8, s) }}>
                {data.title || 'Job Title'}
              </p>
              <div className="w-[14px] h-[1.5px]" style={{ backgroundColor: colors.accent }} />
            </div>
            {data.company && (
              <p className="mt-[3px] font-medium" style={{ color: colors.secondary, fontSize: scaled(7.5, s) }}>
                {data.company}{data.department ? ` — ${data.department}` : ''}
              </p>
            )}
          </div>
          {(data.logo || data.photo) && (
            <div className="w-[36px] h-[36px] rounded-full overflow-hidden flex-shrink-0 border-[2px]" style={{ borderColor: colors.accent }}>
              <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        {data.tagline && (
          <p className="text-center italic tracking-wide" style={{ color: colors.secondary, fontSize: scaled(6.5, s) }}>
            ✦ {data.tagline} ✦
          </p>
        )}
        <div className="grid grid-cols-2 gap-x-[10px] gap-y-[2px]">
          {data.phone1 && (
            <div className="flex items-center gap-[4px]">
              <Phone size={6} style={{ color: colors.accent }} />
              <span className="text-[7px]" style={{ color: colors.text }}>{data.phone1}</span>
            </div>
          )}
          {data.phone2 && (
            <div className="flex items-center gap-[4px]">
              <Phone size={6} style={{ color: colors.accent }} />
              <span className="text-[7px]" style={{ color: colors.text }}>{data.phone2}</span>
            </div>
          )}
          {data.email && (
            <div className="flex items-center gap-[4px]">
              <Mail size={6} style={{ color: colors.accent }} />
              <span className="text-[7px]" style={{ color: colors.text }}>{data.email}</span>
            </div>
          )}
          {data.website && (
            <div className="flex items-center gap-[4px]">
              <Globe size={6} style={{ color: colors.accent }} />
              <span className="text-[7px]" style={{ color: colors.text }}>{data.website}</span>
            </div>
          )}
          {data.address && (
            <div className="flex items-center gap-[4px] col-span-2">
              <MapPin size={6} style={{ color: colors.accent }} />
              <span className="text-[7px]" style={{ color: colors.secondary }}>{data.address}</span>
            </div>
          )}
        </div>
      </div>
      <div className="h-[4px] flex">
        <div className="flex-1" style={{ backgroundColor: colors.accent }} />
        <div className="w-[30px]" style={{ backgroundColor: colors.primary }} />
        <div className="flex-1" style={{ backgroundColor: colors.accent }} />
      </div>
    </div>
  );
};

export default RoyalBCTemplate;
