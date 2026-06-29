import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const ElegantBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#1c1c1c',
    accent: customization.colors?.accent || '#b76e79',
    text: customization.colors?.text || '#2d2d2d',
    background: customization.colors?.background || '#faf9f7',
    secondary: customization.colors?.secondary || '#8a8a8a',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full flex flex-col justify-between p-[18px] relative" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute top-[7px] left-[7px] w-[14px] h-[14px] border-t-[1.5px] border-l-[1.5px]" style={{ borderColor: colors.accent }} />
      <div className="absolute top-[7px] right-[7px] w-[14px] h-[14px] border-t-[1.5px] border-r-[1.5px]" style={{ borderColor: colors.accent }} />
      <div className="absolute bottom-[7px] left-[7px] w-[14px] h-[14px] border-b-[1.5px] border-l-[1.5px]" style={{ borderColor: colors.accent }} />
      <div className="absolute bottom-[7px] right-[7px] w-[14px] h-[14px] border-b-[1.5px] border-r-[1.5px]" style={{ borderColor: colors.accent }} />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold tracking-tight leading-tight" style={{ color: colors.primary, fontSize: scaled(15, s) }}>{data.fullName || 'Your Name'}</h1>
          <div className="flex items-center gap-[5px] mt-[3px]">
            <div className="w-[14px] h-[1px]" style={{ backgroundColor: colors.accent }} />
            <p className="italic tracking-wide" style={{ color: colors.accent, fontSize: scaled(8, s) }}>{data.title || 'Job Title'}</p>
          </div>
          {data.company && <p className="mt-[2px]" style={{ color: colors.secondary, fontSize: scaled(7, s) }}>{data.company}{data.department ? ` · ${data.department}` : ''}</p>}
        </div>
        {(data.logo || data.photo) && (
          <div className="w-[34px] h-[34px] rounded-full overflow-hidden flex-shrink-0 border-[1.5px]" style={{ borderColor: colors.accent }}>
            <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      {data.tagline && <p className="text-center italic my-[2px]" style={{ color: colors.secondary, fontSize: scaled(6.5, s) }}>— {data.tagline} —</p>}
      <div className="flex justify-between items-end">
        <div className="space-y-[2px]">
          {(data.phone1 || data.phone2) && <div className="flex items-center gap-[4px]"><Phone size={6} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone1}{data.phone2 ? ` | ${data.phone2}` : ''}</span></div>}
          {data.email && <div className="flex items-center gap-[4px]"><Mail size={6} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.email}</span></div>}
        </div>
        <div className="space-y-[2px] text-right">
          {data.website && <div className="flex items-center justify-end gap-[4px]"><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.website}</span><Globe size={6} style={{ color: colors.accent }} /></div>}
          {data.address && <div className="flex items-center justify-end gap-[4px]"><span style={{ color: colors.secondary, fontSize: scaled(7, s) }}>{data.address}</span><MapPin size={6} style={{ color: colors.accent }} /></div>}
        </div>
      </div>
    </div>
  );
};

export default ElegantBCTemplate;
