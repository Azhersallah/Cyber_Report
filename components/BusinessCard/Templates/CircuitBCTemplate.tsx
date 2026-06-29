import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const CircuitBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#059669',
    accent: customization.colors?.accent || '#34d399',
    text: customization.colors?.text || '#064e3b',
    background: customization.colors?.background || '#ffffff',
    secondary: customization.colors?.secondary || '#6b7280',
    headerText: customization.colors?.headerText || '#ffffff',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute top-[12px] right-[12px] grid grid-cols-5 gap-[4px] opacity-[0.12]">
        {Array(15).fill(0).map((_, i) => <div key={i} className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: colors.primary }} />)}
      </div>
      <div className="absolute bottom-[12px] left-[12px] grid grid-cols-3 gap-[4px] opacity-[0.08]">
        {Array(6).fill(0).map((_, i) => <div key={i} className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: colors.primary }} />)}
      </div>
      <div className="flex-1 flex flex-col justify-between p-[16px]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-[8px]">
            {(data.logo || data.photo) && (
              <div className="w-[32px] h-[32px] rounded-md overflow-hidden flex-shrink-0 border-[1.5px]" style={{ borderColor: `${colors.primary}30` }}>
                <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="font-bold leading-tight" style={{ color: colors.text, fontSize: scaled(14, s) }}>{data.fullName || 'Your Name'}</h1>
              <p className="mt-[2px] font-semibold uppercase tracking-[0.1em]" style={{ color: colors.primary, fontSize: scaled(8, s) }}>{data.title || 'Job Title'}</p>
            </div>
          </div>
          {data.company && <span className="font-medium" style={{ color: colors.secondary, fontSize: scaled(7, s) }}>{data.company}</span>}
        </div>
        <div className="space-y-[3px]">
          <div className="w-full h-[1px] mb-[5px]" style={{ background: `linear-gradient(90deg, ${colors.primary}20, transparent)` }} />
          {data.phone1 && <div className="flex items-center gap-[5px]"><Phone size={7} style={{ color: colors.primary }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone1}</span></div>}
          {data.email && <div className="flex items-center gap-[5px]"><Mail size={7} style={{ color: colors.primary }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.email}</span></div>}
          {data.website && <div className="flex items-center gap-[5px]"><Globe size={7} style={{ color: colors.primary }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.website}</span></div>}
          {data.address && <div className="flex items-center gap-[5px]"><MapPin size={7} style={{ color: colors.primary }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.address}</span></div>}
        </div>
      </div>
    </div>
  );
};

export default CircuitBCTemplate;
