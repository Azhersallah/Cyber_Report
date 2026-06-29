import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const ClassicBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#1a1a1a',
    accent: customization.colors?.accent || '#b8860b',
    text: customization.colors?.text || '#2d2d2d',
    background: customization.colors?.background || '#fefdfb',
    secondary: customization.colors?.secondary || '#888888',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center relative p-[16px]" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute inset-[6px] border-[1.5px] rounded-sm" style={{ borderColor: `${colors.accent}40` }} />
      <div className="absolute inset-[10px] border-[0.5px] rounded-sm" style={{ borderColor: `${colors.accent}25` }} />
      {(data.logo || data.photo) && (
        <div className="w-[30px] h-[30px] rounded-full overflow-hidden mb-[5px] border-[1.5px]" style={{ borderColor: colors.accent }}>
          <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <h1 className="font-bold tracking-[0.08em] uppercase leading-tight" style={{ color: colors.primary, fontSize: scaled(14, s) }}>{data.fullName || 'Your Name'}</h1>
      <div className="flex items-center gap-[6px] mt-[3px]">
        <div className="w-[12px] h-[0.5px]" style={{ backgroundColor: colors.accent }} />
        <p className="tracking-[0.2em] uppercase" style={{ color: colors.accent, fontSize: scaled(7, s) }}>{data.title || 'Job Title'}</p>
        <div className="w-[12px] h-[0.5px]" style={{ backgroundColor: colors.accent }} />
      </div>
      {data.company && <p className="mt-[2px]" style={{ color: colors.secondary, fontSize: scaled(7, s) }}>{data.company}</p>}
      <div className="w-[24px] h-[1px] my-[6px]" style={{ backgroundColor: colors.accent }} />
      <div className="space-y-[2px]">
        {(data.phone1 || data.phone2) && <div className="flex items-center justify-center gap-[4px]"><Phone size={6} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(6.5, s) }}>{data.phone1}{data.phone2 ? ` · ${data.phone2}` : ''}</span></div>}
        {data.email && <div className="flex items-center justify-center gap-[4px]"><Mail size={6} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(6.5, s) }}>{data.email}</span></div>}
        {data.website && <div className="flex items-center justify-center gap-[4px]"><Globe size={6} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(6.5, s) }}>{data.website}</span></div>}
        {data.address && <div className="flex items-center justify-center gap-[4px]"><MapPin size={6} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(6.5, s) }}>{data.address}</span></div>}
      </div>
    </div>
  );
};

export default ClassicBCTemplate;
