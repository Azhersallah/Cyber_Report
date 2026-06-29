import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const StripesBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#0d9488',
    accent: customization.colors?.accent || '#14b8a6',
    text: customization.colors?.text || '#134e4a',
    background: customization.colors?.background || '#ffffff',
    secondary: customization.colors?.secondary || '#6b7280',
    headerText: customization.colors?.headerText || '#ffffff',
  };

  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;

  return (
    <div className="w-full h-full flex relative overflow-hidden" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-[8px] flex-shrink-0 flex flex-col">
        <div className="flex-1" style={{ backgroundColor: colors.primary }} />
        <div className="flex-1" style={{ backgroundColor: colors.accent }} />
        <div className="flex-1" style={{ backgroundColor: colors.primary }} />
      </div>
      <div className="flex-1 flex flex-col justify-between p-[14px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-extrabold leading-tight" style={{ color: colors.primary, fontSize: scaled(14, s) }}>
              {data.fullName || 'Your Name'}
            </h1>
            <p className="font-semibold mt-[2px] uppercase tracking-[0.15em]" style={{ color: colors.accent, fontSize: scaled(8, s) }}>
              {data.title || 'Job Title'}
            </p>
            {data.company && (
              <p className="mt-[2px]" style={{ color: colors.secondary, fontSize: scaled(7, s) }}>
                {data.company}{data.department ? ` | ${data.department}` : ''}
              </p>
            )}
          </div>
          {(data.logo || data.photo) && (
            <div className="w-[34px] h-[34px] rounded-lg overflow-hidden flex-shrink-0 border-2" style={{ borderColor: `${colors.accent}40` }}>
              <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-[8px] gap-y-[2px]">
          {data.phone1 && (
            <div className="flex items-center gap-[3px]">
              <Phone size={6} style={{ color: colors.accent }} />
              <span className="text-[7px]" style={{ color: colors.text }}>{data.phone1}</span>
            </div>
          )}
          {data.phone2 && (
            <div className="flex items-center gap-[3px]">
              <Phone size={6} style={{ color: colors.accent }} />
              <span className="text-[7px]" style={{ color: colors.text }}>{data.phone2}</span>
            </div>
          )}
          {data.email && (
            <div className="flex items-center gap-[3px]">
              <Mail size={6} style={{ color: colors.accent }} />
              <span className="text-[7px]" style={{ color: colors.text }}>{data.email}</span>
            </div>
          )}
          {data.website && (
            <div className="flex items-center gap-[3px]">
              <Globe size={6} style={{ color: colors.accent }} />
              <span className="text-[7px]" style={{ color: colors.text }}>{data.website}</span>
            </div>
          )}
          {data.address && (
            <div className="flex items-center gap-[3px] col-span-2">
              <MapPin size={6} style={{ color: colors.accent }} />
              <span className="text-[7px]" style={{ color: colors.text }}>{data.address}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StripesBCTemplate;
