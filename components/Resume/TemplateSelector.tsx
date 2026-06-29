import React from 'react';
import { useApp } from '../../store/AppContext';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import ProfessionalTemplate from './Templates/ProfessionalTemplate';
import ClassicTemplate from './Templates/ClassicTemplate';
import ModernTemplate from './Templates/ModernTemplate';
import MinimalTemplate from './Templates/MinimalTemplate';
import CreativeTemplate from './Templates/CreativeTemplate';
import ElegantTemplate from './Templates/ElegantTemplate';
import CompactTemplate from './Templates/CompactTemplate';
import ExecutiveTemplate from './Templates/ExecutiveTemplate';
import TechTemplate from './Templates/TechTemplate';
import BoldTemplate from './Templates/BoldTemplate';
import AcademicTemplate from './Templates/AcademicTemplate';
import TimelineTemplate from './Templates/TimelineTemplate';
import SidebarTemplate from './Templates/SidebarTemplate';
import InfographicTemplate from './Templates/InfographicTemplate';
import BoxedTemplate from './Templates/BoxedTemplate';
import GradientTemplate from './Templates/GradientTemplate';
import ModularTemplate from './Templates/ModularTemplate';
import StripedTemplate from './Templates/StripedTemplate';
import MetroTemplate from './Templates/MetroTemplate';
import DiamondTemplate from './Templates/DiamondTemplate';
import HorizonTemplate from './Templates/HorizonTemplate';
import MosaicTemplate from './Templates/MosaicTemplate';
import RibbonTemplate from './Templates/RibbonTemplate';
import AuroraTemplate from './Templates/AuroraTemplate';
import ColumnsTemplate from './Templates/ColumnsTemplate';
import WaveTemplate from './Templates/WaveTemplate';
import CornerstoneTemplate from './Templates/CornerstoneTemplate';
import PortraitTemplate from './Templates/PortraitTemplate';

const TemplateSelector: React.FC = () => {
  const { state, dispatch } = useApp();
  const isRTL = state.language === 'ku' || state.language === 'ar';

  const templates: { id: string; name: string; Component: React.ComponentType<any> }[] = [
    { id: 'professional', name: isRTL ? 'پرۆفیشناڵ' : 'Professional', Component: ProfessionalTemplate },
    { id: 'classic', name: isRTL ? 'کلاسیک' : 'Classic', Component: ClassicTemplate },
    { id: 'modern', name: isRTL ? 'مۆدێرن' : 'Modern', Component: ModernTemplate },
    { id: 'minimal', name: isRTL ? 'مینیماڵ' : 'Minimal', Component: MinimalTemplate },
    { id: 'creative', name: isRTL ? 'کریئەیتیڤ' : 'Creative', Component: CreativeTemplate },
    { id: 'elegant', name: isRTL ? 'ئێلیگانت' : 'Elegant', Component: ElegantTemplate },
    { id: 'compact', name: isRTL ? 'کۆمپاکت' : 'Compact', Component: CompactTemplate },
    { id: 'executive', name: isRTL ? 'ئێگزێکیوتیڤ' : 'Executive', Component: ExecutiveTemplate },
    { id: 'tech', name: isRTL ? 'تێک' : 'Tech', Component: TechTemplate },
    { id: 'bold', name: isRTL ? 'بۆڵد' : 'Bold', Component: BoldTemplate },
    { id: 'academic', name: isRTL ? 'ئەکادیمی' : 'Academic', Component: AcademicTemplate },
    { id: 'timeline', name: isRTL ? 'تایم لاین' : 'Timeline', Component: TimelineTemplate },
    { id: 'sidebar', name: isRTL ? 'سایدبار' : 'Sidebar', Component: SidebarTemplate },
    { id: 'infographic', name: isRTL ? 'ئینفۆگرافیک' : 'Infographic', Component: InfographicTemplate },
    { id: 'boxed', name: isRTL ? 'بۆکسد' : 'Boxed', Component: BoxedTemplate },
    { id: 'gradient', name: isRTL ? 'گرادیێنت' : 'Gradient', Component: GradientTemplate },
    { id: 'modular', name: isRTL ? 'مۆدیولار' : 'Modular', Component: ModularTemplate },
    { id: 'striped', name: isRTL ? 'ستریپد' : 'Striped', Component: StripedTemplate },
    { id: 'metro', name: isRTL ? 'مێترۆ' : 'Metro', Component: MetroTemplate },
    { id: 'diamond', name: isRTL ? 'دایەمەند' : 'Diamond', Component: DiamondTemplate },
    { id: 'horizon', name: isRTL ? 'هۆرایزن' : 'Horizon', Component: HorizonTemplate },
    { id: 'mosaic', name: isRTL ? 'مۆزایک' : 'Mosaic', Component: MosaicTemplate },
    { id: 'ribbon', name: isRTL ? 'ڕیبۆن' : 'Ribbon', Component: RibbonTemplate },
    { id: 'aurora', name: isRTL ? 'ئۆرۆرا' : 'Aurora', Component: AuroraTemplate },
    { id: 'columns', name: isRTL ? 'کۆڵەمز' : 'Columns', Component: ColumnsTemplate },
    { id: 'wave', name: isRTL ? 'وەیڤ' : 'Wave', Component: WaveTemplate },
    { id: 'cornerstone', name: isRTL ? 'کۆرنەرستۆن' : 'Cornerstone', Component: CornerstoneTemplate },
    { id: 'portrait', name: isRTL ? 'پۆرترەیت' : 'Portrait', Component: PortraitTemplate },
  ];

  const handleSelect = (templateId: string) => {
    dispatch({ type: 'SET_RESUME_TEMPLATE', payload: templateId });
  };

  return (
    <div className={cn("space-y-2", isRTL && "font-kufi")} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-3 gap-2">
        {templates.map((template) => {
          const isSelected = state.selectedResumeTemplate === template.id;
          const customization = state.resumeCustomization[template.id] || {};
          
          return (
            <button
              key={template.id}
              onClick={() => handleSelect(template.id)}
              className={cn(
                "relative rounded-lg border-2 overflow-hidden transition-all hover:shadow-md",
                isSelected
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/50"
              )}
            >
              {/* Real template preview */}
              <div className="w-full bg-white overflow-hidden pointer-events-none relative" style={{ height: 0, paddingBottom: '125%' }}>
                <div className="absolute inset-0">
                  <div style={{ transform: 'scale(0.12)', transformOrigin: 'top left', width: '833.33%', height: '833.33%' }}>
                    <template.Component
                      data={state.resumeData}
                      customization={customization}
                      language={state.resumeLanguage}
                    />
                  </div>
                </div>
              </div>
              
              {/* Template Name */}
              <div className="px-1.5 py-1 text-[9px] font-medium text-center bg-muted/50">
                {template.name}
              </div>
              
              {/* Check Badge */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <Check size={10} className="text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateSelector;
