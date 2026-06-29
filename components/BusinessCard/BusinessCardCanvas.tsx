import React, { useRef, useCallback } from 'react';
import { useApp } from '../../store/AppContext';
import { generateId } from '../../utils/helpers';
import { Printer, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import ModernBCTemplate from './Templates/ModernBCTemplate';
import ClassicBCTemplate from './Templates/ClassicBCTemplate';
import MinimalBCTemplate from './Templates/MinimalBCTemplate';
import BoldBCTemplate from './Templates/BoldBCTemplate';
import CorporateBCTemplate from './Templates/CorporateBCTemplate';
import ElegantBCTemplate from './Templates/ElegantBCTemplate';
import GradientBCTemplate from './Templates/GradientBCTemplate';
import StripesBCTemplate from './Templates/StripesBCTemplate';
import RoyalBCTemplate from './Templates/RoyalBCTemplate';
import SlateBCTemplate from './Templates/SlateBCTemplate';
import HorizonBCTemplate from './Templates/HorizonBCTemplate';
import PulseBCTemplate from './Templates/PulseBCTemplate';
import NordicBCTemplate from './Templates/NordicBCTemplate';
import PrismBCTemplate from './Templates/PrismBCTemplate';
import EmberBCTemplate from './Templates/EmberBCTemplate';
import OceanBCTemplate from './Templates/OceanBCTemplate';
import IvoryBCTemplate from './Templates/IvoryBCTemplate';
import CircuitBCTemplate from './Templates/CircuitBCTemplate';
import CosmosBCTemplate from './Templates/CosmosBCTemplate';

const BusinessCardCanvas: React.FC = () => {
  const { state, dispatch } = useApp();
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const zoom = state.zoom;

  const getTemplateComponent = () => {
    switch (state.selectedBusinessCardTemplate) {
      case 'modern': return ModernBCTemplate;
      case 'classic': return ClassicBCTemplate;
      case 'minimal': return MinimalBCTemplate;
      case 'bold': return BoldBCTemplate;
      case 'corporate': return CorporateBCTemplate;
      case 'elegant': return ElegantBCTemplate;
      case 'gradient': return GradientBCTemplate;
      case 'stripes': return StripesBCTemplate;
      case 'royal': return RoyalBCTemplate;
      case 'slate': return SlateBCTemplate;
      case 'horizon': return HorizonBCTemplate;
      case 'pulse': return PulseBCTemplate;
      case 'nordic': return NordicBCTemplate;
      case 'prism': return PrismBCTemplate;
      case 'ember': return EmberBCTemplate;
      case 'ocean': return OceanBCTemplate;
      case 'ivory': return IvoryBCTemplate;
      case 'circuit': return CircuitBCTemplate;
      case 'cosmos': return CosmosBCTemplate;
      default: return ModernBCTemplate;
    }
  };

  const TemplateComponent = getTemplateComponent();
  const customization = state.businessCardCustomization[state.selectedBusinessCardTemplate] || {};
  const tplName = state.selectedBusinessCardTemplate.charAt(0).toUpperCase() + state.selectedBusinessCardTemplate.slice(1);

  const captureCardAsImage = useCallback(async (ref: HTMLDivElement | null): Promise<string | null> => {
    if (!ref) return null;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(ref, {
        scale: 4,
        useCORS: true,
        backgroundColor: null,
        width: 360,
        height: 200,
      });
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }, []);

  const handleUseInSlots = async () => {
    const frontSrc = await captureCardAsImage(frontRef.current);
    const backSrc = await captureCardAsImage(backRef.current);
    
    if (!frontSrc) return;

    const frontPhoto = { id: generateId(), name: 'Business Card Front', src: frontSrc, rotation: 0, annotations: [] as any[] };
    const backPhoto = backSrc ? { id: generateId(), name: 'Business Card Back', src: backSrc, rotation: 0, annotations: [] as any[] } : null;

    dispatch({ type: 'SET_BUSINESS_CARD_DESIGN_MODE', payload: false });
    dispatch({ type: 'FILL_CARDS', payload: { side: 'right', photo: frontPhoto } });
    if (backPhoto) {
      dispatch({ type: 'FILL_CARDS', payload: { side: 'left', photo: backPhoto } });
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-8">
      <div
        className="flex flex-col items-center origin-top transition-transform duration-200 ease-out"
        style={{ transform: `scale(${zoom})` }}
      >
        {/* Front card */}
        <div className="mb-2">
          <p className="text-[10px] text-muted-foreground mb-1.5 text-center font-medium">
            {state.language === 'ku' ? 'پێشەوە' : state.language === 'ar' ? 'الأمام' : 'Front'}
          </p>
          <div
            ref={frontRef}
            data-bc-front
            className="bg-white shadow-xl rounded-lg overflow-hidden ring-1 ring-black/10"
            style={{ width: '360px', height: '200px' }}
          >
            <TemplateComponent
              data={state.businessCardData}
              customization={customization}
              language={state.businessCardLanguage}
              side="front"
            />
          </div>
        </div>

        {/* Back card */}
        <div className="mt-4 mb-2">
          <p className="text-[10px] text-muted-foreground mb-1.5 text-center font-medium">
            {state.language === 'ku' ? 'پشتەوە' : state.language === 'ar' ? 'الخلف' : 'Back'}
          </p>
          <div
            ref={backRef}
            data-bc-back
            className="bg-white shadow-xl rounded-lg overflow-hidden ring-1 ring-black/10"
            style={{ width: '360px', height: '200px' }}
          >
            <TemplateComponent
              data={state.businessCardData}
              customization={customization}
              language={state.businessCardLanguage}
              side="back"
            />
          </div>
        </div>

        {/* Size label */}
        <p className="text-[10px] text-muted-foreground mt-3">
          90mm × 50mm — {tplName}
        </p>

        {/* Use in Slots button */}
        <Button onClick={handleUseInSlots} className="gap-2 mt-4">
          <Printer size={16} />
          {state.language === 'ku' ? 'بیخە بۆ چاپکردن' : state.language === 'ar' ? 'استخدام في الطباعة' : 'Use in Slots for Print'}
          <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
};

export default BusinessCardCanvas;
