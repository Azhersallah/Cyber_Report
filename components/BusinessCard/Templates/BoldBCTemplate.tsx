import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const BoldBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#18181b',
    accent: customization.colors?.accent || '#06b6d4',
    text: customization.colors?.text || '#e4e4e7',
    background: customization.colors?.background || '#18181b',
    secondary: customization.colors?.secondary || '#71717a',
    headerText: customization.colors?.headerText || '#ffffff',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full flex flex-col justify-between p-[16px] relative overflow-hidden" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute top-0 left-0 w-[120px] h-[120px] rounded-full opacity-[0.06]" style={{ backgroundColor: colors.accent, filter: 'blur(30px)' }} />
      <div className="absolute bottom-0 right-0 w-[80px] h-[80px] rounded-full opacity-[0.04]" style={{ backgroundColor: colors.accent, filter: 'blur(20px)' }} />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-black leading-none tracking-tight" style={{ color: colors.headerText, fontSize: scaled(18, s) }}>{data.fullName || 'Your Name'}</h1>
          <p className="mt-[4px] font-semibold uppercase tracking-[0.15em]" style={{ color: colors.accent, fontSize: scaled(8, s) }}>{data.title || 'Job Title'}</p>
          {data.company && <p className="mt-[2px]" style={{ color: colors.secondary, fontSize: scaled(7, s) }}>{data.company}</p>}
        </div>
        {(data.logo || data.photo) && (
          <div className="w-[34px] h-[34px] rounded-lg overflow-hidden flex-shrink-0 border-[1.5px]" style={{ borderColor: `${colors.accent}50` }}>
            <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      <div className="flex gap-[16px]">
        <div className="space-y-[3px]">
          {data.phone1 && <div className="flex items-center gap-[4px]"><Phone size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone1}</span></div>}
          {data.phone2 && <div className="flex items-center gap-[4px]"><Phone size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone2}</span></div>}
          {data.email && <div className="flex items-center gap-[4px]"><Mail size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.email}</span></div>}
        </div>
        <div className="space-y-[3px]">
          {data.website && <div className="flex items-center gap-[4px]"><Globe size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.website}</span></div>}
          {data.address && <div className="flex items-center gap-[4px]"><MapPin size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.address}</span></div>}
        </div>
      </div>
    </div>
  );
};

export default BoldBCTemplate;
