import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const HorizonBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#7c3aed',
    accent: customization.colors?.accent || '#a78bfa',
    text: customization.colors?.text || '#1f2937',
    background: customization.colors?.background || '#ffffff',
    secondary: customization.colors?.secondary || '#6b7280',
    headerText: customization.colors?.headerText || '#ffffff',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex-1 flex items-center px-[16px] pt-[10px]">
        <div className="flex items-start justify-between w-full">
          <div>
            <h1 className="font-bold leading-tight" style={{ color: colors.text, fontSize: scaled(14, s) }}>{data.fullName || 'Your Name'}</h1>
            <p className="mt-[2px] font-medium" style={{ color: colors.primary, fontSize: scaled(8, s) }}>{data.title || 'Job Title'}</p>
            {data.company && <p className="mt-[1px]" style={{ color: colors.secondary, fontSize: scaled(7, s) }}>{data.company}</p>}
          </div>
          {(data.logo || data.photo) && (
            <div className="w-[34px] h-[34px] rounded-full overflow-hidden flex-shrink-0 border-2" style={{ borderColor: `${colors.primary}30` }}>
              <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
      <div className="h-[40%] relative" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}>
        <div className="absolute inset-0 flex items-center px-[16px]">
          <div className="flex gap-[16px] w-full">
            <div className="space-y-[3px]">
              {data.phone1 && <div className="flex items-center gap-[4px]"><Phone size={7} style={{ color: `${colors.headerText}90` }} /><span style={{ color: colors.headerText, fontSize: scaled(7, s) }}>{data.phone1}</span></div>}
              {data.phone2 && <div className="flex items-center gap-[4px]"><Phone size={7} style={{ color: `${colors.headerText}90` }} /><span style={{ color: colors.headerText, fontSize: scaled(7, s) }}>{data.phone2}</span></div>}
              {data.email && <div className="flex items-center gap-[4px]"><Mail size={7} style={{ color: `${colors.headerText}90` }} /><span style={{ color: colors.headerText, fontSize: scaled(7, s) }}>{data.email}</span></div>}
            </div>
            <div className="space-y-[3px]">
              {data.website && <div className="flex items-center gap-[4px]"><Globe size={7} style={{ color: `${colors.headerText}90` }} /><span style={{ color: colors.headerText, fontSize: scaled(7, s) }}>{data.website}</span></div>}
              {data.address && <div className="flex items-center gap-[4px]"><MapPin size={7} style={{ color: `${colors.headerText}90` }} /><span style={{ color: colors.headerText, fontSize: scaled(7, s) }}>{data.address}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HorizonBCTemplate;
