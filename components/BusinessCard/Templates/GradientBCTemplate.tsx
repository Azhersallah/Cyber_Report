import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const GradientBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#4f46e5',
    accent: customization.colors?.accent || '#7c3aed',
    text: customization.colors?.text || '#1e1b4b',
    background: customization.colors?.background || '#ffffff',
    secondary: customization.colors?.secondary || '#6b7280',
    headerText: customization.colors?.headerText || '#ffffff',
  };

  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="h-[42%] flex items-center px-[16px] relative" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}>
        <div className="absolute -right-[15px] -top-[15px] w-[50px] h-[50px] rounded-full opacity-15" style={{ backgroundColor: '#ffffff' }} />
        <div className="absolute right-[20px] bottom-[5px] w-[25px] h-[25px] rounded-full opacity-10" style={{ backgroundColor: '#ffffff' }} />
        <div className="flex items-center gap-[10px] z-10">
          {(data.photo || data.logo) && (
            <div className="w-[32px] h-[32px] rounded-full overflow-hidden flex-shrink-0 border-2 border-white/30">
              <img src={data.photo || data.logo || ''} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h1 className="font-bold leading-tight" style={{ color: colors.headerText, fontSize: scaled(13, s) }}>
              {data.fullName || 'Your Name'}
            </h1>
            <p className="font-medium mt-[1px] opacity-85" style={{ color: colors.headerText, fontSize: scaled(8, s) }}>
              {data.title || 'Job Title'}{data.company ? ` — ${data.company}` : ''}
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 px-[16px] py-[8px] flex items-center">
        <div className="flex gap-[16px] w-full">
          <div className="space-y-[3px] flex-1">
            {data.phone1 && (
              <div className="flex items-center gap-[4px]">
                <Phone size={7} style={{ color: colors.primary }} />
                <span className="text-[7px]" style={{ color: colors.text }}>{data.phone1}</span>
              </div>
            )}
            {data.phone2 && (
              <div className="flex items-center gap-[4px]">
                <Phone size={7} style={{ color: colors.primary }} />
                <span className="text-[7px]" style={{ color: colors.text }}>{data.phone2}</span>
              </div>
            )}
            {data.email && (
              <div className="flex items-center gap-[4px]">
                <Mail size={7} style={{ color: colors.primary }} />
                <span className="text-[7px]" style={{ color: colors.text }}>{data.email}</span>
              </div>
            )}
          </div>
          <div className="space-y-[3px] flex-1">
            {data.website && (
              <div className="flex items-center gap-[4px]">
                <Globe size={7} style={{ color: colors.primary }} />
                <span className="text-[7px]" style={{ color: colors.text }}>{data.website}</span>
              </div>
            )}
            {data.address && (
              <div className="flex items-center gap-[4px]">
                <MapPin size={7} style={{ color: colors.primary }} />
                <span className="text-[7px]" style={{ color: colors.text }}>{data.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradientBCTemplate;
