import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const SlateBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#1e293b',
    accent: customization.colors?.accent || '#f59e0b',
    text: customization.colors?.text || '#cbd5e1',
    background: customization.colors?.background || '#0f172a',
    secondary: customization.colors?.secondary || '#64748b',
    headerText: customization.colors?.headerText || '#ffffff',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full flex flex-col justify-between p-[16px] relative overflow-hidden" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${colors.accent}, transparent)` }} />
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold leading-tight tracking-tight" style={{ color: colors.headerText, fontSize: scaled(14, s) }}>{data.fullName || 'Your Name'}</h1>
            <p className="mt-[3px] font-medium tracking-[0.12em] uppercase" style={{ color: colors.accent, fontSize: scaled(7.5, s) }}>{data.title || 'Job Title'}</p>
            {data.company && <p className="mt-[2px]" style={{ color: colors.secondary, fontSize: scaled(7, s) }}>{data.company}</p>}
          </div>
          {(data.logo || data.photo) && (
            <div className="w-[32px] h-[32px] rounded-md overflow-hidden flex-shrink-0 border-[1.5px]" style={{ borderColor: `${colors.accent}40` }}>
              <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        {data.tagline && <p className="mt-[5px] italic" style={{ color: colors.secondary, fontSize: scaled(6.5, s) }}>{data.tagline}</p>}
      </div>
      <div className="space-y-[3px]">
        <div className="w-[30px] h-[1px] mb-[5px]" style={{ backgroundColor: `${colors.accent}30` }} />
        {data.phone1 && <div className="flex items-center gap-[5px]"><Phone size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone1}</span></div>}
        {data.email && <div className="flex items-center gap-[5px]"><Mail size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.email}</span></div>}
        {data.website && <div className="flex items-center gap-[5px]"><Globe size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.website}</span></div>}
        {data.address && <div className="flex items-center gap-[5px]"><MapPin size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.address}</span></div>}
      </div>
    </div>
  );
};

export default SlateBCTemplate;
