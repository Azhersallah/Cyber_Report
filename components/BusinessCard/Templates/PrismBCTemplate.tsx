import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const PrismBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#4338ca',
    accent: customization.colors?.accent || '#06b6d4',
    text: customization.colors?.text || '#1e1b4b',
    background: customization.colors?.background || '#ffffff',
    secondary: customization.colors?.secondary || '#6b7280',
    headerText: customization.colors?.headerText || '#ffffff',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full flex relative overflow-hidden" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute left-0 top-0 w-[10px] h-full" style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.accent})` }} />
      <div className="absolute left-[10px] top-0 w-[3px] h-full" style={{ backgroundColor: `${colors.primary}20` }} />
      <div className="flex-1 flex flex-col justify-between p-[16px] pl-[22px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold leading-tight" style={{ color: colors.text, fontSize: scaled(14, s) }}>{data.fullName || 'Your Name'}</h1>
            <p className="mt-[3px] font-semibold uppercase tracking-[0.12em]" style={{ color: colors.primary, fontSize: scaled(8, s) }}>{data.title || 'Job Title'}</p>
            {data.company && <p className="mt-[2px]" style={{ color: colors.secondary, fontSize: scaled(7, s) }}>{data.company}</p>}
          </div>
          {(data.logo || data.photo) && (
            <div className="w-[34px] h-[34px] rounded-lg overflow-hidden flex-shrink-0 border-2" style={{ borderColor: `${colors.primary}25` }}>
              <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-[10px] gap-y-[3px]">
          {data.phone1 && <div className="flex items-center gap-[4px]"><Phone size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone1}</span></div>}
          {data.phone2 && <div className="flex items-center gap-[4px]"><Phone size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone2}</span></div>}
          {data.email && <div className="flex items-center gap-[4px]"><Mail size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.email}</span></div>}
          {data.website && <div className="flex items-center gap-[4px]"><Globe size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.website}</span></div>}
          {data.address && <div className="flex items-center gap-[4px] col-span-2"><MapPin size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.address}</span></div>}
        </div>
      </div>
    </div>
  );
};

export default PrismBCTemplate;
