import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../store/AppContext';
import { getTranslation } from '../../utils/translations';
import { 
  Printer, Image as ImageIcon, Plus, Trash2, QrCode, Layout, 
  ChevronDown, Settings, Layers, Grid, FileText, Check, 
  BookOpen, Smile, Sparkles, Sliders, Type, Maximize2, RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/toast';
import { cn } from '../../lib/utils';
import { QRCodeSVG } from 'qrcode.react';
interface StickerPreset {
  id: string;
  nameEn: string;
  nameKu: string;
  rows: number;
  cols: number;
  width: number;
  height: number;
  gapX: number;
  gapY: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  orientation: 'portrait' | 'landscape';
  shape: 'circle' | 'rectangle' | 'round-rect';
  borderRadius: number;
  stickerLayout: 'vertical' | 'side-by-side' | 'horizontal-qr' | 'image-only' | 'qr-only';
  qrCodeEnabled: boolean;
}

const PRESETS: StickerPreset[] = [
  {
    id: 'round-4x6',
    nameEn: 'Round Circle Labels 40mm (4x6)',
    nameKu: 'ستیکەری بازنەیی ٤٠ملم (٤ لە ٦)',
    rows: 6,
    cols: 4,
    width: 40,
    height: 40,
    gapX: 5,
    gapY: 5,
    marginTop: 16,
    marginBottom: 16,
    marginLeft: 17.5,
    marginRight: 17.5,
    orientation: 'portrait',
    shape: 'circle',
    borderRadius: 0,
    stickerLayout: 'vertical',
    qrCodeEnabled: false
  },
  {
    id: 'address-5x13',
    nameEn: 'Address / Price Labels (5x13)',
    nameKu: 'لایبڵی ناونیشان و نرخ (٥ لە ١٣)',
    rows: 13,
    cols: 5,
    width: 38,
    height: 20,
    gapX: 2,
    gapY: 1,
    marginTop: 12.5,
    marginBottom: 12.5,
    marginLeft: 6,
    marginRight: 6,
    orientation: 'portrait',
    shape: 'round-rect',
    borderRadius: 4,
    stickerLayout: 'side-by-side',
    qrCodeEnabled: false
  },
  {
    id: 'shipping-2x4',
    nameEn: 'Large Shipping Labels (2x4)',
    nameKu: 'سەرچەسپی ناردن (٢ لە ٤)',
    rows: 4,
    cols: 2,
    width: 95,
    height: 65,
    gapX: 5,
    gapY: 5,
    marginTop: 11,
    marginBottom: 11,
    marginLeft: 7.5,
    marginRight: 7.5,
    orientation: 'portrait',
    shape: 'round-rect',
    borderRadius: 6,
    stickerLayout: 'horizontal-qr',
    qrCodeEnabled: true
  },
  {
    id: 'square-4x6',
    nameEn: 'Square Branding Stickers (4x6)',
    nameKu: 'ستیکەری چوارگۆشە (٤ لە ٦)',
    rows: 6,
    cols: 4,
    width: 45,
    height: 45,
    gapX: 3,
    gapY: 3,
    marginTop: 6,
    marginBottom: 6,
    marginLeft: 7.5,
    marginRight: 7.5,
    orientation: 'portrait',
    shape: 'rectangle',
    borderRadius: 0,
    stickerLayout: 'vertical',
    qrCodeEnabled: true
  },
  {
    id: 'logo-only-3x4',
    nameEn: 'Logo Only Circular 60mm (3x4)',
    nameKu: 'ستیکەری لۆگۆ بازنەیی ٦٠ملم (٣ لە ٤)',
    rows: 4,
    cols: 3,
    width: 60,
    height: 60,
    gapX: 5,
    gapY: 10,
    marginTop: 13.5,
    marginBottom: 13.5,
    marginLeft: 10,
    marginRight: 10,
    orientation: 'portrait',
    shape: 'circle',
    borderRadius: 0,
    stickerLayout: 'image-only',
    qrCodeEnabled: false
  }
];


// ─── Memoized StickerCell ─────────────────────────────────────────────────────
// Wrapped in React.memo so that cells whose props haven't changed are NOT
// re-rendered during slider drags (margin, size, gap adjustments).
// GPU compositing hint: will-change + transform3d offloads repaints to the GPU.
interface StickerCellProps {
  stickerWidth: number;
  stickerHeight: number;
  shape: string;
  borderRadius: number;
  borderEnabled: boolean;
  borderWidth: number;
  borderStyle: string;
  borderColor: string;
  backgroundColor: string;
  stickerLayout: string;
  imageSrc: string;
  text: string;
  textColor: string;
  textFontSize: number;
  textBold: boolean;
  textCenter: boolean;
  qrCodeText: string;
  qrCodeEnabled: boolean;
  qrCodeSize: number;
  imageHeight: number;
  ImageIcon: React.FC<{ className?: string }>;
}

const StickerCell = React.memo(function StickerCell({
  stickerWidth, stickerHeight, shape, borderRadius,
  borderEnabled, borderWidth, borderStyle, borderColor,
  backgroundColor, stickerLayout, imageSrc, text,
  textColor, textFontSize, textBold, textCenter,
  qrCodeText, qrCodeEnabled, qrCodeSize, imageHeight, ImageIcon,
}: StickerCellProps) {
  const stickerStyle: React.CSSProperties = {
    width: `${stickerWidth}mm`,
    height: `${stickerHeight}mm`,
    borderRadius: shape === 'circle' ? '50%' : shape === 'round-rect' ? `${borderRadius}px` : '0px',
    border: borderEnabled ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
    backgroundColor: backgroundColor,
    display: 'flex',
    flexDirection: stickerLayout === 'side-by-side' || stickerLayout === 'horizontal-qr' ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2mm',
    overflow: 'hidden',
    position: 'relative',
    boxSizing: 'border-box',
    gap: '1mm',
    // GPU acceleration — offload repaint to GPU compositor layer
    transform: 'translate3d(0,0,0)',
    willChange: 'transform',
  };

  return (
    <div style={stickerStyle} className="shadow-sm hover:shadow-md transition-shadow relative">
      {/* 1. Image only */}
      {stickerLayout === 'image-only' && imageSrc && (
        <img src={imageSrc} alt="logo" style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} />
      )}

      {/* 2. QR Code only */}
      {stickerLayout === 'qr-only' && (
        <div style={{ height: '90%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QRCodeSVG value={qrCodeText} size={100} style={{ height: '100%', width: '100%' }} level="M" bgColor="#ffffff" fgColor="#000000" />
        </div>
      )}

      {/* 3. Vertical stacked */}
      {stickerLayout === 'vertical' && (
        <>
          {imageSrc && (
            <img src={imageSrc} alt="logo" style={{ height: `${imageHeight}%`, maxWidth: '90%', objectFit: 'contain', marginBottom: '0.5mm' }} />
          )}
          {text && (
            <p className="leading-tight whitespace-pre-wrap break-all w-full select-none"
              style={{ color: textColor, fontSize: `${textFontSize}pt`, fontWeight: textBold ? 'bold' : 'normal', textAlign: textCenter ? 'center' : 'left', flex: 1, display: 'flex', alignItems: 'center', justifyContent: textCenter ? 'center' : 'flex-start', overflow: 'hidden' }}>
              {text}
            </p>
          )}
          {qrCodeEnabled && (
            <div style={{ height: `${qrCodeSize}%`, aspectRatio: '1', marginTop: '0.5mm' }} className="flex-shrink-0">
              <QRCodeSVG value={qrCodeText} size={60} style={{ height: '100%', width: '100%' }} level="M" bgColor="#ffffff" fgColor="#000000" />
            </div>
          )}
        </>
      )}

      {/* 4. Side-by-side (logo left, text right) */}
      {stickerLayout === 'side-by-side' && (
        <>
          <div style={{ width: '35%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {imageSrc ? (
              <img src={imageSrc} alt="logo" style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
            )}
          </div>
          <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', paddingLeft: '1mm' }} className="rtl:pl-0 rtl:pr-1">
            {text && (
              <p className="leading-tight whitespace-pre-wrap break-all w-full select-none"
                style={{ color: textColor, fontSize: `${textFontSize}pt`, fontWeight: textBold ? 'bold' : 'normal', textAlign: textCenter ? 'center' : 'left', overflow: 'hidden' }}>
                {text}
              </p>
            )}
          </div>
        </>
      )}

      {/* 5. Horizontal QR (text left, QR right) */}
      {stickerLayout === 'horizontal-qr' && (
        <>
          <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', paddingRight: '1mm' }} className="rtl:pr-0 rtl:pl-1">
            {text && (
              <p className="leading-tight whitespace-pre-wrap break-all w-full select-none"
                style={{ color: textColor, fontSize: `${textFontSize}pt`, fontWeight: textBold ? 'bold' : 'normal', textAlign: textCenter ? 'center' : 'left', overflow: 'hidden' }}>
                {text}
              </p>
            )}
          </div>
          <div style={{ width: `${qrCodeSize}%`, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <QRCodeSVG value={qrCodeText} size={80} style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} level="M" bgColor="#ffffff" fgColor="#000000" />
          </div>
        </>
      )}
    </div>
  );
});
// ─────────────────────────────────────────────────────────────────────────────

export const StickersTab: React.FC = () => {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const t = (key: string) => getTranslation(key, state.language);
  const isKurdish = state.language === 'ku' || state.language === 'ar';

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Layout states
  const [activePreset, setActivePreset] = useState<string>('custom');
  const [rows, setRows] = useState<number>(8);
  const [cols, setCols] = useState<number>(3);
  const [totalLabels, setTotalLabels] = useState<number>(24);
  const [presetMarginTop, setPresetMarginTop] = useState<number>(10);
  const [presetMarginBottom, setPresetMarginBottom] = useState<number>(10);
  const [presetMarginLeft, setPresetMarginLeft] = useState<number>(10);
  const [presetMarginRight, setPresetMarginRight] = useState<number>(10);
  const [stickerWidth, setStickerWidth] = useState<number>(60); // mm
  const [stickerHeight, setStickerHeight] = useState<number>(32); // mm
  const [gapX, setGapX] = useState<number>(3); // mm
  const [gapY, setGapY] = useState<number>(3); // mm
  

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Sticker Style states
  const [shape, setShape] = useState<'circle' | 'rectangle' | 'round-rect'>('round-rect');
  const [borderRadius, setBorderRadius] = useState<number>(6); // px
  const [borderEnabled, setBorderEnabled] = useState<boolean>(true);
  const [borderStyle, setBorderStyle] = useState<'solid' | 'dashed' | 'dotted'>('dashed');
  const [borderColor, setBorderColor] = useState<string>('#d1d5db');
  const [borderWidth, setBorderWidth] = useState<number>(1); // px
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');

  // Content states
  const [stickerLayout, setStickerLayout] = useState<'vertical' | 'side-by-side' | 'horizontal-qr' | 'image-only' | 'qr-only'>('vertical');
  const [imageSrc, setImageSrc] = useState<string>(''); // Logo base64
  const [imageHeight, setImageHeight] = useState<number>(30); // % of height
  const [text, setText] = useState<string>(isKurdish ? 'ناوی کاڵا لێرە بنووسە\nکۆدی: 994012\nنرخ: $ 15.00' : 'Product Label\nCode: 994012\nPrice: $ 15.00');
  const [textColor, setTextColor] = useState<string>('#000000');
  const [textFontSize, setTextFontSize] = useState<number>(9); // pt
  const [textBold, setTextBold] = useState<boolean>(true);
  const [textCenter, setTextCenter] = useState<boolean>(true);
  const [qrCodeEnabled, setQrCodeEnabled] = useState<boolean>(false);
  const [qrCodeText, setQrCodeText] = useState<string>('https://google.com');
  const [qrCodeSize, setQrCodeSize] = useState<number>(25); // % of height

  // Screen Zoom Control
  const zoom = state.zoom;

  // Reset global margin settings when Stickers tab mounts to ensure they show 0
  useEffect(() => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0
      }
    });
  }, [dispatch]);

  // Page Margins are calculated as preset margins + manual global margin adjustment offset
  const pageMarginTop = presetMarginTop + (state.settings.marginTop ?? 0);
  const pageMarginBottom = presetMarginBottom + (state.settings.marginBottom ?? 0);
  const pageMarginLeft = presetMarginLeft + (state.settings.marginLeft ?? 0);
  const pageMarginRight = presetMarginRight + (state.settings.marginRight ?? 0);

  // A4 dimensions
  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const pageHeight = orientation === 'landscape' ? 210 : 297;
  const printableWidth = pageWidth - pageMarginLeft - pageMarginRight;
  const printableHeight = pageHeight - pageMarginTop - pageMarginBottom;

  // Max cols and rows per page calculations
  const maxCols = Math.max(1, Math.floor((printableWidth + gapX) / (stickerWidth + gapX)));
  const maxRowsPerPage = Math.max(1, Math.floor((printableHeight + gapY) / (stickerHeight + gapY)));
  const rowsPerPage = maxRowsPerPage;
  const labelsPerPage = rowsPerPage * cols;
  const totalPages = Math.max(1, Math.ceil(totalLabels / labelsPerPage));

  // Columns change handler
  const handleColsChange = (val: number) => {
    if (val > maxCols) {
      setCols(maxCols);
      showToast(isKurdish ? `تەنها دەتوانیت ${maxCols} لەیبڵ زیاد بکەیت بە پانی` : `You can only fit ${maxCols} labels horizontally`, 'warning');
    } else if (val < 1) {
      setCols(1);
    } else {
      setCols(val);
    }
  };

  // Enforce column limit dynamically
  useEffect(() => {
    if (cols > maxCols) {
      setCols(maxCols);
      showToast(isKurdish ? `بڕی ستوونەکان کەمکرایەوە بۆ ${maxCols} بەهۆی قەبارەی پەڕەکە` : `Columns reduced to ${maxCols} to fit page width`, 'warning');
    }
  }, [maxCols, cols, isKurdish]);

  // Apply Preset
  const handleApplyPreset = (preset: StickerPreset) => {
    setActivePreset(preset.id);
    setRows(preset.rows);
    setCols(preset.cols);
    setStickerWidth(preset.width);
    setStickerHeight(preset.height);
    setGapX(preset.gapX);
    setGapY(preset.gapY);
    
    // Set local preset margins
    setPresetMarginTop(preset.marginTop);
    setPresetMarginBottom(preset.marginBottom);
    setPresetMarginLeft(preset.marginLeft);
    setPresetMarginRight(preset.marginRight);

    setTotalLabels(preset.rows * preset.cols);
    setOrientation(preset.orientation);
    setShape(preset.shape);
    setBorderRadius(preset.borderRadius);
    setStickerLayout(preset.stickerLayout);
    setQrCodeEnabled(preset.qrCodeEnabled);
    showToast(isKurdish ? `ڕێکخستنی ${isKurdish ? preset.nameKu : preset.nameEn} جێبەجێ کرا` : `Preset ${preset.nameEn} loaded`, 'success');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear logo image
  const handleClearLogo = () => {
    setImageSrc('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // Calculate paper dimension base
  const widthMm = orientation === 'portrait' ? 210 : 297;
  const heightMm = orientation === 'portrait' ? 297 : 210;

  // Grid style
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, ${stickerWidth}mm)`,
    gridTemplateRows: `repeat(${rowsPerPage}, ${stickerHeight}mm)`,
    gap: `${gapY}mm ${gapX}mm`,
    justifyContent: 'center',
    alignContent: 'start',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full" dir={isKurdish ? 'rtl' : 'ltr'}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 ${orientation};
            margin: 0;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .stickers-print-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding-top: ${pageMarginTop}mm !important;
            padding-bottom: ${pageMarginBottom}mm !important;
            padding-left: ${pageMarginLeft}mm !important;
            padding-right: ${pageMarginRight}mm !important;
            width: ${widthMm}mm !important;
            height: ${heightMm}mm !important;
            transform: none !important;
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            page-break-after: always !important;
          }
        }
      `}} />

      {/* 1. Left Sidebar: Settings Panel */}
      <div className="w-80 border-r border-border overflow-y-auto bg-background no-print p-4 space-y-6 flex-shrink-0 custom-scrollbar">
        
        {/* Preset Selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 px-1">
            <Sparkles className="h-4 w-4" />
            <span>{isKurdish ? 'شێوازە ئامادەکراوەکان' : 'Sticker Presets'}</span>
          </label>
          <div className="grid grid-cols-1 gap-2 px-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={cn(
                  "p-2.5 text-right rounded-lg border border-border text-xs transition-all flex items-center justify-between",
                  activePreset === preset.id 
                    ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm" 
                    : "bg-card text-foreground hover:bg-accent/40 hover:border-border/80"
                )}
              >
                <span>{isKurdish ? preset.nameKu : preset.nameEn}</span>
                <span className={cn(
                  "text-[10px] border rounded px-1.5 py-0.5",
                  activePreset === preset.id ? "bg-primary/20 text-primary border-primary/20" : "bg-muted text-muted-foreground"
                )}>
                  {preset.cols}x{preset.rows}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setActivePreset('custom')}
              className={cn(
                "p-2.5 text-right rounded-lg border border-border text-xs transition-all flex items-center justify-between",
                activePreset === 'custom' 
                  ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm" 
                  : "bg-card text-foreground hover:bg-accent/40 hover:border-border/80"
              )}
            >
              <span>{isKurdish ? 'سایزی دەستی (مۆدێڕن)' : 'Custom Dimensions'}</span>
              <Sliders className={cn("h-3 w-3", activePreset === 'custom' ? "text-primary" : "text-muted-foreground")} />
            </button>
          </div>
        </div>

        {/* 1. Page & Layout Settings */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 px-1">
            <Grid className="h-4 w-4" />
            <span>{isKurdish ? 'ڕێکخستنی لاپەڕە و خشتە' : 'Page & Grid Layout'}</span>
          </h3>

          <div className="px-1 space-y-4">
            <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">{isKurdish ? 'ئاراستەی لاپەڕە' : 'Orientation'}</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                className="w-full text-xs p-2 rounded-md border border-border bg-card text-foreground focus:outline-none"
              >
                <option value="portrait">{isKurdish ? 'ستونی' : 'Portrait'}</option>
                <option value="landscape">{isKurdish ? 'ئاسۆیی' : 'Landscape'}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">{isKurdish ? 'شێوەی ستیکەر' : 'Sticker Shape'}</label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as any)}
                className="w-full text-xs p-2 rounded-md border border-border bg-card text-foreground focus:outline-none"
              >
                <option value="rectangle">{isKurdish ? 'لاڕێکخراو' : 'Rectangle'}</option>
                <option value="round-rect">{isKurdish ? 'گۆشە خڕ' : 'Round Rect'}</option>
                <option value="circle">{isKurdish ? 'بازنەیی' : 'Circle'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">{isKurdish ? 'ژمارەی ستوونەکان' : 'Columns'}</label>
              <Input
                type="number"
                min={1}
                max={maxCols}
                value={cols}
                onChange={(e) => handleColsChange(parseInt(e.target.value, 10) || 1)}
                onWheel={(e) => e.currentTarget.blur()} 
                className="h-8 text-xs focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">{isKurdish ? 'کۆی گشتی لەیبڵەکان' : 'Total Labels'}</label>
              <Input
                type="number"
                min={1}
                value={totalLabels}
                onChange={(e) => setTotalLabels(Math.max(1, parseInt(e.target.value, 10) || 1))}
                onWheel={(e) => e.currentTarget.blur()} 
                className="h-8 text-xs focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 px-1 text-[10px] text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/40 my-2">
            <div>
              <span className="font-semibold">{isKurdish ? 'ڕیز لە پەڕەیەکدا: ' : 'Rows / Page: '}</span>
              <span className="font-mono text-foreground font-bold">{rowsPerPage}</span>
            </div>
            <div>
              <span className="font-semibold">{isKurdish ? 'کۆی لاپەڕەکان: ' : 'Total Pages: '}</span>
              <span className="font-mono text-foreground font-bold">{totalPages}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">{isKurdish ? 'پانی ستیکەر (mm)' : 'Width (mm)'}</label>
              <Input
                type="number"
                min={5}
                max={200}
                value={stickerWidth}
                onChange={(e) => setStickerWidth(parseInt(e.target.value, 10) || 10)}
                onWheel={(e) => e.currentTarget.blur()} 
                className="h-8 text-xs focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">{isKurdish ? 'بەرزی ستیکەر (mm)' : 'Height (mm)'}</label>
              <Input
                type="number"
                min={5}
                max={200}
                value={stickerHeight}
                onChange={(e) => setStickerHeight(parseInt(e.target.value, 10) || 10)}
                onWheel={(e) => e.currentTarget.blur()} 
                className="h-8 text-xs focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">{isKurdish ? 'بۆشایی ستوونەکان' : 'Gap X (mm)'}</label>
              <Input
                type="number"
                min={0}
                max={50}
                value={gapX}
                onChange={(e) => setGapX(parseInt(e.target.value, 10) || 0)}
                onWheel={(e) => e.currentTarget.blur()} 
                className="h-8 text-xs focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">{isKurdish ? 'بۆشایی ڕیزەکان' : 'Gap Y (mm)'}</label>
              <Input
                type="number"
                min={0}
                max={50}
                value={gapY}
                onChange={(e) => setGapY(parseInt(e.target.value, 10) || 0)}
                onWheel={(e) => e.currentTarget.blur()} 
                className="h-8 text-xs focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

        {/* 2. Styling options */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 px-1">
            <Layers className="h-4 w-4" />
            <span>{isKurdish ? 'شێوازی نەخشاندن' : 'Sticker Style & Borders'}</span>
          </h3>

          <div className="px-1 space-y-4">
            <div className="flex items-center justify-between bg-muted/40 p-2 rounded-md border border-border">
              <span className="text-xs text-muted-foreground">{isKurdish ? 'پیشاندانی سنورەکان' : 'Enable border'}</span>
              <input
                type="checkbox"
                checked={borderEnabled}
                onChange={(e) => setBorderEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary bg-card border-border"
              />
            </div>

            {borderEnabled && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">{isKurdish ? 'ستایلی هێڵ' : 'Border Style'}</label>
                    <select
                      value={borderStyle}
                      onChange={(e) => setBorderStyle(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-md border border-border bg-card text-foreground focus:outline-none"
                    >
                      <option value="solid">{isKurdish ? 'هێڵی ڕەق' : 'Solid'}</option>
                      <option value="dashed">{isKurdish ? 'هێڵی پچڕاو (بۆ بڕین)' : 'Dashed'}</option>
                      <option value="dotted">{isKurdish ? 'خاڵ خاڵ' : 'Dotted'}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">{isKurdish ? 'خڕی گۆشەکان (px)' : 'Corner Radius'}</label>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(parseInt(e.target.value, 10) || 0)}
                      onWheel={(e) => e.currentTarget.blur()} 
                className="h-8 text-xs focus:ring-1 focus:ring-primary"
                      disabled={shape === 'circle'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">{isKurdish ? 'ڕەنگی سنور' : 'Border Color'}</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="w-8 h-8 rounded border cursor-pointer bg-transparent"
                      />
                      <Input
                        type="text"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="h-8 text-[10px] focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">{isKurdish ? 'پانی هێڵ (px)' : 'Border Weight'}</label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={borderWidth}
                      onChange={(e) => setBorderWidth(parseInt(e.target.value, 10) || 1)}
                      onWheel={(e) => e.currentTarget.blur()} 
                className="h-8 text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground flex justify-between">
                <span>{isKurdish ? 'ڕەنگی پاشبنەمای ستیكەر' : 'Background Color'}</span>
                <span className="font-mono text-[9px] uppercase">{backgroundColor}</span>
              </label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-10 h-8 rounded-md border border-border shadow-inner cursor-pointer relative overflow-hidden"
                  style={{ backgroundColor }}
                >
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-8 text-xs font-mono uppercase focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Sticker Contents */}
        <div className="space-y-4 border-t border-border/50 pt-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 px-1">
            <FileText className="h-4 w-4" />
            <span>{isKurdish ? 'ناوەڕۆکی ستیكەر' : 'Sticker Contents'}</span>
          </h3>

          <div className="px-1 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">{isKurdish ? 'نەخشی داڕشتن' : 'Layout Mode'}</label>
              <select
                value={stickerLayout}
                onChange={(e) => setStickerLayout(e.target.value as any)}
                className="w-full text-xs p-2 rounded-md border border-border bg-card text-foreground focus:outline-none"
              >
                <option value="vertical">{isKurdish ? 'لۆگۆ + تێکست + بارکۆد (ستونی)' : 'Vertical Stack'}</option>
                <option value="side-by-side">{isKurdish ? 'لۆگۆ (چەپ) + تێکست (ڕاست)' : 'Logo + Text (Side-by-side)'}</option>
                <option value="horizontal-qr">{isKurdish ? 'تێکست (چەپ) + QR کۆد (ڕاست)' : 'Text + QR Code (Side-by-side)'}</option>
                <option value="image-only">{isKurdish ? 'تەنها لۆگۆ یان وێنە' : 'Logo / Image Only'}</option>
                <option value="qr-only">{isKurdish ? 'تەنها QR کۆد' : 'QR Code Only'}</option>
              </select>
            </div>

            {stickerLayout !== 'qr-only' && (
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground block">{isKurdish ? 'لۆگۆ یان نیشانەی بازرگانی' : 'Sticker Logo / Icon'}</label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-[11px]"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <ImageIcon className="h-3.5 w-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                    <span>{isKurdish ? 'بارکردنی وێنە' : 'Upload Image'}</span>
                  </Button>
                  {imageSrc && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={handleClearLogo}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {imageSrc && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-muted-foreground">{isKurdish ? 'سایزی وێنە لە بەرزی ستیكەر' : 'Image Height %'}</span>
                      <span className="font-mono text-[9px]">{imageHeight}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={imageHeight}
                      onChange={(e) => setImageHeight(parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-muted accent-primary cursor-pointer rounded-lg border border-border"
                    />
                  </div>
                )}
              </div>
            )}

            {stickerLayout !== 'image-only' && stickerLayout !== 'qr-only' && (
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground block">{isKurdish ? 'نووسینی سەر ستیكەر' : 'Sticker Text Lines'}</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2 rounded-md border border-border bg-card text-foreground focus:outline-none"
                  placeholder="Product description..."
                />

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[9px] text-muted-foreground">{isKurdish ? 'قەبارەی فۆنت' : 'Font Size'}</span>
                      <span className="font-mono text-[9px]">{textFontSize}pt</span>
                    </div>
                    <Input
                      type="number"
                      min={6}
                      max={40}
                      value={textFontSize}
                      onChange={(e) => setTextFontSize(parseInt(e.target.value, 10) || 8)}
                      onWheel={(e) => e.currentTarget.blur()} 
                className="h-8 text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground block">{isKurdish ? 'ڕەنگی دەق' : 'Text Color'}</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-7 h-7 rounded border cursor-pointer bg-transparent"
                      />
                      <Input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="h-8 p-1 text-[9px] focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={textBold}
                      onChange={(e) => setTextBold(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-primary focus:ring-primary bg-card border-border"
                    />
                    <span>{isKurdish ? 'تۆخ (Bold)' : 'Bold'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={textCenter}
                      onChange={(e) => setTextCenter(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-primary focus:ring-primary bg-card border-border"
                    />
                    <span>{isKurdish ? 'ناوەڕاست' : 'Center align'}</span>
                  </label>
                </div>
              </div>
            )}

            {/* QR Code generator details */}
            {(stickerLayout === 'vertical' || stickerLayout === 'horizontal-qr' || stickerLayout === 'qr-only') && (
              <div className="space-y-2 border-t border-border/40 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                    <QrCode className="h-3.5 w-3.5" />
                    <span>{isKurdish ? 'کۆدی QR' : 'QR Code Widget'}</span>
                  </label>
                  {stickerLayout === 'vertical' && (
                    <input
                      type="checkbox"
                      checked={qrCodeEnabled}
                      onChange={(e) => setQrCodeEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary bg-card border-border"
                    />
                  )}
                </div>

                {(qrCodeEnabled || stickerLayout === 'horizontal-qr' || stickerLayout === 'qr-only') && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground">{isKurdish ? 'ناوەڕۆکی QR کۆد' : 'QR Code Text / URL'}</label>
                      <Input
                        type="text"
                        value={qrCodeText}
                        onChange={(e) => setQrCodeText(e.target.value)}
                        className="h-8 text-xs focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-muted-foreground">{isKurdish ? 'سایزی QR لە بەرزی ستیكەر' : 'QR Code Size'}</span>
                        <span className="font-mono text-[9px]">{qrCodeSize}%</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="80"
                        value={qrCodeSize}
                        onChange={(e) => setQrCodeSize(parseInt(e.target.value, 10))}
                        className="w-full h-1 bg-muted accent-primary cursor-pointer rounded-lg border border-border"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* 2. Right Canvas: A4 Preview Grid */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 custom-scrollbar scroll-smooth paper-canvas flex flex-col items-center print:p-0 print:m-0 print:block">
        {Array.from({ length: totalPages }).map((_, pageIdx) => {
          const startIdx = pageIdx * labelsPerPage;
          const endIdx = Math.min(totalLabels, startIdx + labelsPerPage);
          const labelsOnThisPage = endIdx - startIdx;
          
          return (
            <div
              key={pageIdx}
              className="relative flex flex-col items-center overflow-visible print-scale-container my-8"
              style={{
                width: `calc(${widthMm}mm * ${zoom})`,
                height: `calc(${heightMm}mm * ${zoom})`,
                maxWidth: '100%',
                transition: 'all 0.2s ease-out',
                marginBottom: '40px'
              }}
            >
              <div
                className="flex flex-col items-center origin-top transition-transform duration-200 ease-out print-scale-container"
                style={{
                  transform: `scale(${zoom})`,
                  width: `${widthMm}mm`,
                  height: `${heightMm}mm`,
                }}
              >
                {/* A4 Sticker Sheet */}
                <div
                  className={cn(
                    orientation === 'landscape' ? 'a4-page-landscape' : 'a4-page',
                    "stickers-print-page relative mx-auto ring-1 ring-black/5 print:ring-0 shadow-lg flex flex-col print:scale-100 print:shadow-none print:border-none print:relative print:transform-none"
                  )}
                  style={{
                    paddingTop: `${pageMarginTop}mm`,
                    paddingBottom: `${pageMarginBottom}mm`,
                    paddingLeft: `${pageMarginLeft}mm`,
                    paddingRight: `${pageMarginRight}mm`,
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={gridStyle}>
                    {Array.from({ length: labelsOnThisPage }).map((_, localIdx) => {
                      const globalIdx = startIdx + localIdx;
                      return (
                        <StickerCell
                          key={globalIdx}
                          stickerWidth={stickerWidth}
                          stickerHeight={stickerHeight}
                          shape={shape}
                          borderRadius={borderRadius}
                          borderEnabled={borderEnabled}
                          borderWidth={borderWidth}
                          borderStyle={borderStyle}
                          borderColor={borderColor}
                          backgroundColor={backgroundColor}
                          stickerLayout={stickerLayout}
                          imageSrc={imageSrc}
                          text={text}
                          textColor={textColor}
                          textFontSize={textFontSize}
                          textBold={textBold}
                          textCenter={textCenter}
                          qrCodeText={qrCodeText}
                          qrCodeEnabled={qrCodeEnabled}
                          qrCodeSize={qrCodeSize}
                          imageHeight={imageHeight}
                          ImageIcon={ImageIcon}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </main>

    </div>
  );
};
