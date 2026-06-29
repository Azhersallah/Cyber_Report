import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const EmberBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#9a3412',
    accent: customization.colors?.accent || '#ea580c',
    text: customization.colors?.text || '#1c1917',
    background: customization.colors?.background || '#fffbeb',
    secondary: customization.colors?.secondary || '#78716c',
    headerText: customization.colors?.headerText || '#ffffff',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="h-[5px]" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent}, ${colors.primary})` }} />
      <div className="flex-1 flex flex-col justify-between p-[14px]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-[8px]">
            {(data.logo || data.photo) && (
              <div className="w-[32px] h-[32px] rounded-full overflow-hidden flex-shrink-0 border-2" style={{ borderColor: `${colors.accent}40` }}>
                <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="font-bold leading-tight" style={{ color: colors.text, fontSize: scaled(14, s) }}>{data.fullName || 'Your Name'}</h1>
              <p className="mt-[2px] font-medium" style={{ color: colors.accent, fontSize: scaled(8, s) }}>{data.title || 'Job Title'}</p>
            </div>
          </div>
          {data.company && (
            <div className="px-[6px] py-[2px] rounded-full" style={{ backgroundColor: `${colors.accent}15` }}>
              <span className="font-medium" style={{ color: colors.primary, fontSize: scaled(6.5, s) }}>{data.company}</span>
            </div>
          )}
        </div>
        {data.tagline && <p className="italic mt-[4px]" style={{ color: colors.secondary, fontSize: scaled(6.5, s) }}>{data.tagline}</p>}
        <div className="grid grid-cols-2 gap-x-[10px] gap-y-[3px]">
          {data.phone1 && <div className="flex items-center gap-[4px]"><Phone size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone1}</span></div>}
          {data.email && <div className="flex items-center gap-[4px]"><Mail size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.email}</span></div>}
          {data.website && <div className="flex items-center gap-[4px]"><Globe size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.website}</span></div>}
          {data.address && <div className="flex items-center gap-[4px]"><MapPin size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.address}</span></div>}
        </div>
      </div>
    </div>
  );
};

export default EmberBCTemplate;
