import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Input } from './input';
import { Type, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BUILTIN_FONTS = [
  'Noto Kufi Arabic', 'Noto Naskh Arabic', 'Inter',
];

interface FontPickerProps {
  value: string;
  onChange: (fontFamily: string) => void;
  isRTL?: boolean;
}

export const FontPicker: React.FC<FontPickerProps> = ({ value, onChange, isRTL }) => {
  const [fontSearch, setFontSearch] = useState('');
  const [showFontList, setShowFontList] = useState(false);
  const fontListRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    return [...BUILTIN_FONTS].sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredFonts = useMemo(() => {
    if (!fontSearch.trim()) return allFonts;
    const q = fontSearch.toLowerCase();
    return allFonts.filter(f => f.toLowerCase().includes(q));
  }, [allFonts, fontSearch]);

  const handleFontChange = (fontFamily: string) => {
    onChange(fontFamily);
    setShowFontList(false);
    setFontSearch('');
  };

  return (
    <div className="relative w-full" ref={fontListRef}>
      <button
        onClick={() => {
          setShowFontList(!showFontList);
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }}
        className="w-full flex items-center justify-between px-2 py-1.5 border border-border rounded-md bg-background hover:bg-accent/5 transition-colors text-xs text-foreground focus:border-primary"
      >
        <span style={{ fontFamily: value }} className="truncate">{value || 'Default'}</span>
        <Type size={12} className="text-muted-foreground flex-shrink-0" />
      </button>

      {showFontList && (
        <div className="absolute z-[100] top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl overflow-hidden min-w-[200px]">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={fontSearch}
                onChange={(e) => setFontSearch(e.target.value)}
                placeholder={isRTL ? 'گەڕان بۆ فۆنت...' : 'Search fonts...'}
                className="h-7 pl-7 pr-7 text-xs"
              />
              {fontSearch && (
                <button onClick={() => setFontSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredFonts.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                {isRTL ? 'فۆنت نەدۆزرایەوە' : 'No fonts found'}
              </div>
            ) : (
              filteredFonts.map((font) => (
                <button
                  key={font}
                  onClick={() => handleFontChange(font)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs hover:bg-accent/10 transition-colors flex items-center justify-between text-foreground",
                    value === font && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <span style={{ fontFamily: font }} className="truncate">{font}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
