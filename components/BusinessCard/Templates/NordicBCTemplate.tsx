import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const NordicBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#1a1a1a',
    accent: customization.colors?.accent || '#e5e5e5',
    text: customization.colors?.text || '#374151',
    background: customization.colors?.background || '#fafafa',
    secondary: customization.colors?.secondary || '#9ca3af',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full flex flex-col justify-center p-[20px]" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-start justify-between mb-[12px]">
        <div>
          <h1 className="font-semibold leading-tight" style={{ color: colors.primary, fontSize: scaled(15, s) }}>{data.fullName || 'Your Name'}</h1>
          <p className="mt-[3px] tracking-[0.08em]" style={{ color: colors.secondary, fontSize: scaled(8, s) }}>{data.title || 'Job Title'}</p>
        </div>
        {(data.logo || data.photo) && (
          <div className="w-[30px] h-[30px] rounded-sm overflow-hidden flex-shrink-0 opacity-90">
            <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      <div className="w-full h-[1px] mb-[10px]" style={{ backgroundColor: colors.accent }} />
      <div className="flex justify-between">
        <div className="space-y-[3px]">
          {data.phone1 && <p style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone1}</p>}
          {data.email && <p style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.email}</p>}
          {data.website && <p style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.website}</p>}
        </div>
        <div className="space-y-[3px] text-right">
          {data.company && <p className="font-medium" style={{ color: colors.primary, fontSize: scaled(7, s) }}>{data.company}</p>}
          {data.address && <p style={{ color: colors.secondary, fontSize: scaled(7, s) }}>{data.address}</p>}
        </div>
      </div>
    </div>
  );
};

export default NordicBCTemplate;
