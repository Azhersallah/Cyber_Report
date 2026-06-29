import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const OceanBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#0c4a6e',
    accent: customization.colors?.accent || '#0ea5e9',
    text: customization.colors?.text || '#0c4a6e',
    background: customization.colors?.background || '#f0f9ff',
    secondary: customization.colors?.secondary || '#64748b',
    headerText: customization.colors?.headerText || '#ffffff',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full flex relative overflow-hidden" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-[42%] h-full relative" style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.accent})` }}>
        <div className="absolute -right-[20px] top-[30%] w-[40px] h-[40px] rounded-full" style={{ backgroundColor: `${colors.background}10` }} />
        <div className="absolute -right-[10px] top-[60%] w-[24px] h-[24px] rounded-full" style={{ backgroundColor: `${colors.background}08` }} />
        <div className="w-full h-full flex flex-col justify-center p-[14px]">
          {(data.logo || data.photo) && (
            <div className="w-[32px] h-[32px] rounded-full overflow-hidden mb-[6px] border-2" style={{ borderColor: `${colors.headerText}30` }}>
              <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <h1 className="font-bold leading-tight" style={{ color: colors.headerText, fontSize: scaled(13, s) }}>{data.fullName || 'Your Name'}</h1>
          <p className="mt-[3px] font-medium uppercase tracking-[0.1em] opacity-90" style={{ color: colors.headerText, fontSize: scaled(7, s) }}>{data.title || 'Job Title'}</p>
          {data.company && <p className="mt-[2px] opacity-70" style={{ color: colors.headerText, fontSize: scaled(6.5, s) }}>{data.company}</p>}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center p-[14px] space-y-[4px]">
        {data.tagline && <p className="italic mb-[3px]" style={{ color: colors.secondary, fontSize: scaled(6.5, s) }}>{data.tagline}</p>}
        {data.phone1 && <div className="flex items-center gap-[5px]"><Phone size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone1}</span></div>}
        {data.phone2 && <div className="flex items-center gap-[5px]"><Phone size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone2}</span></div>}
        {data.email && <div className="flex items-center gap-[5px]"><Mail size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.email}</span></div>}
        {data.website && <div className="flex items-center gap-[5px]"><Globe size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.website}</span></div>}
        {data.address && <div className="flex items-center gap-[5px]"><MapPin size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.address}</span></div>}
      </div>
    </div>
  );
};

export default OceanBCTemplate;
