import React from 'react';
import { BusinessCardData, CustomizationOptions } from '../../../types';

interface CardBackSideProps {
  data: BusinessCardData;
  colors: {
    primary: string;
    accent: string;
    text: string;
    background: string;
    secondary: string;
    headerText?: string;
  };
  fontFamily?: string;
}

const CardBackSide: React.FC<CardBackSideProps> = ({ data, colors, fontFamily }) => {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center text-center relative overflow-hidden"
      style={{ backgroundColor: colors.primary, fontFamily: fontFamily || 'Noto Kufi Arabic, sans-serif' }}
    >
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: colors.accent }} />
      <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: colors.accent }} />

      {/* Logo */}
      {data.logo && (
        <div className="w-[40px] h-[40px] rounded-lg overflow-hidden mb-[8px] border-[1.5px]" style={{ borderColor: `${colors.accent}60` }}>
          <img src={data.logo} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Company / Name */}
      <h2 className="text-[12px] font-bold tracking-wide uppercase" style={{ color: colors.headerText || '#ffffff' }}>
        {data.company || data.fullName || 'Company Name'}
      </h2>

      {/* Tagline */}
      {data.tagline && (
        <p className="text-[7px] mt-[3px] italic tracking-wider opacity-80" style={{ color: colors.headerText || '#ffffff' }}>
          {data.tagline}
        </p>
      )}

      {/* Divider */}
      <div className="w-[30px] h-[1px] my-[6px]" style={{ backgroundColor: `${colors.accent}80` }} />

      {/* Contact summary */}
      <div className="space-y-[2px]">
        {data.website && (
          <p className="text-[7px] opacity-75" style={{ color: colors.headerText || '#ffffff' }}>{data.website}</p>
        )}
        {data.email && (
          <p className="text-[7px] opacity-75" style={{ color: colors.headerText || '#ffffff' }}>{data.email}</p>
        )}
        {(data.phone1 || data.phone2) && (
          <p className="text-[7px] opacity-75" style={{ color: colors.headerText || '#ffffff' }}>
            {data.phone1}{data.phone2 ? ` | ${data.phone2}` : ''}
          </p>
        )}
      </div>

      {/* Social links */}
      {(data.social.linkedin || data.social.instagram || data.social.facebook) && (
        <div className="mt-[5px] flex gap-[8px]">
          {data.social.linkedin && (
            <span className="text-[6px] opacity-60" style={{ color: colors.headerText || '#ffffff' }}>in/{data.social.linkedin.replace(/.*linkedin\.com\/in\//i, '')}</span>
          )}
          {data.social.instagram && (
            <span className="text-[6px] opacity-60" style={{ color: colors.headerText || '#ffffff' }}>{data.social.instagram}</span>
          )}
          {data.social.facebook && (
            <span className="text-[6px] opacity-60" style={{ color: colors.headerText || '#ffffff' }}>fb/{data.social.facebook.replace(/.*facebook\.com\//i, '')}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default CardBackSide;
