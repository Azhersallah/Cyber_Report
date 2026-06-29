import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const DiagonalBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, side = 'front' }) => {
  const s = getFontScale(customization);
  const font = customization.fontFamily || 'Inter, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#1e3a5f',
    accent: customization.colors?.accent || '#ff6b35',
    text: customization.colors?.text || '#1e3a5f',
    background: customization.colors?.background || '#ffffff',
    secondary: customization.colors?.secondary || '#6b7280',
    headerText: customization.colors?.headerText || '#ffffff',
  };

  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: colors.background, fontFamily: font }}>
      {/* Diagonal shape */}
      <div
        className="absolute top-0 left-0 w-[55%] h-full"
        style={{
          backgroundColor: colors.primary,
          clipPath: 'polygon(0 0, 100% 0, 75% 100%, 0 100%)',
        }}
      />
      {/* Accent diagonal stripe */}
      <div
        className="absolute top-0 w-[8px] h-full"
        style={{
          backgroundColor: colors.accent,
          left: '52%',
          clipPath: 'polygon(0 0, 100% 0, 75% 100%, 0 100%)',
        }}
      />

      {/* Left content - on dark bg */}
      <div className="absolute top-0 left-0 w-[48%] h-full flex flex-col justify-center p-[14px]">
        {(data.photo || data.logo) && (
          <div className="w-[30px] h-[30px] rounded-full overflow-hidden mb-[6px] border-2" style={{ borderColor: `${colors.accent}` }}>
            <img src={data.photo || data.logo || ''} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="font-bold leading-tight" style={{ color: colors.headerText, fontSize: scaled(13, s) }}>
          {data.fullName || 'Your Name'}
        </h1>
        <p className="mt-[2px] font-medium uppercase tracking-wider opacity-85" style={{ color: colors.accent, fontSize: scaled(7.5, s) }}>
          {data.title || 'Job Title'}
        </p>
        {data.company && (
          <p className="mt-[1px] opacity-70" style={{ color: colors.headerText, fontSize: scaled(7, s) }}>
            {data.company}
          </p>
        )}
      </div>

      {/* Right content - contact info */}
      <div className="absolute top-0 right-0 w-[44%] h-full flex flex-col justify-center p-[14px] space-y-[4px]">
        {data.phone1 && (
          <div className="flex items-center gap-[4px]">
            <Phone size={7} style={{ color: colors.accent }} />
            <span className="text-[7px]" style={{ color: colors.text }}>{data.phone1}</span>
          </div>
        )}
        {data.phone2 && (
          <div className="flex items-center gap-[4px]">
            <Phone size={7} style={{ color: colors.accent }} />
            <span className="text-[7px]" style={{ color: colors.text }}>{data.phone2}</span>
          </div>
        )}
        {data.email && (
          <div className="flex items-center gap-[4px]">
            <Mail size={7} style={{ color: colors.accent }} />
            <span className="text-[7px]" style={{ color: colors.text }}>{data.email}</span>
          </div>
        )}
        {data.website && (
          <div className="flex items-center gap-[4px]">
            <Globe size={7} style={{ color: colors.accent }} />
            <span className="text-[7px]" style={{ color: colors.text }}>{data.website}</span>
          </div>
        )}
        {data.address && (
          <div className="flex items-center gap-[4px]">
            <MapPin size={7} style={{ color: colors.accent }} />
            <span className="text-[7px]" style={{ color: colors.secondary }}>{data.address}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagonalBCTemplate;
