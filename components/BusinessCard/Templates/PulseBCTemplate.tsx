import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const PulseBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#dc2626',
    accent: customization.colors?.accent || '#ef4444',
    text: customization.colors?.text || '#1f2937',
    background: customization.colors?.background || '#ffffff',
    secondary: customization.colors?.secondary || '#6b7280',
    headerText: customization.colors?.headerText || '#ffffff',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute top-0 right-0 w-[100px] h-[100px]" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`, clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
      <div className="absolute top-0 right-0 w-[60px] h-[60px] opacity-30" style={{ backgroundColor: colors.primary, clipPath: 'polygon(100% 0, 40% 0, 100% 60%)' }} />
      <div className="w-full h-full flex flex-col justify-between p-[16px]">
        <div>
          <div className="flex items-start gap-[10px]">
            {(data.logo || data.photo) && (
              <div className="w-[34px] h-[34px] rounded-lg overflow-hidden flex-shrink-0 border-[1.5px]" style={{ borderColor: `${colors.primary}30` }}>
                <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="font-bold leading-tight" style={{ color: colors.text, fontSize: scaled(14, s) }}>{data.fullName || 'Your Name'}</h1>
              <p className="mt-[2px] font-semibold uppercase tracking-[0.1em]" style={{ color: colors.primary, fontSize: scaled(8, s) }}>{data.title || 'Job Title'}</p>
              {data.company && <p className="mt-[1px]" style={{ color: colors.secondary, fontSize: scaled(7, s) }}>{data.company}</p>}
            </div>
          </div>
        </div>
        <div className="space-y-[3px]">
          <div className="w-full h-[1px] mb-[4px]" style={{ backgroundColor: `${colors.primary}15` }} />
          {data.phone1 && <div className="flex items-center gap-[5px]"><Phone size={7} style={{ color: colors.primary }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone1}</span></div>}
          {data.email && <div className="flex items-center gap-[5px]"><Mail size={7} style={{ color: colors.primary }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.email}</span></div>}
          {data.website && <div className="flex items-center gap-[5px]"><Globe size={7} style={{ color: colors.primary }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.website}</span></div>}
          {data.address && <div className="flex items-center gap-[5px]"><MapPin size={7} style={{ color: colors.primary }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.address}</span></div>}
        </div>
      </div>
    </div>
  );
};

export default PulseBCTemplate;
