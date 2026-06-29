import React from 'react';
import { useApp } from '../../store/AppContext';
import { Input } from '../ui/input';
import { RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

const COLOR_PRESETS = [
  { name: 'Blue', primary: '#1e40af', accent: '#3b82f6', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff' },
  { name: 'Dark', primary: '#1a1a2e', accent: '#4a5568', text: '#0f0f0f', background: '#ffffff', secondary: '#4a4a4a', headerText: '#ffffff' },
  { name: 'Green', primary: '#065f46', accent: '#059669', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff' },
  { name: 'Red', primary: '#991b1b', accent: '#dc2626', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff' },
  { name: 'Purple', primary: '#5b21b6', accent: '#7c3aed', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff' },
  { name: 'Teal', primary: '#0f766e', accent: '#14b8a6', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff' },
  { name: 'Orange', primary: '#9a3412', accent: '#ea580c', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff' },
  { name: 'Slate', primary: '#334155', accent: '#64748b', text: '#1e293b', background: '#ffffff', secondary: '#94a3b8', headerText: '#ffffff' },
  { name: 'Rose', primary: '#9f1239', accent: '#f43f5e', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff' },
  { name: 'Indigo', primary: '#3730a3', accent: '#6366f1', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff' },
];

type ColorKey = 'primary' | 'accent' | 'text' | 'background' | 'secondary';

const ColorCustomizer: React.FC = () => {
  const { state, dispatch } = useApp();
  const isRTL = state.language === 'ku' || state.language === 'ar';

  const currentCustomization = state.resumeCustomization[state.selectedResumeTemplate] || {};

  const handleColorChange = (colorType: ColorKey, value: string) => {
    dispatch({
      type: 'UPDATE_RESUME_CUSTOMIZATION',
      payload: {
        colors: {
          ...currentCustomization.colors,
          [colorType]: value,
        },
      },
    });
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    dispatch({
      type: 'UPDATE_RESUME_CUSTOMIZATION',
      payload: {
        colors: {
          primary: preset.primary,
          accent: preset.accent,
          text: preset.text,
          background: preset.background,
          secondary: preset.secondary,
          headerText: preset.headerText,
        },
      },
    });
  };

  const resetColors = () => {
    dispatch({
      type: 'UPDATE_RESUME_CUSTOMIZATION',
      payload: { colors: undefined },
    });
  };

  const primaryColor = currentCustomization.colors?.primary || '#1e40af';
  const accentColor = currentCustomization.colors?.accent || '#3b82f6';
  const bgColor = currentCustomization.colors?.background || '#ffffff';

  const colorFields: { key: ColorKey; label: string; labelKu: string; value: string }[] = [
    { key: 'primary', label: 'Headers & Titles', labelKu: 'سەردێر و ناونیشان', value: primaryColor },
    { key: 'accent', label: 'Highlights', labelKu: 'جەختکردنەوە', value: accentColor },
    { key: 'background', label: 'Background', labelKu: 'پاشبنەما', value: bgColor },
  ];

  return (
    <div className={cn("space-y-3", isRTL && 'font-kufi')}>
      {/* Presets - Compact circles */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">
          {isRTL ? 'ڕەنگی ئامادەکراو' : 'Quick Presets'}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="group relative"
              title={preset.name}
            >
              <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-border hover:border-foreground/50 transition-all hover:scale-110"
                style={{ background: `linear-gradient(135deg, ${preset.primary} 50%, ${preset.accent} 50%)` }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Color Fields */}
      {colorFields.map((field) => (
        <div key={field.key} className="flex items-center gap-2">
          <label className="text-xs font-medium min-w-[80px] text-muted-foreground">
            {isRTL ? field.labelKu : field.label}
          </label>
          <div className="flex items-center gap-1.5 flex-1">
            <input
              type="color"
              value={field.value}
              onChange={(e) => handleColorChange(field.key, e.target.value)}
              className="w-7 h-7 rounded-md cursor-pointer border border-border p-0.5"
            />
            <Input
              type="text"
              value={field.value}
              onChange={(e) => handleColorChange(field.key, e.target.value)}
              className="flex-1 h-7 text-xs font-mono"
            />
          </div>
        </div>
      ))}

      {/* Reset */}
      <button
        onClick={resetColors}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-md hover:bg-accent/10"
      >
        <RotateCcw size={12} />
        {isRTL ? 'گەڕانەوە بۆ بنەڕەت' : 'Reset Colors'}
      </button>
    </div>
  );
};

export default ColorCustomizer;
