import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import { Input } from '../ui/input';
import { Type, Search, X, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

type ColorKey = 'text' | 'secondary' | 'headerText';

const BUILTIN_FONTS = [
  'Noto Kufi Arabic', 'Noto Naskh Arabic', 'Cairo', 'Amiri',
  'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia',
  'Verdana', 'Calibri', 'Tahoma', 'Trebuchet MS', 'Garamond',
  'Palatino Linotype', 'Century Gothic', 'Segoe UI', 'Roboto',
  'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Noto Sans',
];

const FontCustomizer: React.FC = () => {
  const { state, dispatch } = useApp();
  const isRTL = state.language === 'ku' || state.language === 'ar';
  const [systemFonts, setSystemFonts] = useState<string[]>([]);
  const [fontSearch, setFontSearch] = useState('');
  const [showFontList, setShowFontList] = useState(false);
  const [loadingFonts, setLoadingFonts] = useState(false);
  const fontListRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentCustomization = state.resumeCustomization[state.selectedResumeTemplate] || {};

  // Load system fonts using Local Font Access API
  useEffect(() => {
    const loadSystemFonts = async () => {
      try {
        if ('queryLocalFonts' in window) {
          setLoadingFonts(true);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fonts = await (window as any).queryLocalFonts();
          const familySet = new Set<string>();
          for (const font of fonts) {
            familySet.add(font.family);
          }
          const sorted = Array.from(familySet).sort((a, b) => a.localeCompare(b));
          setSystemFonts(sorted);
          setLoadingFonts(false);
        }
      } catch {
        setLoadingFonts(false);
      }
    };
    loadSystemFonts();
  }, []);

  // Close font list on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fontListRef.current && !fontListRef.current.contains(e.target as Node)) {
        setShowFontList(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allFonts = useMemo(() => {
    const combined = new Set([...BUILTIN_FONTS, ...systemFonts]);
    return Array.from(combined).sort((a, b) => a.localeCompare(b));
  }, [systemFonts]);

  const filteredFonts = useMemo(() => {
    if (!fontSearch.trim()) return allFonts;
    const q = fontSearch.toLowerCase();
    return allFonts.filter(f => f.toLowerCase().includes(q));
  }, [allFonts, fontSearch]);

  const handleFontChange = (fontFamily: string) => {
    dispatch({ type: 'UPDATE_RESUME_CUSTOMIZATION', payload: { fontFamily } });
    setShowFontList(false);
    setFontSearch('');
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    dispatch({ type: 'UPDATE_RESUME_CUSTOMIZATION', payload: { fontSize } });
  };

  const handleSpacingChange = (spacing: 'compact' | 'normal' | 'relaxed') => {
    dispatch({ type: 'UPDATE_RESUME_CUSTOMIZATION', payload: { spacing } });
  };

  const handleTextColorChange = (colorType: ColorKey, value: string) => {
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

  const resetFont = () => {
    dispatch({ type: 'UPDATE_RESUME_CUSTOMIZATION', payload: { fontFamily: 'Noto Kufi Arabic', fontSize: undefined, spacing: undefined } });
  };

  const currentFont = currentCustomization.fontFamily || 'Noto Kufi Arabic';
  const currentFontSize = currentCustomization.fontSize || 'medium';
  const currentSpacing = currentCustomization.spacing || 'normal';
  const textColor = currentCustomization.colors?.text || '#1f2937';
  const secondaryColor = currentCustomization.colors?.secondary || '#6b7280';
  const headerTextColor = currentCustomization.colors?.headerText || '#ffffff';

  const sizeOptions: { value: 'small' | 'medium' | 'large'; label: string; labelKu: string; icon: string }[] = [
    { value: 'small', label: 'S', labelKu: 'S', icon: 'A' },
    { value: 'medium', label: 'M', labelKu: 'M', icon: 'A' },
    { value: 'large', label: 'L', labelKu: 'L', icon: 'A' },
  ];

  const spacingOptions: { value: 'compact' | 'normal' | 'relaxed'; label: string; labelKu: string }[] = [
    { value: 'compact', label: 'Compact', labelKu: 'تەنگ' },
    { value: 'normal', label: 'Normal', labelKu: 'ئاسایی' },
    { value: 'relaxed', label: 'Relaxed', labelKu: 'فراوان' },
  ];

  return (
    <div className={cn("space-y-4", isRTL && 'font-kufi')}>
      {/* Font Family - Searchable */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          {isRTL ? 'جۆری فۆنت' : 'Font Family'}
        </label>
        <div className="relative" ref={fontListRef}>
          <button
            onClick={() => {
              setShowFontList(!showFontList);
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-lg bg-background hover:bg-accent/5 transition-colors text-sm"
          >
            <span style={{ fontFamily: currentFont }} className="truncate">{currentFont}</span>
            <Type size={14} className="text-muted-foreground flex-shrink-0" />
          </button>

          {showFontList && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    placeholder={isRTL ? 'گەڕان بۆ فۆنت...' : 'Search fonts...'}
                    className="h-8 pl-8 pr-8 text-sm"
                  />
                  {fontSearch && (
                    <button onClick={() => setFontSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Font List */}
              <div className="max-h-52 overflow-y-auto">
                {loadingFonts ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    {isRTL ? 'بارکردنی فۆنتەکان...' : 'Loading fonts...'}
                  </div>
                ) : filteredFonts.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    {isRTL ? 'فۆنت نەدۆزرایەوە' : 'No fonts found'}
                  </div>
                ) : (
                  filteredFonts.map((font) => (
                    <button
                      key={font}
                      onClick={() => handleFontChange(font)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-sm hover:bg-accent/10 transition-colors flex items-center justify-between",
                        currentFont === font && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <span style={{ fontFamily: font }} className="truncate">{font}</span>
                      {BUILTIN_FONTS.includes(font) && systemFonts.length > 0 && (
                        <span className="text-[9px] text-muted-foreground ml-2 flex-shrink-0">built-in</span>
                      )}
                    </button>
                  ))
                )}
              </div>

              {systemFonts.length === 0 && !loadingFonts && (
                <div className="p-2 border-t border-border">
                  <button
                    onClick={async () => {
                      try {
                        if ('queryLocalFonts' in window) {
                          setLoadingFonts(true);
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const fonts = await (window as any).queryLocalFonts();
                          const familySet = new Set<string>();
                          for (const font of fonts) familySet.add(font.family);
                          setSystemFonts(Array.from(familySet).sort((a, b) => a.localeCompare(b)));
                          setLoadingFonts(false);
                        }
                      } catch { setLoadingFonts(false); }
                    }}
                    className="w-full text-xs text-center text-primary hover:underline py-1"
                  >
                    {isRTL ? 'فۆنتەکانی کۆمپیوتەر ببینە' : 'Load system fonts'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Font Size & Spacing - Inline */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            {isRTL ? 'قەبارە' : 'Size'}
          </label>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {sizeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFontSizeChange(opt.value)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium transition-colors",
                  currentFontSize === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent/10"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            {isRTL ? 'بۆشایی' : 'Spacing'}
          </label>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {spacingOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSpacingChange(opt.value)}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-medium transition-colors",
                  currentSpacing === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent/10"
                )}
              >
                {isRTL ? opt.labelKu : opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Text Colors */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">
          {isRTL ? 'ڕەنگی نووسین' : 'Text Colors'}
        </label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium min-w-[80px] text-muted-foreground">
              {isRTL ? 'نووسینی سەرەکی' : 'Body Text'}
            </label>
            <div className="flex items-center gap-1.5 flex-1">
              <input
                type="color"
                value={textColor}
                onChange={(e) => handleTextColorChange('text', e.target.value)}
                className="w-7 h-7 rounded-md cursor-pointer border border-border p-0.5"
              />
              <Input
                type="text"
                value={textColor}
                onChange={(e) => handleTextColorChange('text', e.target.value)}
                className="flex-1 h-7 text-xs font-mono"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium min-w-[80px] text-muted-foreground">
              {isRTL ? 'نووسینی لاوەکی' : 'Subtle Text'}
            </label>
            <div className="flex items-center gap-1.5 flex-1">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => handleTextColorChange('secondary', e.target.value)}
                className="w-7 h-7 rounded-md cursor-pointer border border-border p-0.5"
              />
              <Input
                type="text"
                value={secondaryColor}
                onChange={(e) => handleTextColorChange('secondary', e.target.value)}
                className="flex-1 h-7 text-xs font-mono"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium min-w-[80px] text-muted-foreground">
              {isRTL ? 'نووسین لەسەر ڕەنگ' : 'On Color'}
            </label>
            <div className="flex items-center gap-1.5 flex-1">
              <input
                type="color"
                value={headerTextColor}
                onChange={(e) => handleTextColorChange('headerText', e.target.value)}
                className="w-7 h-7 rounded-md cursor-pointer border border-border p-0.5"
              />
              <Input
                type="text"
                value={headerTextColor}
                onChange={(e) => handleTextColorChange('headerText', e.target.value)}
                className="flex-1 h-7 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={resetFont}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-md hover:bg-accent/10"
      >
        <RotateCcw size={12} />
        {isRTL ? 'گەڕانەوە بۆ بنەڕەت' : 'Reset Typography'}
      </button>
    </div>
  );
};

export default FontCustomizer;
