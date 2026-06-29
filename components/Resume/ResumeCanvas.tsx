import React from 'react';
import { useApp } from '../../store/AppContext';
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

const ResumeCanvas: React.FC = () => {
  const { state } = useApp();

  const getTemplateComponent = () => {
    switch (state.selectedResumeTemplate) {
      case 'professional': return ProfessionalTemplate;
      case 'classic': return ClassicTemplate;
      case 'modern': return ModernTemplate;
      case 'minimal': return MinimalTemplate;
      case 'creative': return CreativeTemplate;
      case 'elegant': return ElegantTemplate;
      case 'compact': return CompactTemplate;
      case 'executive': return ExecutiveTemplate;
      case 'tech': return TechTemplate;
      case 'bold': return BoldTemplate;
      case 'academic': return AcademicTemplate;
      case 'timeline': return TimelineTemplate;
      case 'sidebar': return SidebarTemplate;
      case 'infographic': return InfographicTemplate;
      case 'boxed': return BoxedTemplate;
      case 'gradient': return GradientTemplate;
      case 'modular': return ModularTemplate;
      case 'striped': return StripedTemplate;
      case 'metro': return MetroTemplate;
      case 'diamond': return DiamondTemplate;
      case 'horizon': return HorizonTemplate;
      case 'mosaic': return MosaicTemplate;
      case 'ribbon': return RibbonTemplate;
      case 'aurora': return AuroraTemplate;
      case 'columns': return ColumnsTemplate;
      case 'wave': return WaveTemplate;
      case 'cornerstone': return CornerstoneTemplate;
      case 'portrait': return PortraitTemplate;
      default: return ProfessionalTemplate;
    }
  };

  const TemplateComponent = getTemplateComponent();

  return (
    <div className="w-full flex justify-center items-start">
      {/* A4 paper - fixed size, same styling as other tabs */}
      <div
        id="resume-print-area"
        data-resume-canvas
        className="a4-page relative mx-auto ring-1 ring-black/5 print:ring-0"
        style={{
          overflow: 'hidden',
        }}
      >
        <TemplateComponent
          data={state.resumeData}
          customization={state.resumeCustomization[state.selectedResumeTemplate] || {}}
          language={state.resumeLanguage}
        />
      </div>
    </div>
  );
};

export default ResumeCanvas;
