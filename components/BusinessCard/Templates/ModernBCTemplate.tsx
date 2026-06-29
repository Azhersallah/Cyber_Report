import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const ModernBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const isRTL = language === 'ku' || language === 'ar';
  const colors = {
    primary: customization.colors?.primary || '#0f172a',
    accent: customization.colors?.accent || '#c9a227',
    text: customization.colors?.text || '#1e293b',
    background: customization.colors?.background || '#ffffff',
    secondary: customization.colors?.secondary || '#64748b',
    headerText: customization.colors?.headerText || '#ffffff',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full flex" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-[38%] h-full relative overflow-hidden flex flex-col justify-center p-[14px]" style={{ background: `linear-gradient(160deg, ${colors.primary}, ${colors.primary}dd)` }}>
        <div className={`absolute top-0 ${isRTL ? 'left' : 'right'}-0 w-[3px] h-full`} style={{ backgroundColor: colors.accent }} />
        <div className={`absolute -bottom-[30px] ${isRTL ? '-right' : '-left'}-[30px] w-[80px] h-[80px] rounded-full`} style={{ backgroundColor: `${colors.accent}12` }} />
        {(data.logo || data.photo) && (
          <div className="w-[36px] h-[36px] rounded-full overflow-hidden mb-[8px] border-2" style={{ borderColor: `${colors.accent}60` }}>
            <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="font-bold leading-tight" style={{ color: colors.headerText, fontSize: scaled(13, s) }}>{data.fullName || 'Your Name'}</h1>
        <p className="mt-[3px] font-medium uppercase tracking-[0.1em]" style={{ color: colors.accent, fontSize: scaled(7, s) }}>{data.title || 'Job Title'}</p>
        {data.company && <p className="mt-[2px] opacity-70" style={{ color: colors.headerText, fontSize: scaled(6.5, s) }}>{data.company}</p>}
      </div>
      <div className="flex-1 flex flex-col justify-center p-[14px] space-y-[4px]">
        {data.tagline && <p className="italic mb-[4px] leading-tight" style={{ color: colors.secondary, fontSize: scaled(6.5, s) }}>"{data.tagline}"</p>}
        {data.phone1 && <div className="flex items-center gap-[5px]"><Phone size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone1}</span></div>}
        {data.phone2 && <div className="flex items-center gap-[5px]"><Phone size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone2}</span></div>}
        {data.email && <div className="flex items-center gap-[5px]"><Mail size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.email}</span></div>}
        {data.website && <div className="flex items-center gap-[5px]"><Globe size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.website}</span></div>}
        {data.address && <div className="flex items-center gap-[5px]"><MapPin size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.address}</span></div>}
      </div>
    </div>
  );
};

export default ModernBCTemplate;
