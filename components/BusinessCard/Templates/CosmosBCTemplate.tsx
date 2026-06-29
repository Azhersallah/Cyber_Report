import React from 'react';
import { BusinessCardTemplateProps } from '../../../types';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import CardBackSide from './CardBackSide';
import { getFontScale, scaled } from './bcUtils';

const CosmosBCTemplate: React.FC<BusinessCardTemplateProps> = ({ data, customization, language, side = 'front' }) => {
  const s = getFontScale(customization);
  const isRTL = language === 'ku' || language === 'ar';
  const font = customization.fontFamily || 'Noto Kufi Arabic, sans-serif';
  const colors = {
    primary: customization.colors?.primary || '#312e81',
    accent: customization.colors?.accent || '#818cf8',
    text: customization.colors?.text || '#e0e7ff',
    background: customization.colors?.background || '#1e1b4b',
    secondary: customization.colors?.secondary || '#6366f1',
    headerText: customization.colors?.headerText || '#ffffff',
  };
  if (side === 'back') return <CardBackSide data={data} colors={colors} fontFamily={font} />;
  return (
    <div className="w-full h-full flex flex-col justify-between p-[16px] relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.background}, ${colors.primary})`, fontFamily: font }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute top-[15px] right-[25px] w-[2px] h-[2px] rounded-full" style={{ backgroundColor: `${colors.accent}60` }} />
      <div className="absolute top-[35px] right-[60px] w-[1.5px] h-[1.5px] rounded-full" style={{ backgroundColor: `${colors.accent}40` }} />
      <div className="absolute bottom-[25px] right-[40px] w-[2px] h-[2px] rounded-full" style={{ backgroundColor: `${colors.accent}50` }} />
      <div className="absolute top-[50px] right-[15px] w-[1px] h-[1px] rounded-full" style={{ backgroundColor: `${colors.accent}30` }} />
      <div className="absolute bottom-[50px] left-[80%] w-[1.5px] h-[1.5px] rounded-full" style={{ backgroundColor: `${colors.accent}35` }} />
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold leading-tight" style={{ color: colors.headerText, fontSize: scaled(15, s) }}>{data.fullName || 'Your Name'}</h1>
            <p className="mt-[3px] font-medium tracking-[0.12em] uppercase" style={{ color: colors.accent, fontSize: scaled(8, s) }}>{data.title || 'Job Title'}</p>
            {data.company && <p className="mt-[2px] opacity-60" style={{ color: colors.headerText, fontSize: scaled(7, s) }}>{data.company}</p>}
          </div>
          {(data.logo || data.photo) && (
            <div className="w-[34px] h-[34px] rounded-full overflow-hidden flex-shrink-0 border-[1.5px]" style={{ borderColor: `${colors.accent}40` }}>
              <img src={data.logo || data.photo || ''} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
      <div className="space-y-[3px]">
        <div className="w-[30px] h-[1px] mb-[5px]" style={{ backgroundColor: `${colors.accent}30` }} />
        {data.phone1 && <div className="flex items-center gap-[5px]"><Phone size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.phone1}</span></div>}
        {data.email && <div className="flex items-center gap-[5px]"><Mail size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.email}</span></div>}
        {data.website && <div className="flex items-center gap-[5px]"><Globe size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.website}</span></div>}
        {data.address && <div className="flex items-center gap-[5px]"><MapPin size={7} style={{ color: colors.accent }} /><span style={{ color: colors.text, fontSize: scaled(7, s) }}>{data.address}</span></div>}
      </div>
    </div>
  );
};

export default CosmosBCTemplate;
