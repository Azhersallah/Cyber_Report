import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

/* Minimal - Ultra clean whitespace-heavy design */

const MinimalBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#111111',
    accent: customization.colors?.accent || '#111111',
    text: customization.colors?.text || '#333333',
    background: customization.colors?.background || '#ffffff',
    secondary: customization.colors?.secondary || '#999999',
  };

  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;

  return (
    <div className="w-full h-full flex flex-col justify-between p-[18px]" style={{ backgroundColor: colors.background, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top - Name & Title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-light tracking-tight leading-tight" style={{ color: colors.primary, fontSize: scaled(16, s) }}>
            {data.fullName || 'Your Name'}
          </h1>
          <p className="mt-[3px] tracking-[0.1em] uppercase" style={{ color: colors.secondary, fontSize: scaled(8, s) }}>
            {data.title || 'Job Title'}
          </p>
        </div>
        {(data.logo || data.photo) && (
          <div className="w-[28px] h-[28px] rounded-sm overflow-hidden flex-shrink-0 opacity-80">
            <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Bottom - Contact */}
      <div className="flex justify-between items-end">
        <div className="space-y-[2px]">
          {data.phone1 && <p style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone1}</p>}
          {data.phone2 && <p style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone2}</p>}
          {data.email && <p style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.email}</p>}
        </div>
        <div className="space-y-[2px] text-right">
          {data.website && <p style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.website}</p>}
          {data.address && <p style={{ color: colors.secondary, fontSize: scaled(7, s) }}>{data.address}</p>}
          {data.company && <p className="font-medium" style={{ color: colors.primary, fontSize: scaled(7, s) }}>{data.company}</p>}
        </div>
      </div>
    </div>
  );
};

export default MinimalBCTemplate;
