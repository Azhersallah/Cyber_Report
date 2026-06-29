import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const IvoryBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#292524',
    accent: customization.colors?.accent || '#a8a29e',
    text: customization.colors?.text || '#44403c',
    background: customization.colors?.background || '#faf5f0',
    secondary: customization.colors?.secondary || '#78716c',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-[18px] relative" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[40px] h-[1px]" style={{ backgroundColor: colors.accent }} />
      {(data.logo || data.photo) && (
        <div className="w-[28px] h-[28px] rounded-full overflow-hidden mb-[6px] border-[1px]" style={{ borderColor: colors.accent }}>
          <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <h1 className="font-bold tracking-[0.05em] leading-tight" style={{ color: colors.primary, fontSize: scaled(15, s) }}>{data.fullName || 'Your Name'}</h1>
      <p className="mt-[3px] italic tracking-wide" style={{ color: colors.secondary, fontSize: scaled(8, s) }}>{data.title || 'Job Title'}</p>
      {data.company && <p className="mt-[1px] font-medium" style={{ color: colors.accent, fontSize: scaled(7.5, s) }}>{data.company}</p>}
      {data.tagline && <p className="mt-[4px] italic" style={{ color: colors.secondary, fontSize: scaled(6, s) }}>— {data.tagline} —</p>}
      <div className="w-[20px] h-[1px] my-[6px]" style={{ backgroundColor: colors.accent }} />
      <div className="space-y-[2px]">
        {(data.phone1 || data.phone2) && <p style={{ color: colors.text, fontSize: scaled(6.5, s) }}>{data.phone1}{data.phone2 ? ` · ${data.phone2}` : ''}</p>}
        {data.email && <p style={{ color: colors.text, fontSize: scaled(6.5, s) }}>{data.email}</p>}
        {data.website && <p style={{ color: colors.text, fontSize: scaled(6.5, s) }}>{data.website}</p>}
        {data.address && <p style={{ color: colors.secondary, fontSize: scaled(6.5, s) }}>{data.address}</p>}
      </div>
      <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 w-[40px] h-[1px]" style={{ backgroundColor: colors.accent }} />
    </div>
  );
};

export default IvoryBCTemplate;
