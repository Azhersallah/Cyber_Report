import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import html2canvas from 'html2canvas';
import { Photo, Annotation, CropData } from '../../types';
import { 
  X, Type, Square, Save, Circle, 
  Trash2, Layers, ArrowUp, ArrowDown,
  Check, Crop, MousePointer2,
  Image as ImageIcon, Sliders,
  Paintbrush, Minus, Droplet, RotateCw,
  Scan, Maximize2, Monitor, Smartphone, Layout,
  Move, StretchHorizontal, StretchVertical,
  ArrowLeftRight, Eraser, Loader2,
  Lock, Unlock, Waves, ImagePlus, PenTool, Palette, Eye,
  ZoomIn, ZoomOut
} from 'lucide-react';
import { generateId } from '../../utils/helpers';
import { useApp } from '../../store/AppContext';
import { getTranslation } from '../../utils/translations';
import { FONTS } from '../../constants';

// Scrollable Slider Component - supports mouse wheel to change value
const ScrollSlider: React.FC<{
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}> = ({ min, max, step = 1, value, onChange, className = '' }) => {
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -step : step;
    const multiplier = 5; // 5x speed for scroll
    const newValue = Math.min(max, Math.max(min, value + (delta * multiplier)));
    onChange(Number(newValue.toFixed(2)));
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      onWheel={handleWheel}
      className={`w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary ${className}`}
    />
  );
};


interface ImageEditorProps {
  photo: Photo;
  onClose: () => void;
  onSave?: (dataUrl: string) => void;
}

type ToolMode = 'select' | 'crop' | 'brush' | 'perspective' | 'transform' | 'liquify' | 'eraser';
type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';
type LiquifyMode = 'push' | 'bloat' | 'pinch' | 'twirl-cw' | 'twirl-ccw';

// --- Transform Matrix Utilities ---
const getPerspectiveTransform = (src: {x: number, y: number}[], dst: {x: number, y: number}[]) => {
  const a: number[][] = [];
  for (let i = 0; i < 4; i++) {
    a.push([src[i].x, src[i].y, 1, 0, 0, 0, -src[i].x * dst[i].x, -src[i].y * dst[i].x]);
    a.push([0, 0, 0, src[i].x, src[i].y, 1, -src[i].x * dst[i].y, -src[i].y * dst[i].y]);
  }
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    b.push(dst[i].x);
    b.push(dst[i].y);
  }
  
  const n = 8;
  for (let i = 0; i < n; i++) {
    let max = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(a[j][i]) > Math.abs(a[max][i])) max = j;
    }
    [a[i], a[max]] = [a[max], a[i]];
    [b[i], b[max]] = [b[max], b[i]];
    for (let j = i + 1; j < n; j++) {
      const f = a[j][i] / a[i][i];
      b[j] -= f * b[i];
      for (let k = i; k < n; k++) a[j][k] -= f * a[i][k];
    }
  }
  const x = new Array(8);
  for (let i = n - 1; i >= 0; i--) {
    let s = 0;
    for (let j = i + 1; j < n; j++) s += a[i][j] * x[j];
    x[i] = (b[i] - s) / a[i][i];
  }
  return [...x, 1];
};

const BlurAnnotationCanvas: React.FC<{
  annotation: Annotation;
  imageSrc: string;
  rotation: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}> = ({ annotation, imageSrc, rotation, containerRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const renderBlur = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !imageSrc) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        
        img.onload = () => {
             const displayedImg = container.querySelector('img.main-image') as HTMLImageElement;
             if (!displayedImg) return;

             const iRect = displayedImg.getBoundingClientRect();
             const cRect = container.getBoundingClientRect();
             
             const pixelScale = 2; 
             const annoW = (annotation.width / 100) * cRect.width;
             const annoH = (annotation.height / 100) * cRect.height;
             
             canvas.width = annoW * pixelScale;
             canvas.height = annoH * pixelScale;
             
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             ctx.filter = `blur(${ (annotation.blurAmount || 5) * pixelScale }px)`;
             ctx.scale(pixelScale, pixelScale);
             
             const annoX = (annotation.x / 100) * cRect.width;
             const annoY = (annotation.y / 100) * cRect.height;

             const imgX = iRect.left - cRect.left;
             const imgY = iRect.top - cRect.top;

             ctx.save();
             const centerX = (imgX - annoX) + (iRect.width / 2);
             const centerY = (imgY - annoY) + (iRect.height / 2);
             
             ctx.translate(centerX, centerY);
             ctx.rotate((rotation * Math.PI) / 180);
             ctx.translate(-iRect.width / 2, -iRect.height / 2);
             ctx.drawImage(img, 0, 0, iRect.width, iRect.height);
             ctx.restore();
        };
    };

    const t = setTimeout(renderBlur, 50);
    return () => clearTimeout(t);
  }, [annotation.x, annotation.y, annotation.width, annotation.height, annotation.blurAmount, imageSrc, rotation, containerRef]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

const ToolbarButton: React.FC<{
  active?: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label?: string;
  tooltip?: string;
  disabled?: boolean;
  variant?: 'default' | 'primary';
  isKurdish?: boolean;
}> = ({ active, onClick, icon: Icon, tooltip, disabled, isKurdish }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + rect.height / 2,
        left: rect.right + 8
      });
    }
    setShowTooltip(true);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        className={`relative group flex items-center justify-center p-1.5 rounded-md transition-all duration-150 outline-none w-8 h-8
          ${active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }
          ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
        `}
      >
        <Icon size={16} strokeWidth={2} />
      </button>
      {tooltip && showTooltip && ReactDOM.createPortal(
        <div
          className="fixed px-2 py-1 bg-foreground text-background text-xs rounded shadow-lg whitespace-nowrap pointer-events-none"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: 'translateY(-50%)',
            zIndex: 99999,
            fontFamily: isKurdish ? '"Noto Kufi Arabic", sans-serif' : 'inherit'
          }}
          dir={isKurdish ? 'rtl' : 'ltr'}
        >
          {tooltip}
        </div>,
        document.body
      )}
    </div>
  );
};

const ToolbarSeparator = () => <div className="h-px w-full bg-border my-0.5" />;

const ImageEditor: React.FC<ImageEditorProps> = ({ photo, onClose, onSave }) => {
  const { state, dispatch } = useApp();
  const t = (key: string) => getTranslation(key, state.language);
  
  const [currentSrc, setCurrentSrc] = useState(photo.src);
  const [currentRotation, setCurrentRotation] = useState(photo.rotation);
  const [annotations, setAnnotations] = useState<Annotation[]>(photo.annotations || []);
  const [selectedAnnoId, setSelectedAnnoId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [activeTab, setActiveTab] = useState<'props' | 'layers'>('layers');
  const [isSaving, setIsSaving] = useState(false);

  
  // Image layer state
  const [imageLayerLocked, setImageLayerLocked] = useState(false);
  const [imageLayerSelected, setImageLayerSelected] = useState(false);
  const [canvasBgColor, setCanvasBgColor] = useState('transparent');
  
  // Image adjustment filters (CSS filter supported only)
  const [imageFilters, setImageFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotate: 0,
    blur: 0,
    grayscale: 0,
    sepia: 0,
  });
  
  const resetImageFilters = () => {
    setImageFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hueRotate: 0,
      blur: 0,
      grayscale: 0,
      sepia: 0,
    });
  };
  
  // Generate CSS filter string
  const getImageFilterStyle = () => {
    const filters = [
      `brightness(${imageFilters.brightness}%)`,
      `contrast(${imageFilters.contrast}%)`,
      `saturate(${imageFilters.saturation}%)`,
      `hue-rotate(${imageFilters.hueRotate}deg)`,
      `blur(${imageFilters.blur}px)`,
      `grayscale(${imageFilters.grayscale}%)`,
      `sepia(${imageFilters.sepia}%)`,
    ];
    return filters.join(' ');
  };
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);
  const [brushSettings, setBrushSettings] = useState({ color: '#ef4444', width: 5 });
  
  // Manual eraser state
  const [eraserSize, setEraserSize] = useState(30);
  const [isErasing, setIsErasing] = useState(false);
  const eraserCanvasRef = useRef<HTMLCanvasElement>(null);
  const eraserCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [crop, setCrop] = useState<CropData>(photo.crop || { x: 0, y: 0, width: 100, height: 100 });
  const [cropAspectRatio, setCropAspectRatio] = useState<string>(state.mode === 'idphoto' ? '27:37' : 'free');
  const [perspectivePoints, setPerspectivePoints] = useState([
    {x: 10, y: 10}, {x: 90, y: 10}, {x: 90, y: 90}, {x: 10, y: 90}
  ]);
  const [perspectiveRatio, setPerspectiveRatio] = useState<string>('free');

  const [skewX, setSkewX] = useState(0);
  const [skewY, setSkewY] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);

  // Editor canvas zoom & pan
  const [editorZoom, setEditorZoom] = useState(1);
  const handleEditorZoomIn = () => setEditorZoom(prev => Math.min(5, Math.round((prev + 0.25) * 100) / 100));
  const handleEditorZoomOut = () => setEditorZoom(prev => Math.max(0.2, Math.round((prev - 0.25) * 100) / 100));
  const handleEditorZoomReset = () => { setEditorZoom(1); setEditorPan({ x: 0, y: 0 }); };
  const editorCanvasAreaRef = useRef<HTMLDivElement>(null);
  const [editorPan, setEditorPan] = useState({ x: 0, y: 0 });
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Ctrl+scroll zoom
  useEffect(() => {
    const el = editorCanvasAreaRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        setEditorZoom(prev => Math.min(5, Math.max(0.2, Math.round((prev + delta) * 100) / 100)));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Space key for panning (like Photoshop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSpaceDown(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  const handlePanMouseDown = (e: React.MouseEvent) => {
    if (isSpaceDown) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: editorPan.x, panY: editorPan.y };
    }
  };
  const handlePanMouseMove = (e: React.MouseEvent) => {
    if (isPanning && isSpaceDown) {
      e.preventDefault();
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setEditorPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
    }
  };
  const handlePanMouseUp = () => {
    setIsPanning(false);
  };

  const [layerDragIndex, setLayerDragIndex] = useState<number | null>(null);
  const [layerDragOverIndex, setLayerDragOverIndex] = useState<number | null>(null);

  const [interaction, setInteraction] = useState<{
    type: 'moving' | 'resizing' | 'cropping' | 'perspecting' | 'idle',
    targetId?: string,
    handle?: ResizeHandle | number,
    startX: number,
    startY: number,
    initialData: any 
  }>({ type: 'idle', startX: 0, startY: 0, initialData: {} });

  // Liquify tool state
  const [liquifyMode, setLiquifyMode] = useState<LiquifyMode>('push');
  const [liquifyBrushSize, setLiquifyBrushSize] = useState(50);
  const [liquifyStrength, setLiquifyStrength] = useState(50);
  const [isLiquifying, setIsLiquifying] = useState(false);
  const liquifyCanvasRef = useRef<HTMLCanvasElement>(null);
  const liquifyCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const liquifyImageDataRef = useRef<ImageData | null>(null);
  const liquifyOriginalDataRef = useRef<ImageData | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (photo.rotation && photo.rotation % 360 !== 0) {
       const img = new Image();
       img.src = photo.src;
       img.crossOrigin = "anonymous";
       img.onload = () => {
           const canvas = document.createElement('canvas');
           const ctx = canvas.getContext('2d');
           if(!ctx) return;
           const rad = (photo.rotation * Math.PI) / 180;
           const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
           const w = img.width, h = img.height;
           const newW = w * cos + h * sin, newH = w * sin + h * cos;
           canvas.width = newW; canvas.height = newH;
           ctx.translate(newW / 2, newH / 2); ctx.rotate(rad);
           ctx.drawImage(img, -w / 2, -h / 2);
           setCurrentSrc(canvas.toDataURL('image/png'));
           setCurrentRotation(0);
       };
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Don't delete annotation if user is typing in an input or textarea
        const target = e.target as HTMLElement;
        const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnoId && toolMode === 'select' && !isTyping) {
            deleteAnnotation(selectedAnnoId);
        }
        if (e.key === 'Escape') toolMode === 'crop' || toolMode === 'perspective' || toolMode === 'transform' ? handleCancelTransform() : setSelectedAnnoId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnoId, toolMode]);

  const addText = () => {
    const container = containerRef.current;
    let width = 20, height = 10;
    
    // Measure initial text size
    if (container) {
      const rect = container.getBoundingClientRect();
      const measureEl = document.createElement('div');
      measureEl.style.cssText = `
        position: absolute;
        visibility: hidden;
        white-space: nowrap;
        font-size: 48px;
        font-family: Inter;
        line-height: 1em;
        margin: 0;
        padding: 0;
      `;
      measureEl.textContent = 'Text';
      document.body.appendChild(measureEl);
      
      width = Math.max(5, ((measureEl.offsetWidth + 2) / rect.width) * 100);
      height = Math.max(3, (measureEl.offsetHeight / rect.height) * 100);
      document.body.removeChild(measureEl);
    }
    
    const newAnno: Annotation = { id: generateId(), type: 'text', x: 40, y: 45, width, height, rotation: 0, text: 'Text', fontSize: 48, color: '#000000', fontFamily: 'Inter' };
    setAnnotations([...annotations, newAnno]); setSelectedAnnoId(newAnno.id); setImageLayerSelected(false); setToolMode('select'); setActiveTab('props');
  };

  const addShape = (shapeType: 'rectangle' | 'circle' | 'line') => {
    const newAnno: Annotation = { id: generateId(), type: shapeType === 'line' ? 'line' : 'shape', shapeType: shapeType as any, x: 35, y: 35, width: 30, height: shapeType === 'line' ? 2 : 30, rotation: 0, borderWidth: 4, fillColor: 'transparent', color: '#ef4444' };
    setAnnotations([...annotations, newAnno]); setSelectedAnnoId(newAnno.id); setImageLayerSelected(false); setToolMode('select'); setActiveTab('props');
  };

  const addBlur = () => {
    const newAnno: Annotation = { id: generateId(), type: 'blur', x: 30, y: 30, width: 20, height: 20, rotation: 0, blurAmount: 8 };
    setAnnotations([...annotations, newAnno]); setSelectedAnnoId(newAnno.id); setImageLayerSelected(false); setToolMode('select'); setActiveTab('props');
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const imgSrc = ev.target?.result as string;
          const newAnno: Annotation = { 
            id: generateId(), 
            type: 'image', 
            x: 25, 
            y: 25, 
            width: 30, 
            height: 30, 
            rotation: 0, 
            imageSrc: imgSrc,
            opacity: 100
          };
          setAnnotations([...annotations, newAnno]); 
          setSelectedAnnoId(newAnno.id); 
          setImageLayerSelected(false); 
          setToolMode('select'); 
          setActiveTab('props');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };


  // Store scale factor for liquify coordinate conversion
  const liquifyScaleRef = useRef<number>(1);

  // Initialize liquify canvas when entering liquify mode
  useEffect(() => {
    if (toolMode === 'liquify' && containerRef.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentSrc;
      
      img.onload = () => {
        const canvas = liquifyCanvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        
        // Use FULL original image resolution for quality
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Calculate display size for CSS (to fit in viewport)
        const containerRect = container.getBoundingClientRect();
        const maxHeight = window.innerHeight * 0.75;
        const maxWidth = containerRect.width || window.innerWidth * 0.6;
        
        const imgAspect = img.width / img.height;
        let displayWidth, displayHeight;
        
        if (img.width / maxWidth > img.height / maxHeight) {
          displayWidth = Math.min(img.width, maxWidth);
          displayHeight = displayWidth / imgAspect;
        } else {
          displayHeight = Math.min(img.height, maxHeight);
          displayWidth = displayHeight * imgAspect;
        }
        
        // Store scale factor for coordinate conversion
        liquifyScaleRef.current = img.width / displayWidth;
        
        // Set CSS display size (canvas internal resolution stays at full image size)
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0, img.width, img.height);
        liquifyCtxRef.current = ctx;
        liquifyImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        liquifyOriginalDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      };
    }
  }, [toolMode, currentSrc]);

  // Liquify brush application
  const applyLiquifyBrush = (x: number, y: number, lastX?: number, lastY?: number) => {
    const canvas = liquifyCanvasRef.current;
    const ctx = liquifyCtxRef.current;
    const imageData = liquifyImageDataRef.current;
    if (!canvas || !ctx || !imageData) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = imageData.data;
    // Scale brush size to full resolution
    const radius = liquifyBrushSize * liquifyScaleRef.current;
    const strength = liquifyStrength / 500;

    // Direction for push mode
    const dx = lastX !== undefined ? x - lastX : 0;
    const dy = lastY !== undefined ? y - lastY : 0;

    const tempData = new Uint8ClampedArray(data);

    for (let py = Math.max(0, Math.floor(y - radius)); py < Math.min(height, Math.ceil(y + radius)); py++) {
      for (let px = Math.max(0, Math.floor(x - radius)); px < Math.min(width, Math.ceil(x + radius)); px++) {
        const distX = px - x;
        const distY = py - y;
        const dist = Math.sqrt(distX * distX + distY * distY);

        if (dist < radius) {
          const falloff = Math.pow(1 - dist / radius, 2);
          const force = falloff * strength;

          let srcX = px;
          let srcY = py;

          switch (liquifyMode) {
            case 'push':
              srcX = px - dx * force * 2;
              srcY = py - dy * force * 2;
              break;
            case 'bloat':
              if (dist > 0) {
                srcX = x + distX * (1 - force * 0.3);
                srcY = y + distY * (1 - force * 0.3);
              }
              break;
            case 'pinch':
              if (dist > 0) {
                srcX = x + distX * (1 + force * 0.3);
                srcY = y + distY * (1 + force * 0.3);
              }
              break;
            case 'twirl-cw':
            case 'twirl-ccw':
              {
                const angle = (liquifyMode === 'twirl-cw' ? 1 : -1) * force * 0.5;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                srcX = x + distX * cos - distY * sin;
                srcY = y + distX * sin + distY * cos;
              }
              break;
          }

          // Bilinear interpolation
          srcX = Math.max(0, Math.min(width - 1, srcX));
          srcY = Math.max(0, Math.min(height - 1, srcY));

          const x0 = Math.floor(srcX);
          const y0 = Math.floor(srcY);
          const x1 = Math.min(x0 + 1, width - 1);
          const y1 = Math.min(y0 + 1, height - 1);
          const xFrac = srcX - x0;
          const yFrac = srcY - y0;

          const idx = (py * width + px) * 4;
          const idx00 = (y0 * width + x0) * 4;
          const idx10 = (y0 * width + x1) * 4;
          const idx01 = (y1 * width + x0) * 4;
          const idx11 = (y1 * width + x1) * 4;

          for (let c = 0; c < 4; c++) {
            const v00 = tempData[idx00 + c];
            const v10 = tempData[idx10 + c];
            const v01 = tempData[idx01 + c];
            const v11 = tempData[idx11 + c];
            const v0 = v00 * (1 - xFrac) + v10 * xFrac;
            const v1 = v01 * (1 - xFrac) + v11 * xFrac;
            data[idx + c] = v0 * (1 - yFrac) + v1 * yFrac;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleLiquifyMouseDown = (e: React.MouseEvent) => {
    if (toolMode !== 'liquify') return;
    setIsLiquifying(true);
    const canvas = liquifyCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Scale coordinates to full resolution
    const scale = liquifyScaleRef.current;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    applyLiquifyBrush(x, y);
  };

  const lastLiquifyPos = useRef<{x: number, y: number} | null>(null);

  const handleLiquifyMouseMove = (e: React.MouseEvent) => {
    if (!isLiquifying || toolMode !== 'liquify') return;
    const canvas = liquifyCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Scale coordinates to full resolution
    const scale = liquifyScaleRef.current;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    applyLiquifyBrush(x, y, lastLiquifyPos.current?.x, lastLiquifyPos.current?.y);
    lastLiquifyPos.current = { x, y };
  };

  const handleLiquifyMouseUp = () => {
    setIsLiquifying(false);
    lastLiquifyPos.current = null;
  };

  const applyLiquifyToImage = () => {
    const canvas = liquifyCanvasRef.current;
    if (!canvas) return;
    setCurrentSrc(canvas.toDataURL('image/png'));
    setToolMode('select');
  };

  const resetLiquify = () => {
    const canvas = liquifyCanvasRef.current;
    const ctx = liquifyCtxRef.current;
    const originalData = liquifyOriginalDataRef.current;
    if (!canvas || !ctx || !originalData) return;
    
    ctx.putImageData(originalData, 0, 0);
    liquifyImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  // Manual Eraser - Initialize canvas when entering eraser mode
  const eraserScaleRef = useRef<number>(1);
  
  useEffect(() => {
    if (toolMode === 'eraser' && containerRef.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentSrc;
      
      img.onload = () => {
        const canvas = eraserCanvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        
        // Use full original image resolution
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Calculate display size
        const containerRect = container.getBoundingClientRect();
        const maxHeight = window.innerHeight * 0.75;
        const maxWidth = containerRect.width || window.innerWidth * 0.6;
        
        const imgAspect = img.width / img.height;
        let displayWidth, displayHeight;
        
        if (img.width / maxWidth > img.height / maxHeight) {
          displayWidth = Math.min(img.width, maxWidth);
          displayHeight = displayWidth / imgAspect;
        } else {
          displayHeight = Math.min(img.height, maxHeight);
          displayWidth = displayHeight * imgAspect;
        }
        
        eraserScaleRef.current = img.width / displayWidth;
        
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0, img.width, img.height);
        eraserCtxRef.current = ctx;
      };
    }
  }, [toolMode, currentSrc]);

  const handleEraserMouseDown = (e: React.MouseEvent) => {
    if (toolMode !== 'eraser') return;
    setIsErasing(true);
    eraseAt(e);
  };

  const handleEraserMouseMove = (e: React.MouseEvent) => {
    if (!isErasing || toolMode !== 'eraser') return;
    eraseAt(e);
  };

  const handleEraserMouseUp = () => {
    setIsErasing(false);
  };

  const eraseAt = (e: React.MouseEvent) => {
    const canvas = eraserCanvasRef.current;
    const ctx = eraserCtxRef.current;
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const scale = eraserScaleRef.current;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    const radius = eraserSize * scale;
    
    // Erase by making pixels transparent
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  };

  const applyEraserToImage = () => {
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    setCurrentSrc(canvas.toDataURL('image/png'));
    setToolMode('select');
  };

  const resetEraser = () => {
    const canvas = eraserCanvasRef.current;
    const ctx = eraserCtxRef.current;
    if (!canvas || !ctx) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentSrc;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  };



  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setAnnotations(prev => prev.map(a => {
      if (a.id !== id) return a;
      const updated = { ...a, ...updates };
      
      // Auto-resize text annotations when text, fontSize, or fontFamily changes
      if (updated.type === 'text' && (updates.text !== undefined || updates.fontSize !== undefined || updates.fontFamily !== undefined)) {
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          // Create a temporary element to measure text (supports multi-line)
          const measureEl = document.createElement('div');
          measureEl.style.cssText = `
            position: absolute;
            visibility: hidden;
            white-space: pre-wrap;
            word-break: break-word;
            line-height: 1em;
            font-size: ${updated.fontSize}px;
            font-family: ${updated.fontFamily};
            margin: 0;
            padding: 0;
          `;
          // Use innerHTML to preserve line breaks
          measureEl.innerHTML = (updated.text || 'Text').replace(/\n/g, '<br>');
          document.body.appendChild(measureEl);
          
          const textWidth = measureEl.offsetWidth + 2; // Small buffer
          const textHeight = measureEl.offsetHeight;
          document.body.removeChild(measureEl);
          
          // Convert to percentage of container
          updated.width = Math.max(5, (textWidth / rect.width) * 100);
          updated.height = Math.max(3, (textHeight / rect.height) * 100);
        }
      }
      
      return updated;
    }));
  };
  const deleteAnnotation = (id: string) => { setAnnotations(prev => prev.filter(a => a.id !== id)); if (selectedAnnoId === id) setSelectedAnnoId(null); };

  const moveLayer = (id: string, direction: 'front' | 'back' | 'up' | 'down') => {
    const index = annotations.findIndex(a => a.id === id);
    if (index === -1) return;
    let newAnnos = [...annotations];
    const item = newAnnos.splice(index, 1)[0];
    if (direction === 'front') newAnnos.push(item);
    else if (direction === 'back') newAnnos.unshift(item);
    else if (direction === 'up') newAnnos.splice(Math.min(index + 1, newAnnos.length), 0, item);
    else if (direction === 'down') newAnnos.splice(Math.max(index - 1, 0), 0, item);
    setAnnotations(newAnnos);
  };

  const reorderLayers = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newAnnos = [...annotations];
    const [item] = newAnnos.splice(fromIndex, 1);
    newAnnos.splice(toIndex, 0, item);
    setAnnotations(newAnnos);
  };

  const handleApplyCrop = async () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (html2canvas) {
        try {
            const cropOverlay = document.getElementById('crop-overlay');
            if (cropOverlay) cropOverlay.style.display = 'none';
            const canvas = await html2canvas(containerRef.current, { scale: 2, backgroundColor: null, logging: false, useCORS: true, x: (crop.x/100)*rect.width, y: (crop.y/100)*rect.height, width: (crop.width/100)*rect.width, height: (crop.height/100)*rect.height });
            if (cropOverlay) cropOverlay.style.display = 'block';
            setCurrentSrc(canvas.toDataURL('image/png', 0.9)); setCurrentRotation(0); setCrop({ x: 0, y: 0, width: 100, height: 100 }); setToolMode('select');
        } catch (e) { console.error(e); }
    }
  };

  const handleApplyPerspective = async () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let outW = 1000, outH = 1000;
      
      // For business card mode, use actual slot dimensions
      // Business card slots are in a 2x5 grid on A4 page (210mm x 297mm)
      // Each slot is 105mm x 59.4mm (210/2 x 297/5)
      // Ratio: 105:59.4 ≈ 1.768:1
      // Output at high resolution: 2100px x 1188px
      if (state.mode === 'businesscard') {
        outW = 2100;
        outH = 1188;
      } else if (perspectiveRatio !== 'free') {
          const [w, h] = perspectiveRatio.split(':').map(Number);
          outH = (h / w) * outW;
      } else {
          const avgW = (Math.abs(perspectivePoints[1].x - perspectivePoints[0].x) + Math.abs(perspectivePoints[2].x - perspectivePoints[3].x)) / 2;
          const avgH = (Math.abs(perspectivePoints[3].y - perspectivePoints[0].y) + Math.abs(perspectivePoints[2].y - perspectivePoints[1].y)) / 2;
          outH = (avgH / avgW) * outW;
      }
      
      canvas.width = outW; canvas.height = outH;
      const srcPts = perspectivePoints.map(p => ({ x: (p.x / 100) * img.width, y: (p.y / 100) * img.height }));
      const dstPts = [{x: 0, y: 0}, {x: outW, y: 0}, {x: outW, y: outH}, {x: 0, y: outH}];
      const hMatrix = getPerspectiveTransform(dstPts, srcPts);
      const imgData = ctx.createImageData(outW, outH);
      const data = imgData.data;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width; tempCanvas.height = img.height;
      const tCtx = tempCanvas.getContext('2d');
      if (!tCtx) return;
      tCtx.drawImage(img, 0, 0);
      const sourceData = tCtx.getImageData(0, 0, img.width, img.height).data;

      for (let y = 0; y < outH; y++) {
        for (let x = 0; x < outW; x++) {
          const z = hMatrix[6] * x + hMatrix[7] * y + hMatrix[8];
          const px = (hMatrix[0] * x + hMatrix[1] * y + hMatrix[2]) / z;
          const py = (hMatrix[3] * x + hMatrix[4] * y + hMatrix[5]) / z;
          if (px >= 0 && px < img.width && py >= 0 && py < img.height) {
            const ix = Math.floor(px), iy = Math.floor(py);
            const srcIdx = (iy * img.width + ix) * 4, dstIdx = (y * outW + x) * 4;
            data[dstIdx] = sourceData[srcIdx]; data[dstIdx+1] = sourceData[srcIdx+1]; data[dstIdx+2] = sourceData[srcIdx+2]; data[dstIdx+3] = sourceData[srcIdx+3];
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
      setCurrentSrc(canvas.toDataURL('image/png'));
      setToolMode('select');
    };
  };

  const handleApplyTransform = async () => {
    // Use canvas directly for proper transparent background with skew
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentSrc;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate the bounding box after transform
      const rad = (currentRotation * Math.PI) / 180;
      const skewXRad = (skewX * Math.PI) / 180;
      const skewYRad = (skewY * Math.PI) / 180;
      
      const w = img.width * Math.abs(scaleX);
      const h = img.height * Math.abs(scaleY);
      
      // Calculate corners after skew transform
      const corners = [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h }
      ].map(p => ({
        x: p.x + p.y * Math.tan(skewXRad),
        y: p.y + p.x * Math.tan(skewYRad)
      }));
      
      // Find bounding box
      const minX = Math.min(...corners.map(c => c.x));
      const maxX = Math.max(...corners.map(c => c.x));
      const minY = Math.min(...corners.map(c => c.y));
      const maxY = Math.max(...corners.map(c => c.y));
      
      const newW = Math.ceil(maxX - minX);
      const newH = Math.ceil(maxY - minY);
      
      canvas.width = newW;
      canvas.height = newH;
      
      // Clear with transparent background
      ctx.clearRect(0, 0, newW, newH);
      
      // Apply transforms
      ctx.translate(-minX, -minY);
      ctx.transform(1, Math.tan(skewYRad), Math.tan(skewXRad), 1, 0, 0);
      ctx.scale(scaleX, scaleY);
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      setCurrentSrc(canvas.toDataURL('image/png'));
      setSkewX(0); setSkewY(0); setScaleX(1); setScaleY(1);
      setToolMode('select');
    };
  };

  const handleCancelTransform = () => {
      setCrop(photo.crop || { x: 0, y: 0, width: 100, height: 100 });
      setPerspectivePoints([{x: 10, y: 10}, {x: 90, y: 10}, {x: 90, y: 90}, {x: 10, y: 90}]);
      setSkewX(0); setSkewY(0); setScaleX(1); setScaleY(1);
      setToolMode('select');
  };

  const handleSave = async () => {
    if (isSaving) return; 
    setIsSaving(true); 
    setSelectedAnnoId(null); 
    setToolMode('select'); 
    
    setTimeout(async () => {
      try {
        const container = containerRef.current;
        if (!container) { setIsSaving(false); return; }
        
        const containerRect = container.getBoundingClientRect();
        
        // Create canvas with same dimensions as display (scale 1 for exact size match)
        const canvas = document.createElement('canvas');
        const scale = 1; // Use scale 1 to maintain exact visual size
        canvas.width = containerRect.width * scale;
        canvas.height = containerRect.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) { setIsSaving(false); return; }
        
        ctx.scale(scale, scale);
        
        // Draw background color first (if not transparent)
        if (canvasBgColor && canvasBgColor !== 'transparent') {
          ctx.fillStyle = canvasBgColor;
          ctx.fillRect(0, 0, containerRect.width, containerRect.height);
        }
        
        // Draw the base image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = currentSrc;
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
        });
        
        // Calculate image position (centered)
        const imgAspect = img.width / img.height;
        const containerAspect = containerRect.width / containerRect.height;
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > containerAspect) {
          drawWidth = containerRect.width;
          drawHeight = containerRect.width / imgAspect;
          drawX = 0;
          drawY = (containerRect.height - drawHeight) / 2;
        } else {
          drawHeight = containerRect.height;
          drawWidth = containerRect.height * imgAspect;
          drawX = (containerRect.width - drawWidth) / 2;
          drawY = 0;
        }
        
        // Apply transforms and draw image
        ctx.save();
        
        // Apply CSS-like filters to canvas
        const filterString = [
          `brightness(${imageFilters.brightness}%)`,
          `contrast(${imageFilters.contrast}%)`,
          `saturate(${imageFilters.saturation}%)`,
          `hue-rotate(${imageFilters.hueRotate}deg)`,
          `blur(${imageFilters.blur}px)`,
          `grayscale(${imageFilters.grayscale}%)`,
          `sepia(${imageFilters.sepia}%)`,
        ].join(' ');
        ctx.filter = filterString;
        
        ctx.translate(containerRect.width / 2, containerRect.height / 2);
        ctx.rotate((currentRotation * Math.PI) / 180);
        ctx.scale(scaleX, scaleY);
        ctx.transform(1, Math.tan((skewY * Math.PI) / 180), Math.tan((skewX * Math.PI) / 180), 1, 0, 0);
        ctx.translate(-containerRect.width / 2, -containerRect.height / 2);
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
        
        // Draw annotations in order (z-index)
        for (const anno of annotations) {
          const x = (anno.x / 100) * containerRect.width;
          const y = (anno.y / 100) * containerRect.height;
          const w = (anno.width / 100) * containerRect.width;
          const h = (anno.height / 100) * containerRect.height;
          
          ctx.save();
          
          // Apply rotation around center of annotation
          if (anno.rotation) {
            ctx.translate(x + w / 2, y + h / 2);
            ctx.rotate((anno.rotation * Math.PI) / 180);
            ctx.translate(-(x + w / 2), -(y + h / 2));
          }
          
          if (anno.type === 'text') {
            ctx.font = `${anno.fontSize}px ${anno.fontFamily}`;
            ctx.fillStyle = anno.color || '#000000';
            ctx.textBaseline = 'top';
            
            // Handle multi-line text
            const lines = (anno.text || '').split('\n');
            const lineHeight = (anno.fontSize || 16) * 1;
            lines.forEach((line, i) => {
              ctx.fillText(line, x, y + (i * lineHeight));
            });
          } else if (anno.type === 'shape') {
            if (anno.fillColor && anno.fillColor !== 'transparent') {
              ctx.fillStyle = anno.fillColor;
              if (anno.shapeType === 'circle') {
                ctx.beginPath();
                ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
                ctx.fill();
              } else {
                ctx.fillRect(x, y, w, h);
              }
            }
            if (anno.borderWidth && anno.color) {
              ctx.strokeStyle = anno.color;
              ctx.lineWidth = anno.borderWidth;
              if (anno.shapeType === 'circle') {
                ctx.beginPath();
                ctx.ellipse(x + w / 2, y + h / 2, w / 2 - anno.borderWidth / 2, h / 2 - anno.borderWidth / 2, 0, 0, Math.PI * 2);
                ctx.stroke();
              } else {
                ctx.strokeRect(x + anno.borderWidth / 2, y + anno.borderWidth / 2, w - anno.borderWidth, h - anno.borderWidth);
              }
            }
          } else if (anno.type === 'line') {
            ctx.strokeStyle = anno.color || '#000000';
            ctx.lineWidth = anno.borderWidth || 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x, y + h / 2);
            ctx.lineTo(x + w, y + h / 2);
            ctx.stroke();
          } else if (anno.type === 'brush' && anno.points) {
            ctx.strokeStyle = anno.color || '#000000';
            // Scale brush width to match display rendering (display uses borderWidth / 3 with non-scaling-stroke)
            // The display SVG viewBox is 100x100, so we need to scale the width relative to the annotation size
            const avgSize = Math.sqrt(w * h);
            const scaledWidth = ((anno.borderWidth || 2) / 3) * (avgSize / 100);
            ctx.lineWidth = Math.max(1, scaledWidth);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            anno.points.forEach((p, i) => {
              const px = x + (p.x / 100) * w;
              const py = y + (p.y / 100) * h;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            });
            ctx.stroke();
          } else if (anno.type === 'image' && anno.imageSrc) {
            // Draw image layer - need to load image first and wait for it
            const layerImg = new Image();
            layerImg.crossOrigin = 'anonymous';
            layerImg.src = anno.imageSrc;
            await new Promise<void>((resolve) => {
              layerImg.onload = () => {
                ctx.globalAlpha = (anno.opacity ?? 100) / 100;
                
                // Calculate object-contain dimensions to preserve aspect ratio
                const imgAspect = layerImg.width / layerImg.height;
                const boxAspect = w / h;
                let drawW, drawH, drawX, drawY;
                
                if (imgAspect > boxAspect) {
                  // Image is wider - fit to width
                  drawW = w;
                  drawH = w / imgAspect;
                  drawX = x;
                  drawY = y + (h - drawH) / 2;
                } else {
                  // Image is taller - fit to height
                  drawH = h;
                  drawW = h * imgAspect;
                  drawX = x + (w - drawW) / 2;
                  drawY = y;
                }
                
                ctx.drawImage(layerImg, drawX, drawY, drawW, drawH);
                ctx.globalAlpha = 1;
                resolve();
              };
              layerImg.onerror = () => resolve(); // Skip if image fails to load
            });
          }
          // Note: blur effect is complex, using html2canvas fallback for that
          
          ctx.restore();
        }
        
        // Check if there are blur annotations - use html2canvas only for blur (not for images since we handle them above)
        const hasBlur = annotations.some(a => a.type === 'blur');
        if (hasBlur) {
          if (html2canvas) {
            const element = document.getElementById('image-editor-canvas');
            if (element) {
              // Use scale 1 to maintain exact size
              const html2canvasResult = await html2canvas(element, { scale: 1, backgroundColor: null, logging: false, useCORS: true });
              const dataUrl = html2canvasResult.toDataURL('image/png', 0.9);
              if (onSave) { onSave(dataUrl); } else { dispatch({ type: 'UPDATE_PHOTO', payload: { ...photo, src: dataUrl, annotations: [], crop: undefined, rotation: 0 } }); }
              onClose();
              return;
            }
          }
        }
        
        const finalDataUrl = canvas.toDataURL('image/png', 0.9);
        if (onSave) { onSave(finalDataUrl); } else { dispatch({ type: 'UPDATE_PHOTO', payload: { ...photo, src: finalDataUrl, annotations: [], crop: undefined, rotation: 0 } }); }
        onClose();
      } catch (e) { 
        console.error('Save error:', e);
        onClose(); 
      } finally { 
        setIsSaving(false); 
      }
    }, 150);
  };

  const startInteraction = (e: React.MouseEvent, type: 'moving' | 'resizing' | 'cropping' | 'perspecting', targetId?: string, handle?: ResizeHandle | number) => {
    e.stopPropagation(); if (!containerRef.current) return;
    const { clientX: x, clientY: y } = e;
    let initialData = type === 'cropping' ? { ...crop } : type === 'perspecting' ? [...perspectivePoints] : annotations.find(a => a.id === targetId) || {};
    if (targetId) { setSelectedAnnoId(targetId); setImageLayerSelected(false); setActiveTab('props'); }
    setInteraction({ type, targetId, handle, startX: x, startY: y, initialData });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (interaction.type !== 'idle') return;
    if (toolMode === 'brush' && containerRef.current) {
        setIsDrawing(true); const rect = containerRef.current.getBoundingClientRect();
        setCurrentPath([{x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100}]);
    } else if (e.target === containerRef.current || (e.target as HTMLElement).id === 'image-editor-canvas' || (e.target as HTMLElement).classList.contains('main-image')) { 
      if (toolMode === 'select') {
        setSelectedAnnoId(null);
        // Select image layer if unlocked and clicked on image
        if (!imageLayerLocked && (e.target as HTMLElement).classList.contains('main-image')) {
          setImageLayerSelected(true);
          setActiveTab('props');
        } else {
          setImageLayerSelected(false);
        }
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const { clientX: x, clientY: y } = e;
      if (isDrawing && toolMode === 'brush') {
         setCurrentPath(prev => [...prev, {x: Math.min(100, Math.max(0, ((x - rect.left) / rect.width) * 100)), y: Math.min(100, Math.max(0, ((y - rect.top) / rect.height) * 100))}]);
         return;
      }
      if (interaction.type === 'idle') return;
      const deltaX = ((x - interaction.startX) / rect.width) * 100, deltaY = ((y - interaction.startY) / rect.height) * 100;

      if (interaction.type === 'moving' && interaction.targetId) {
        const init = interaction.initialData as Annotation;
        updateAnnotation(interaction.targetId, { x: init.x + deltaX, y: init.y + deltaY });
      } else if (interaction.type === 'resizing' && interaction.targetId) {
        const init = interaction.initialData as Annotation; const h = interaction.handle as ResizeHandle;
        let nX = init.x, nY = init.y, nW = init.width, nH = init.height;
        if (h.includes('e')) nW = Math.max(2, init.width + deltaX);
        if (h.includes('s')) nH = Math.max(2, init.height + deltaY);
        if (h.includes('w')) { nW = Math.max(2, init.width - deltaX); nX = init.x + deltaX; }
        if (h.includes('n')) { nH = Math.max(2, init.height - deltaY); nY = init.y + deltaY; }
        updateAnnotation(interaction.targetId, { x: nX, y: nY, width: nW, height: nH });
      } else if (interaction.type === 'cropping') {
         const init = interaction.initialData as CropData; const h = interaction.handle as ResizeHandle;
         if (h) {
            let nX = init.x, nY = init.y, nW = init.width, nH = init.height;
            
            // Get aspect ratio if set
            let aspectRatio: number | null = null;
            if (cropAspectRatio !== 'free') {
                if (cropAspectRatio === 'original' && containerRef.current) {
                    const imgEl = containerRef.current.querySelector('img.main-image') as HTMLImageElement;
                    if (imgEl) aspectRatio = imgEl.naturalWidth / imgEl.naturalHeight;
                } else {
                    const [w, h] = cropAspectRatio.split(':').map(Number);
                    aspectRatio = w / h;
                }
            }
            
            if (aspectRatio && rect) {
                // Constrained resize with aspect ratio
                const containerAspect = rect.width / rect.height;
                const targetAspect = aspectRatio / containerAspect;
                
                if (h.includes('e') || h.includes('w')) {
                    // Width is changing, adjust height
                    if (h.includes('e')) nW = Math.min(100 - init.x, Math.max(10, init.width + deltaX));
                    if (h.includes('w')) { const validD = Math.min(init.width - 10, Math.max(-init.x, deltaX)); nW = init.width - validD; nX = init.x + validD; }
                    nH = nW / targetAspect;
                    // Adjust position for corner handles
                    if (h.includes('n')) nY = init.y + init.height - nH;
                } else {
                    // Height is changing, adjust width
                    if (h.includes('s')) nH = Math.min(100 - init.y, Math.max(10, init.height + deltaY));
                    if (h.includes('n')) { const validD = Math.min(init.height - 10, Math.max(-init.y, deltaY)); nH = init.height - validD; nY = init.y + validD; }
                    nW = nH * targetAspect;
                    // Adjust position for corner handles
                    if (h.includes('w')) nX = init.x + init.width - nW;
                }
                
                // Clamp to bounds
                if (nX < 0) { nW += nX; nX = 0; nH = nW / targetAspect; }
                if (nY < 0) { nH += nY; nY = 0; nW = nH * targetAspect; }
                if (nX + nW > 100) { nW = 100 - nX; nH = nW / targetAspect; }
                if (nY + nH > 100) { nH = 100 - nY; nW = nH * targetAspect; }
            } else {
                // Free resize
                if (h.includes('e')) nW = Math.min(100 - init.x, Math.max(10, init.width + deltaX));
                if (h.includes('s')) nH = Math.min(100 - init.y, Math.max(10, init.height + deltaY));
                if (h.includes('w')) { const validD = Math.min(init.width - 10, Math.max(-init.x, deltaX)); nW = init.width - validD; nX = init.x + validD; }
                if (h.includes('n')) { const validD = Math.min(init.height - 10, Math.max(-init.y, deltaY)); nH = init.height - validD; nY = init.y + validD; }
            }
            setCrop({ x: nX, y: nY, width: nW, height: nH });
        } else {
            const maxX = 100 - init.width, maxY = 100 - init.height;
            setCrop({ ...crop, x: Math.min(maxX, Math.max(0, init.x + deltaX)), y: Math.min(maxY, Math.max(0, init.y + deltaY)) });
        }
      } else if (interaction.type === 'perspecting') {
          const idx = interaction.handle as number; const newPts = [...perspectivePoints];
          newPts[idx] = { x: Math.min(100, Math.max(0, interaction.initialData[idx].x + deltaX)), y: Math.min(100, Math.max(0, interaction.initialData[idx].y + deltaY)) };
          setPerspectivePoints(newPts);
      }
    };
    const handleMouseUp = () => { if (isDrawing) {
       if (currentPath.length > 2) {
          const xs = currentPath.map(p => p.x), ys = currentPath.map(p => p.y);
          const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys), w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
          setAnnotations(prev => [...prev, { id: generateId(), type: 'brush', x: minX, y: minY, width: w, height: h, points: currentPath.map(p => ({ x: ((p.x - minX) / w) * 100, y: ((p.y - minY) / h) * 100 })), rotation: 0, color: brushSettings.color, borderWidth: brushSettings.width }]);
       }
       setIsDrawing(false); setCurrentPath([]);
    } setInteraction({ type: 'idle', startX: 0, startY: 0, initialData: {} }); };
    if (interaction.type !== 'idle' || isDrawing) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [interaction, isDrawing, currentPath, toolMode, brushSettings]);

  const COLORS = ['#ffffff', '#000000', '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', 'transparent'];
  const selectedAnno = annotations.find(a => a.id === selectedAnnoId);

  const ResizeHandleBlock = ({ id, h, cursor }: { id?: string, h: ResizeHandle, cursor: string }) => (
    <div onMouseDown={(e) => startInteraction(e, id ? 'resizing' : 'cropping', id, h)} className={`absolute w-3 h-3 bg-background border border-primary rounded-full z-20 shadow-sm ${cursor} hover:scale-125 transition-transform`} style={{ top: h.includes('n') ? '-6px' : h.includes('s') ? 'calc(100% - 6px)' : 'calc(50% - 6px)', left: h.includes('w') ? '-6px' : h.includes('e') ? 'calc(100% - 6px)' : 'calc(50% - 6px)' }} />
  );

  const isKurdish = state.language === 'ku';

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 ${isKurdish ? 'font-kufi' : 'font-sans'}`} 
      dir={isKurdish ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-6xl h-[90vh] bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col border border-border">
        {/* HEADER */}
        <div className="h-12 px-4 border-b border-border bg-card flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground"><ImageIcon size={14} /></div>
                <h2 className="text-sm font-semibold text-foreground">
                    {toolMode === 'crop' ? t('tool.crop') : toolMode === 'perspective' ? 'Perspective' : toolMode === 'transform' ? 'Transform' : t('editor.title')}
                </h2>
            </div>
            <div className="flex items-center gap-2">
                {toolMode === 'crop' || toolMode === 'perspective' || toolMode === 'transform' ? (
                    <>
                       <button onClick={handleCancelTransform} className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">{t('action.cancel')}</button>
                       <button onClick={toolMode === 'crop' ? handleApplyCrop : toolMode === 'perspective' ? handleApplyPerspective : handleApplyTransform} className="px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-all flex items-center gap-1.5"><Check size={14} /> {t('action.apply')}</button>
                    </>
                ) : toolMode === 'liquify' ? (
                    <>
                       <button onClick={() => { resetLiquify(); setToolMode('select'); }} className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">{t('action.cancel')}</button>
                       <button onClick={applyLiquifyToImage} className="px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-all flex items-center gap-1.5"><Check size={14} /> {t('action.apply')}</button>
                    </>
                ) : toolMode === 'eraser' ? (
                    <>
                       <button onClick={() => { resetEraser(); setToolMode('select'); }} className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">{t('action.cancel')}</button>
                       <button onClick={applyEraserToImage} className="px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-all flex items-center gap-1.5"><Check size={14} /> {t('action.apply')}</button>
                    </>
                ) : (
                    <>
                       <button onClick={onClose} className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">Close</button>
                       <button onClick={handleSave} disabled={isSaving} className={`px-3 py-1.5 rounded-md text-xs font-medium text-primary-foreground transition-all flex items-center gap-1.5 ${isSaving ? 'bg-muted cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}>{isSaving ? <><div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div><span>Saving...</span></> : <><Save size={14} /> {t('btn.save')}</>}</button>
                    </>
                )}
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* COMPACT TOOLBAR */}
            <div className="w-12 bg-card border-r border-border flex flex-col items-center py-2 px-1.5 gap-1">
                 <ToolbarButton active={toolMode === 'select'} onClick={() => setToolMode('select')} icon={MousePointer2} tooltip={t('tool.select')} disabled={toolMode === 'crop' || toolMode === 'perspective' || toolMode === 'transform'} isKurdish={state.language === 'ku'} />
                 <ToolbarSeparator />
                 <ToolbarButton active={toolMode === 'crop'} onClick={() => { 
                     setToolMode('crop'); 
                     setSelectedAnnoId(null); 
                     // Auto-apply ID photo aspect ratio when in idphoto mode
                     if (state.mode === 'idphoto' && containerRef.current) {
                         setCropAspectRatio('27:37');
                         const container = containerRef.current;
                         const rect = container.getBoundingClientRect();
                         const targetRatio = 27 / 37;
                         
                         // Calculate crop dimensions for ID photo aspect ratio
                         let newWidth = crop.width;
                         let newHeight = crop.height;
                         const centerX = crop.x + crop.width / 2;
                         const centerY = crop.y + crop.height / 2;
                         const currentCropRatio = (crop.width / 100 * rect.width) / (crop.height / 100 * rect.height);
                         
                         if (currentCropRatio > targetRatio) {
                             newWidth = (crop.height / 100 * rect.height * targetRatio) / rect.width * 100;
                         } else {
                             newHeight = (crop.width / 100 * rect.width / targetRatio) / rect.height * 100;
                         }
                         
                         let newX = Math.max(0, Math.min(100 - newWidth, centerX - newWidth / 2));
                         let newY = Math.max(0, Math.min(100 - newHeight, centerY - newHeight / 2));
                         setCrop({ x: newX, y: newY, width: newWidth, height: newHeight });
                     }
                 }} icon={Crop} tooltip={t('tool.crop')} isKurdish={state.language === 'ku'} />
                 <ToolbarButton active={toolMode === 'perspective'} onClick={() => { setToolMode('perspective'); setSelectedAnnoId(null); }} icon={Scan} tooltip={t('tool.perspective')} isKurdish={state.language === 'ku'} />
                 <ToolbarButton active={toolMode === 'transform'} onClick={() => { setToolMode('transform'); setSelectedAnnoId(null); }} icon={Move} tooltip={t('tool.skew')} isKurdish={state.language === 'ku'} />
                 <ToolbarSeparator />
                 <ToolbarButton active={toolMode === 'brush'} onClick={() => { setToolMode('brush'); setSelectedAnnoId(null); }} icon={Paintbrush} tooltip={t('tool.brush')} disabled={toolMode === 'crop' || toolMode === 'perspective' || toolMode === 'transform'} isKurdish={state.language === 'ku'} />
                 <ToolbarButton onClick={addText} icon={Type} tooltip={t('btn.addText')} disabled={toolMode === 'crop' || toolMode === 'perspective' || toolMode === 'transform'} isKurdish={state.language === 'ku'} />
                 <ToolbarSeparator />
                 <ToolbarButton onClick={() => addShape('rectangle')} icon={Square} tooltip={t('shape.rect')} disabled={toolMode === 'crop' || toolMode === 'perspective' || toolMode === 'transform'} isKurdish={state.language === 'ku'} />
                 <ToolbarButton onClick={() => addShape('circle')} icon={Circle} tooltip={t('shape.circle')} disabled={toolMode === 'crop' || toolMode === 'perspective' || toolMode === 'transform'} isKurdish={state.language === 'ku'} />
                 <ToolbarButton onClick={() => addShape('line')} icon={Minus} tooltip={t('tool.line')} disabled={toolMode === 'crop' || toolMode === 'perspective' || toolMode === 'transform'} isKurdish={state.language === 'ku'} />
                 <ToolbarSeparator />
                 <ToolbarButton onClick={addBlur} icon={Droplet} tooltip={t('tool.blur')} disabled={toolMode === 'crop' || toolMode === 'perspective' || toolMode === 'transform'} isKurdish={state.language === 'ku'} />
                 <ToolbarButton onClick={addImage} icon={ImagePlus} tooltip={t('tool.addImage')} disabled={toolMode === 'crop' || toolMode === 'perspective' || toolMode === 'transform'} isKurdish={state.language === 'ku'} />
                 <ToolbarSeparator />
                 <ToolbarButton active={toolMode === 'eraser'} onClick={() => { setToolMode(toolMode === 'eraser' ? 'select' : 'eraser'); setActiveTab('props'); }} icon={PenTool} tooltip={t('tool.manualEraser')} disabled={toolMode === 'crop' || toolMode === 'perspective' || toolMode === 'transform' || toolMode === 'liquify'} isKurdish={state.language === 'ku'} />
                 <ToolbarButton active={toolMode === 'liquify'} onClick={() => { setToolMode(toolMode === 'liquify' ? 'select' : 'liquify'); setActiveTab('props'); }} icon={Waves} tooltip={t('tool.liquify')} disabled={toolMode === 'crop' || toolMode === 'perspective' || toolMode === 'transform' || toolMode === 'eraser'} isKurdish={state.language === 'ku'} />
            </div>

            <div ref={editorCanvasAreaRef} className="flex-1 bg-muted relative overflow-hidden flex items-center justify-center bg-dot-pattern" style={{ cursor: isSpaceDown ? (isPanning ? 'grabbing' : 'grab') : undefined }} onMouseDown={handlePanMouseDown} onMouseMove={handlePanMouseMove} onMouseUp={handlePanMouseUp} onMouseLeave={handlePanMouseUp}>
               {/* Editor Zoom Controls - fixed position, won't scroll */}
               <div className="absolute bottom-3 left-3 z-50 flex items-center bg-card rounded-md shadow-lg border border-border p-1 gap-0.5" style={{ pointerEvents: 'auto' }}>
                 <button onClick={handleEditorZoomOut} className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground transition-colors" title="Zoom Out"><ZoomOut size={14} /></button>
                 <span className="text-xs font-mono font-medium text-foreground w-10 text-center select-none">{Math.round(editorZoom * 100)}%</span>
                 <button onClick={handleEditorZoomIn} className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground transition-colors" title="Zoom In"><ZoomIn size={14} /></button>
                 <div className="w-px h-4 bg-border mx-0.5"></div>
                 <button onClick={handleEditorZoomReset} className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground transition-colors" title="Reset Zoom"><Maximize2 size={14} /></button>
               </div>
               <div style={{ transform: `scale(${editorZoom}) translate(${editorPan.x / editorZoom}px, ${editorPan.y / editorZoom}px)`, transformOrigin: 'center center', transition: isPanning ? 'none' : 'transform 0.15s ease-out', pointerEvents: isSpaceDown ? 'none' : 'auto' }}>
               <div id="image-editor-canvas" ref={containerRef} onMouseDown={toolMode === 'liquify' ? handleLiquifyMouseDown : toolMode === 'eraser' ? handleEraserMouseDown : handleMouseDown} onMouseMove={toolMode === 'liquify' ? handleLiquifyMouseMove : toolMode === 'eraser' ? handleEraserMouseMove : undefined} onMouseUp={toolMode === 'liquify' ? handleLiquifyMouseUp : toolMode === 'eraser' ? handleEraserMouseUp : undefined} onMouseLeave={toolMode === 'liquify' ? handleLiquifyMouseUp : toolMode === 'eraser' ? handleEraserMouseUp : undefined} className={`relative shadow-2xl transition-all duration-200 ease-out select-none ring-1 ring-border overflow-visible ${toolMode === 'brush' || toolMode === 'liquify' || toolMode === 'eraser' ? 'cursor-crosshair' : 'cursor-default'}`} style={{ backgroundColor: canvasBgColor === 'transparent' ? 'transparent' : canvasBgColor }}>
                  <img 
                    src={currentSrc} 
                    className={`max-h-[75vh] max-w-full block shadow-lg main-image ${toolMode === 'liquify' || toolMode === 'eraser' ? 'hidden' : ''} ${toolMode === 'select' && !imageLayerLocked ? 'cursor-pointer' : 'pointer-events-none'}`}
                    style={{ 
                        transform: `rotate(${currentRotation}deg) scale(${scaleX}, ${scaleY}) skew(${skewX}deg, ${skewY}deg)`,
                        filter: getImageFilterStyle()
                    }} 
                    onClick={(e) => {
                      if (toolMode === 'select' && !imageLayerLocked) {
                        e.stopPropagation();
                        setSelectedAnnoId(null);
                        setImageLayerSelected(true);
                        setActiveTab('props');
                      }
                    }}
                    alt="Editing" 
                  />
                  
                  {/* Liquify Canvas */}
                  {toolMode === 'liquify' && (
                    <canvas 
                      ref={liquifyCanvasRef}
                      className="max-h-[75vh] max-w-full block shadow-lg"
                      style={{ cursor: 'crosshair' }}
                    />
                  )}
                  
                  {/* Manual Eraser Canvas */}
                  {toolMode === 'eraser' && (
                    <canvas 
                      ref={eraserCanvasRef}
                      className="max-h-[75vh] max-w-full block shadow-lg"
                      style={{ cursor: 'crosshair', background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==)' }}
                    />
                  )}
                  
                  {/* PERSPECTIVE TOOL LAYER - SMALL STANDARD ANCHORS */}
                  {toolMode === 'perspective' && (
                    <div className="absolute inset-0 z-40 overflow-visible">
                      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polygon 
                            points={perspectivePoints.map(p => `${p.x},${p.y}`).join(' ')} 
                            fill="rgba(59, 130, 246, 0.08)" 
                            stroke="rgba(255, 255, 255, 0.5)" 
                            strokeWidth="0.3" 
                        />
                        <polyline 
                            points={perspectivePoints.map(p => `${p.x},${p.y}`).join(' ') + ` ${perspectivePoints[0].x},${perspectivePoints[0].y}`} 
                            fill="none" 
                            stroke="#3b82f6" 
                            strokeWidth="0.15" 
                        />
                      </svg>
                      
                      {perspectivePoints.map((p, i) => (
                        <div 
                          key={i} 
                          onMouseDown={(e) => startInteraction(e, 'perspecting', undefined, i)} 
                          className="absolute w-8 h-8 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-move hover:scale-110 transition-transform z-50 group" 
                          style={{ left: `${p.x}%`, top: `${p.y}%` }}
                        >
                            <div className="w-2.5 h-2.5 rounded-full bg-background shadow-md border-2 border-primary ring-1 ring-border transition-transform group-active:scale-75"></div>
                            <div className="absolute w-full h-full rounded-full"></div>
                        </div>
                      ))}
                    </div>
                  )}

                  {toolMode === 'crop' && (
                     <div id="crop-overlay" className="absolute inset-0 z-40 bg-black/60 backdrop-blur-[1px]">
                        <div onMouseDown={(e) => startInteraction(e, 'cropping')} className="absolute border border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move" style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }}>
                            <ResizeHandleBlock h="nw" cursor="cursor-nw-resize" /><ResizeHandleBlock h="ne" cursor="cursor-ne-resize" /><ResizeHandleBlock h="sw" cursor="cursor-sw-resize" /><ResizeHandleBlock h="se" cursor="cursor-se-resize" />
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                                <div className="border-r border-b border-white/20"></div><div className="border-r border-b border-white/20"></div><div className="border-b border-white/20"></div>
                                <div className="border-r border-b border-white/20"></div><div className="border-r border-b border-white/20"></div><div className="border-b border-white/20"></div>
                            </div>
                        </div>
                     </div>
                  )}

                  <div className={`absolute inset-0 pointer-events-none overflow-visible ${toolMode === 'crop' || toolMode === 'perspective' ? 'hidden' : ''}`}>
                     {annotations.map((anno, index) => (
                       <div key={anno.id} onClick={(e) => { if (toolMode === 'select' && !anno.locked) { e.stopPropagation(); setSelectedAnnoId(anno.id); setImageLayerSelected(false); setActiveTab('props'); } }} onMouseDown={(e) => toolMode === 'select' && !anno.locked && startInteraction(e, 'moving', anno.id)} className={`absolute group pointer-events-auto ${anno.locked ? 'cursor-not-allowed !pointer-events-none' : 'cursor-move'}`} style={{ left: `${anno.x}%`, top: `${anno.y}%`, width: `${anno.width}%`, height: `${anno.height}%`, transform: `rotate(${anno.rotation || 0}deg)`, userSelect: 'none', zIndex: index + 1, opacity: anno.locked ? 0.7 : 1 }}>
                         {anno.type === 'text' && <div style={{ color: anno.color, fontSize: `${anno.fontSize}px`, fontFamily: anno.fontFamily, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1em', margin: 0, padding: 0, position: 'absolute', top: 0, left: 0 }}>{anno.text}</div>}
                         {anno.type === 'shape' && <div className="w-full h-full" style={{ border: `${anno.borderWidth}px solid ${anno.color}`, borderRadius: anno.shapeType === 'circle' ? '50%' : '0', backgroundColor: anno.fillColor }} />}
                         {anno.type === 'line' && <div className="w-full h-full flex items-center justify-center"><div style={{ width: '100%', height: `${anno.borderWidth}px`, backgroundColor: anno.color, borderRadius: `${anno.borderWidth}px` }} /></div>}
                         {anno.type === 'brush' && anno.points && <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={anno.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={anno.color} strokeWidth={anno.borderWidth ? anno.borderWidth / 3 : 1} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                         {anno.type === 'blur' && <div className="w-full h-full overflow-hidden relative border border-white/20 rounded-lg shadow-inner bg-white/5"><BlurAnnotationCanvas annotation={anno} imageSrc={currentSrc} rotation={currentRotation} containerRef={containerRef} /></div>}
                         {anno.type === 'image' && anno.imageSrc && <img src={anno.imageSrc} className="w-full h-full object-contain" style={{ opacity: (anno.opacity ?? 100) / 100 }} alt="Layer" draggable={false} />}
                         {selectedAnnoId === anno.id && toolMode === 'select' && !anno.locked && <div className="absolute -inset-2 border-2 border-primary pointer-events-none rounded-sm" style={{ zIndex: 9999 }}><div className="pointer-events-auto"><ResizeHandleBlock id={anno.id} h="nw" cursor="cursor-nw-resize" /><ResizeHandleBlock id={anno.id} h="ne" cursor="cursor-ne-resize" /><ResizeHandleBlock id={anno.id} h="sw" cursor="cursor-sw-resize" /><ResizeHandleBlock id={anno.id} h="se" cursor="cursor-se-resize" /></div></div>}
                         {anno.locked && <div className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"><Lock size={10} className="text-white" /></div>}
                       </div>
                     ))}
                     
                     {/* Live brush preview while drawing */}
                     {isDrawing && currentPath.length > 0 && (
                       <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 9999 }}>
                         <polyline 
                           points={currentPath.map(p => `${p.x},${p.y}`).join(' ')} 
                           fill="none" 
                           stroke={brushSettings.color} 
                           strokeWidth={brushSettings.width / 5} 
                           vectorEffect="non-scaling-stroke"
                           strokeLinecap="round" 
                           strokeLinejoin="round" 
                         />
                       </svg>
                     )}
                  </div>
               </div>
               </div>
            </div>

            {/* COMPACT SIDEBAR */}
            <div className={`w-64 bg-card border-l border-border flex flex-col transition-all duration-300`}>
                <div className="flex border-b border-border flex-shrink-0">
                    <button onClick={() => setActiveTab('layers')} className={`flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'layers' && toolMode !== 'crop' && toolMode !== 'perspective' && toolMode !== 'transform' ? 'text-primary border-b-2 border-primary bg-accent' : 'text-muted-foreground hover:text-foreground'}`}><Layers size={12} /> {t('tab.layers')}</button>
                    <button onClick={() => setActiveTab('props')} className={`flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'props' || toolMode === 'crop' || toolMode === 'perspective' || toolMode === 'transform' ? 'text-primary border-b-2 border-primary bg-accent' : 'text-muted-foreground hover:text-foreground'}`}><Sliders size={12} /> {t('tab.props')}</button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                    {toolMode === 'crop' ? (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <h3 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('crop.aspectRatio')}</h3>
                                {state.mode === 'idphoto' ? (
                                    // ID Photo mode: only show the ID Photo aspect ratio
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-center gap-2 p-3 rounded-md bg-accent border border-primary text-primary">
                                            <Smartphone size={16} />
                                            <span className="font-medium">{t('crop.idphoto')}</span>
                                            <span className="text-[10px] bg-primary/20 px-1.5 py-0.5 rounded">2.7cm × 3.7cm</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground text-center">
                                            {t('crop.idphoto')} (27:37)
                                        </p>
                                    </div>
                                ) : (
                                    // Other modes: show all presets
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            { id: 'free', label: t('crop.free'), icon: Layout },
                                            { id: 'original', label: t('crop.original'), icon: ImageIcon },
                                            { id: '1:1', label: t('crop.square'), icon: Maximize2 },
                                            { id: '4:3', label: '4:3', icon: Monitor },
                                            { id: '3:4', label: '3:4', icon: Smartphone },
                                            { id: '16:9', label: '16:9', icon: Monitor },
                                            { id: '9:16', label: '9:16', icon: Smartphone },
                                        ].map(r => (
                                            <button 
                                                key={r.id}
                                                onClick={() => {
                                                    setCropAspectRatio(r.id);
                                                    // Apply aspect ratio to current crop
                                                    if (r.id !== 'free' && containerRef.current) {
                                                        const container = containerRef.current;
                                                        const rect = container.getBoundingClientRect();
                                                        const imgEl = container.querySelector('img.main-image') as HTMLImageElement;
                                                        
                                                        let targetRatio: number;
                                                        if (r.id === 'original' && imgEl) {
                                                            targetRatio = imgEl.naturalWidth / imgEl.naturalHeight;
                                                        } else {
                                                            const [w, h] = r.id.split(':').map(Number);
                                                            targetRatio = w / h;
                                                        }
                                                        
                                                        // Calculate new crop dimensions maintaining aspect ratio
                                                        let newWidth = crop.width;
                                                        let newHeight = crop.height;
                                                        
                                                        // Adjust based on current crop center
                                                        const centerX = crop.x + crop.width / 2;
                                                        const centerY = crop.y + crop.height / 2;
                                                        
                                                        // Calculate new dimensions
                                                        const currentCropRatio = (crop.width / 100 * rect.width) / (crop.height / 100 * rect.height);
                                                        if (currentCropRatio > targetRatio) {
                                                            // Too wide, reduce width
                                                            newWidth = (crop.height / 100 * rect.height * targetRatio) / rect.width * 100;
                                                        } else {
                                                            // Too tall, reduce height
                                                            newHeight = (crop.width / 100 * rect.width / targetRatio) / rect.height * 100;
                                                        }
                                                        
                                                        // Center the new crop
                                                        let newX = centerX - newWidth / 2;
                                                        let newY = centerY - newHeight / 2;
                                                        
                                                        // Clamp to bounds
                                                        newX = Math.max(0, Math.min(100 - newWidth, newX));
                                                        newY = Math.max(0, Math.min(100 - newHeight, newY));
                                                        
                                                        setCrop({ x: newX, y: newY, width: newWidth, height: newHeight });
                                                    }
                                                }}
                                                className={`flex items-center justify-center gap-1.5 p-2 rounded-md border transition-all text-xs ${
                                                    cropAspectRatio === r.id 
                                                        ? 'bg-accent border-primary text-primary' 
                                                        : 'bg-muted border-transparent text-muted-foreground hover:bg-accent'
                                                }`}
                                            >
                                                <r.icon size={12} />
                                                <span className="font-medium">{r.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : toolMode === 'perspective' ? (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <h3 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Output</h3>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {[
                                        { id: 'free', label: 'Free', icon: Layout },
                                        { id: '85:55', label: 'Card', icon: ImageIcon },
                                        { id: '1:1', label: '1:1', icon: Maximize2 },
                                        { id: '4:3', label: '4:3', icon: Monitor },
                                        { id: '3:4', label: '3:4', icon: Smartphone },
                                        { id: '16:9', label: '16:9', icon: Monitor },
                                        { id: '210:297', label: 'A4', icon: ImageIcon },
                                    ].map(r => (
                                        <button 
                                            key={r.id}
                                            onClick={() => setPerspectiveRatio(r.id)}
                                            className={`flex items-center justify-center gap-1.5 p-2 rounded-md border transition-all text-xs ${perspectiveRatio === r.id ? 'bg-accent border-primary text-primary' : 'bg-muted border-transparent text-muted-foreground hover:bg-accent'}`}
                                        >
                                            <r.icon size={12} />
                                            <span className="font-medium">{r.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : toolMode === 'transform' ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="space-y-2">
                                <h3 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                    <StretchHorizontal size={10} /> Scale
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] text-foreground">
                                        <span>W</span>
                                        <span className="font-mono">{scaleX.toFixed(2)}x</span>
                                    </div>
                                    <ScrollSlider min={0.5} max={2.0} step={0.01} value={scaleX} onChange={setScaleX} />
                                    <div className="flex items-center justify-between text-[10px] text-foreground">
                                        <span>H</span>
                                        <span className="font-mono">{scaleY.toFixed(2)}x</span>
                                    </div>
                                    <ScrollSlider min={0.5} max={2.0} step={0.01} value={scaleY} onChange={setScaleY} />
                                </div>
                            </div>
                            
                            <div className="space-y-2 pt-2 border-t border-border">
                                <h3 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                    <ArrowLeftRight size={10} /> Skew
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] text-foreground">
                                        <span>X</span>
                                        <span className="font-mono">{skewX}°</span>
                                    </div>
                                    <ScrollSlider min={-45} max={45} step={1} value={skewX} onChange={setSkewX} />
                                    <div className="flex items-center justify-between text-[10px] text-foreground">
                                        <span>Y</span>
                                        <span className="font-mono">{skewY}°</span>
                                    </div>
                                    <ScrollSlider min={-45} max={45} step={1} value={skewY} onChange={setSkewY} />
                                </div>
                            </div>

                            <button onClick={() => { setScaleX(1); setScaleY(1); setSkewX(0); setSkewY(0); }} className="w-full py-1.5 bg-muted rounded-md text-[10px] font-medium text-foreground hover:bg-accent transition-colors">Reset</button>
                        </div>
                    ) : toolMode === 'liquify' ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="p-2 bg-accent rounded-md border border-border">
                              <div className="flex items-center gap-2 text-foreground mb-1"><Waves size={14} /><span className="font-medium text-xs">{t('liquify.title')}</span></div>
                              <p className="text-[10px] text-muted-foreground">{t('liquify.mode')}</p>
                            </div>
                            
                            {/* Mode Selection */}
                            <div className="space-y-2">
                              <label className="text-[9px] font-semibold text-muted-foreground uppercase">{t('liquify.mode')}</label>
                              <div className="grid grid-cols-2 gap-1">
                                {([
                                  { id: 'push', icon: Move, label: t('liquify.push') },
                                  { id: 'bloat', icon: Maximize2, label: t('liquify.bloat') },
                                  { id: 'pinch', icon: Scan, label: t('liquify.pinch') },
                                  { id: 'twirl-cw', icon: RotateCw, label: t('liquify.twirlCW') },
                                  { id: 'twirl-ccw', icon: RotateCw, label: t('liquify.twirlCCW') },
                                ] as const).map((m) => (
                                  <button
                                    key={m.id}
                                    onClick={() => setLiquifyMode(m.id)}
                                    className={`p-2 rounded-md border text-xs flex flex-col items-center gap-1 transition-all ${
                                      liquifyMode === m.id
                                        ? 'bg-accent border-primary text-primary'
                                        : 'bg-muted border-transparent text-muted-foreground hover:bg-accent'
                                    }`}
                                  >
                                    <m.icon size={14} className={m.id === 'twirl-ccw' ? 'scale-x-[-1]' : ''} />
                                    <span className="text-[9px]">{m.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Brush Size */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-semibold text-muted-foreground uppercase">{t('liquify.brushSize')}</label>
                                <span className="text-[9px] font-mono bg-muted px-1.5 rounded">{liquifyBrushSize}px</span>
                              </div>
                              <ScrollSlider min={10} max={150} step={1} value={liquifyBrushSize} onChange={setLiquifyBrushSize} />
                            </div>
                            
                            {/* Strength */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-semibold text-muted-foreground uppercase">{t('liquify.strength')}</label>
                                <span className="text-[9px] font-mono bg-muted px-1.5 rounded">{liquifyStrength}%</span>
                              </div>
                              <ScrollSlider min={1} max={100} step={1} value={liquifyStrength} onChange={setLiquifyStrength} />
                            </div>
                            
                            {/* Brush Preview */}
                            <div className="pt-2 border-t border-border">
                              <label className="text-[9px] font-semibold text-muted-foreground uppercase mb-2 block">{t('liquify.preview')}</label>
                              <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center">
                                <div
                                  className="rounded-full border-2 border-primary/50 bg-primary/10"
                                  style={{ width: Math.min(liquifyBrushSize, 80), height: Math.min(liquifyBrushSize, 80) }}
                                />
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="space-y-2 pt-2 border-t border-border">
                              <button onClick={resetLiquify} className="w-full py-1.5 bg-muted rounded-md text-[10px] font-medium text-foreground hover:bg-accent transition-colors">{t('liquify.reset')}</button>
                              <button onClick={applyLiquifyToImage} className="w-full py-1.5 bg-primary text-primary-foreground rounded-md text-[10px] font-medium hover:bg-primary/90 transition-colors">{t('action.apply')}</button>
                            </div>
                        </div>
                    ) : toolMode === 'eraser' ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="p-2 bg-accent rounded-md border border-border">
                              <div className="flex items-center gap-2 text-foreground mb-1">
                                <PenTool size={14} />
                                <span className="font-medium text-xs">{t('tool.manualEraser')}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">{t('eraser.description')}</p>
                            </div>
                            
                            {/* Eraser Size */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-semibold text-muted-foreground uppercase">{t('eraser.size')}</label>
                                <span className="text-[9px] font-mono bg-muted px-1.5 rounded">{eraserSize}px</span>
                              </div>
                              <ScrollSlider min={5} max={100} step={1} value={eraserSize} onChange={setEraserSize} />
                            </div>
                            
                            {/* Brush Preview */}
                            <div className="pt-2 border-t border-border">
                              <label className="text-[9px] font-semibold text-muted-foreground uppercase mb-2 block">{t('eraser.preview')}</label>
                              <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center" style={{ background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAIklEQVQoU2NkYGD4z4AKGFEJ4pUgpACnIpwKsErg1IBTAQB0WAX/xCJFfwAAAABJRU5ErkJggg==)' }}>
                                <div
                                  className="rounded-full border-2 border-destructive/50 bg-destructive/20"
                                  style={{ width: Math.min(eraserSize, 80), height: Math.min(eraserSize, 80) }}
                                />
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="space-y-2 pt-2 border-t border-border">
                              <button onClick={resetEraser} className="w-full py-1.5 bg-muted rounded-md text-[10px] font-medium text-foreground hover:bg-accent transition-colors">{t('eraser.reset')}</button>
                              <button onClick={applyEraserToImage} className="w-full py-1.5 bg-primary text-primary-foreground rounded-md text-[10px] font-medium hover:bg-primary/90 transition-colors">{t('action.apply')}</button>
                            </div>
                        </div>
                    ) : activeTab === 'layers' ? (
                        <div className="space-y-1">
                          {/* Annotation layers */}
                          {[...annotations].reverse().map((anno, reversedIndex) => {
                          const actualIndex = annotations.length - 1 - reversedIndex;
                          return (
                            <div 
                              key={anno.id} 
                              draggable={!anno.locked}
                              onDragStart={(e) => {
                                if (anno.locked) { e.preventDefault(); return; }
                                setLayerDragIndex(actualIndex);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={() => {
                                if (layerDragIndex !== null && layerDragOverIndex !== null && layerDragIndex !== layerDragOverIndex) {
                                  reorderLayers(layerDragIndex, layerDragOverIndex);
                                }
                                setLayerDragIndex(null);
                                setLayerDragOverIndex(null);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setLayerDragOverIndex(actualIndex);
                              }}
                              onDragLeave={() => setLayerDragOverIndex(null)}
                              onClick={() => { if (!anno.locked) { setSelectedAnnoId(anno.id); setImageLayerSelected(false); setToolMode('select'); } }} 
                              className={`flex items-center gap-2 p-2 rounded-md border transition-all ${anno.locked ? 'cursor-not-allowed opacity-60' : 'cursor-grab'} ${selectedAnnoId === anno.id ? 'bg-accent border-primary' : 'bg-muted border-transparent hover:bg-accent'} ${layerDragOverIndex === actualIndex ? 'border-primary border-dashed' : ''} ${layerDragIndex === actualIndex ? 'opacity-50' : ''}`}
                            >
                              <div className="w-6 h-6 rounded bg-card flex items-center justify-center text-muted-foreground">
                                {anno.type === 'text' ? <Type size={12} /> : anno.type === 'brush' ? <Paintbrush size={12} /> : anno.type === 'blur' ? <Droplet size={12} /> : anno.type === 'image' ? <ImagePlus size={12} /> : anno.shapeType === 'circle' ? <Circle size={12} /> : anno.shapeType === 'line' ? <Minus size={12} /> : <Square size={12} />}
                              </div>
                              <div className="flex-1 min-w-0 flex items-center gap-1">
                                <p className="truncate text-xs font-medium text-foreground">{anno.type === 'text' ? (anno.text || 'Text') : anno.type === 'image' ? 'Image' : anno.type}</p>
                                {anno.locked && <Lock size={10} className="text-muted-foreground flex-shrink-0" />}
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); updateAnnotation(anno.id, { locked: !anno.locked }); if (anno.locked === false && selectedAnnoId === anno.id) setSelectedAnnoId(null); }} className={`p-1 rounded transition-colors ${anno.locked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} title={anno.locked ? t('layer.unlock') : t('layer.lock')}>
                                {anno.locked ? <Lock size={12} /> : <Unlock size={12} />}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); if (!anno.locked) { setSelectedAnnoId(anno.id); setImageLayerSelected(false); setActiveTab('props'); setToolMode('select'); } }} className={`p-1 rounded transition-colors ${anno.locked ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-muted-foreground hover:text-primary'}`} title="Properties" disabled={anno.locked}>
                                <Sliders size={12} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); if (!anno.locked) deleteAnnotation(anno.id); }} className={`p-1 rounded transition-colors ${anno.locked ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-muted-foreground hover:text-destructive'}`} disabled={anno.locked}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          );
                        })}
                          
                          {/* Image layer - always at bottom */}
                          <div 
                            onClick={() => { if (!imageLayerLocked) { setImageLayerSelected(true); setSelectedAnnoId(null); setActiveTab('props'); } }} 
                            className={`flex items-center gap-2 p-2 rounded-md border transition-all ${imageLayerLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${imageLayerSelected ? 'bg-accent border-primary' : 'bg-muted border-transparent hover:bg-accent'}`}
                          >
                            <div className="w-6 h-6 rounded bg-card flex items-center justify-center text-muted-foreground">
                              <ImageIcon size={12} />
                            </div>
                            <div className="flex-1 min-w-0 flex items-center gap-1">
                              <p className="truncate text-xs font-medium text-foreground">{t('layer.image')}</p>
                              {imageLayerLocked && <Lock size={10} className="text-muted-foreground flex-shrink-0" />}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setImageLayerLocked(!imageLayerLocked); if (!imageLayerLocked) setImageLayerSelected(false); }} className={`p-1 rounded transition-colors ${imageLayerLocked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} title={imageLayerLocked ? t('layer.unlock') : t('layer.lock')}>
                              {imageLayerLocked ? <Lock size={12} /> : <Unlock size={12} />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); if (!imageLayerLocked) { setImageLayerSelected(true); setSelectedAnnoId(null); setActiveTab('props'); } }} className={`p-1 rounded transition-colors ${imageLayerLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-muted-foreground hover:text-primary'}`} title="Properties" disabled={imageLayerLocked}>
                              <Sliders size={12} />
                            </button>
                          </div>
                          
                          {annotations.length === 0 && !imageLayerLocked && <div className="flex flex-col items-center justify-center h-20 text-muted-foreground text-center border border-dashed border-border rounded-md mt-2"><Layers size={16} className="mb-1 opacity-50" /><span className="text-[10px]">No annotations</span></div>}
                        </div>
                    ) : (
                        <div>{imageLayerSelected ? <div className="space-y-3 animate-fade-in pb-2">
                          <div className="p-2 bg-accent rounded-md border border-border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-foreground"><ImageIcon size={14} /><span className="font-medium text-xs">{t('layer.image')}</span></div>
                              <button onClick={resetImageFilters} className="text-[9px] text-muted-foreground hover:text-primary transition-colors">{t('filter.reset')}</button>
                            </div>
                          </div>
                          
                          {/* Background Color */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-semibold text-muted-foreground uppercase flex items-center justify-between">{t('layer.background')}<div className="w-4 h-4 rounded-full border border-border" style={{background: canvasBgColor === 'transparent' ? 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==)' : canvasBgColor}}></div></label>
                            <div className="flex flex-wrap gap-1">{COLORS.map(c => (<button key={`bg-${c}`} onClick={() => setCanvasBgColor(c)} className={`w-5 h-5 rounded border transition-all hover:scale-110 relative overflow-hidden ${canvasBgColor === c ? 'border-primary ring-1 ring-primary/20' : 'border-transparent'}`} style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }}>{c === 'transparent' && (<div className="w-full h-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-50 rounded"></div>)}</button>))}</div>
                          </div>
                          
                          {/* Light Adjustments */}
                          <div className="space-y-2 pt-2 border-t border-border">
                            <h4 className="text-[9px] font-semibold text-muted-foreground uppercase">{t('filter.adjustments')}</h4>
                            
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between"><label className="text-[9px] text-muted-foreground">{t('filter.brightness')}</label><span className="text-[9px] font-mono bg-muted px-1 rounded">{imageFilters.brightness}%</span></div>
                              <ScrollSlider min={0} max={200} step={1} value={imageFilters.brightness} onChange={(v) => setImageFilters({...imageFilters, brightness: v})} />
                            </div>
                            
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between"><label className="text-[9px] text-muted-foreground">{t('filter.contrast')}</label><span className="text-[9px] font-mono bg-muted px-1 rounded">{imageFilters.contrast}%</span></div>
                              <ScrollSlider min={0} max={200} step={1} value={imageFilters.contrast} onChange={(v) => setImageFilters({...imageFilters, contrast: v})} />
                            </div>
                          </div>
                          
                          {/* Color Adjustments */}
                          <div className="space-y-2 pt-2 border-t border-border">
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between"><label className="text-[9px] text-muted-foreground">{t('filter.saturation')}</label><span className="text-[9px] font-mono bg-muted px-1 rounded">{imageFilters.saturation}%</span></div>
                              <ScrollSlider min={0} max={200} step={1} value={imageFilters.saturation} onChange={(v) => setImageFilters({...imageFilters, saturation: v})} />
                            </div>
                            
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between"><label className="text-[9px] text-muted-foreground">{t('filter.hueRotate')}</label><span className="text-[9px] font-mono bg-muted px-1 rounded">{imageFilters.hueRotate}°</span></div>
                              <ScrollSlider min={0} max={360} step={1} value={imageFilters.hueRotate} onChange={(v) => setImageFilters({...imageFilters, hueRotate: v})} />
                            </div>
                          </div>
                          
                          {/* Effects */}
                          <div className="space-y-2 pt-2 border-t border-border">
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between"><label className="text-[9px] text-muted-foreground">{t('filter.blur')}</label><span className="text-[9px] font-mono bg-muted px-1 rounded">{imageFilters.blur}px</span></div>
                              <ScrollSlider min={0} max={20} step={1} value={imageFilters.blur} onChange={(v) => setImageFilters({...imageFilters, blur: v})} />
                            </div>
                            
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between"><label className="text-[9px] text-muted-foreground">{t('filter.grayscale')}</label><span className="text-[9px] font-mono bg-muted px-1 rounded">{imageFilters.grayscale}%</span></div>
                              <ScrollSlider min={0} max={100} step={1} value={imageFilters.grayscale} onChange={(v) => setImageFilters({...imageFilters, grayscale: v})} />
                            </div>
                            
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between"><label className="text-[9px] text-muted-foreground">{t('filter.sepia')}</label><span className="text-[9px] font-mono bg-muted px-1 rounded">{imageFilters.sepia}%</span></div>
                              <ScrollSlider min={0} max={100} step={1} value={imageFilters.sepia} onChange={(v) => setImageFilters({...imageFilters, sepia: v})} />
                            </div>
                          </div>
                        </div> : selectedAnno ? <div className="space-y-4 animate-fade-in pb-2"><div><label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Arrange</label><div className="grid grid-cols-4 gap-1"><button onClick={() => moveLayer(selectedAnno.id, 'front')} className="p-1.5 bg-muted rounded hover:bg-card transition-all text-foreground"><ArrowUp size={12} className="mx-auto" /></button><button onClick={() => moveLayer(selectedAnno.id, 'up')} className="p-1.5 bg-muted rounded hover:bg-card transition-all text-foreground"><ArrowUp size={10} className="mx-auto" /></button><button onClick={() => moveLayer(selectedAnno.id, 'down')} className="p-1.5 bg-muted rounded hover:bg-card transition-all text-foreground"><ArrowDown size={10} className="mx-auto" /></button><button onClick={() => moveLayer(selectedAnno.id, 'back')} className="p-1.5 bg-muted rounded hover:bg-card transition-all text-foreground"><ArrowDown size={12} className="mx-auto" /></button></div></div><div className="space-y-1"><div className="flex items-center justify-between"><label className="text-[9px] font-semibold text-muted-foreground uppercase">{t('prop.rotation')}</label><span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{selectedAnno.rotation || 0}°</span></div><div className="flex items-center gap-2"><RotateCw size={12} className="text-muted-foreground" /><ScrollSlider min={0} max={360} step={1} value={selectedAnno.rotation || 0} onChange={(v) => updateAnnotation(selectedAnno.id, { rotation: v })} /></div></div>{selectedAnno.type === 'text' && <div className="space-y-2"><label className="text-[9px] font-semibold text-muted-foreground uppercase block">{t('prop.content')}</label><textarea value={selectedAnno.text} onChange={(e) => updateAnnotation(selectedAnno.id, { text: e.target.value })} className="w-full bg-muted border border-border rounded-md p-2 text-xs focus:border-primary focus:outline-none resize-none h-16 text-foreground" /><div className="grid grid-cols-2 gap-2"><div><span className="text-[9px] text-muted-foreground">Font</span><select value={selectedAnno.fontFamily} onChange={(e) => updateAnnotation(selectedAnno.id, { fontFamily: e.target.value })} className="w-full bg-muted border border-border rounded p-1.5 text-[10px] text-foreground focus:outline-none">{FONTS.map(f => <option key={f} value={f}>{f}</option>)}</select></div><div><span className="text-[9px] text-muted-foreground">Size</span><div className="flex items-center gap-1 bg-muted border border-border rounded px-1.5 py-0.5"><input type="number" value={selectedAnno.fontSize} onChange={(e) => updateAnnotation(selectedAnno.id, { fontSize: parseInt(e.target.value) })} className="w-full bg-transparent p-1 text-[10px] text-foreground focus:outline-none" /><span className="text-[9px] text-muted-foreground">px</span></div></div></div></div>}{selectedAnno.type === 'blur' && <div className="space-y-1"><div className="flex items-center justify-between"><label className="text-[9px] font-semibold text-muted-foreground uppercase">{t('prop.blur')}</label><span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{selectedAnno.blurAmount}px</span></div><ScrollSlider min={0} max={20} step={1} value={selectedAnno.blurAmount || 5} onChange={(v) => updateAnnotation(selectedAnno.id, { blurAmount: v })} /></div>}{selectedAnno.type === 'image' && <div className="space-y-3"><div className="p-2 bg-accent rounded-md border border-border"><div className="flex items-center gap-2 text-foreground"><ImagePlus size={14} /><span className="font-medium text-xs">Image Layer</span></div></div><div className="space-y-1"><div className="flex items-center justify-between"><label className="text-[9px] font-semibold text-muted-foreground uppercase">{t('prop.opacity')}</label><span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{selectedAnno.opacity ?? 100}%</span></div><ScrollSlider min={0} max={100} step={1} value={selectedAnno.opacity ?? 100} onChange={(v) => updateAnnotation(selectedAnno.id, { opacity: v })} /></div></div>}{selectedAnno.type !== 'blur' && selectedAnno.type !== 'image' && <div className="space-y-3"><div className="space-y-1"><label className="text-[9px] font-semibold text-muted-foreground uppercase flex items-center justify-between">{selectedAnno.type === 'text' ? t('label.color') : t('prop.stroke')}<div className="w-4 h-4 rounded-full border border-border" style={{background: selectedAnno.color}}></div></label><div className="flex flex-wrap gap-1">{COLORS.map(c => (<button key={c} onClick={() => updateAnnotation(selectedAnno.id, { color: c })} className={`w-6 h-6 rounded border transition-all hover:scale-110 relative ${selectedAnno.color === c ? 'border-primary ring-1 ring-primary/20' : 'border-transparent'}`} style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }}>{c === 'transparent' && (<div className="w-full h-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-50 rounded"></div>)}{c === 'transparent' && <div className="absolute inset-0 border-t border-destructive transform rotate-45 top-1/2"></div>}</button>))}</div></div>{selectedAnno.type === 'shape' && <div className="space-y-1"><label className="text-[9px] font-semibold text-muted-foreground uppercase flex items-center justify-between">{t('prop.fill')}<div className="w-4 h-4 rounded-full border border-border" style={{background: selectedAnno.fillColor}}></div></label><div className="flex flex-wrap gap-1">{COLORS.map(c => (<button key={`fill-${c}`} onClick={() => updateAnnotation(selectedAnno.id, { fillColor: c })} className={`w-6 h-6 rounded border transition-all hover:scale-110 relative overflow-hidden ${selectedAnno.fillColor === c ? 'border-primary ring-1 ring-primary/20' : 'border-transparent'}`} style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }}>{c === 'transparent' && (<div className="w-full h-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-50 rounded"></div>)}{c === 'transparent' && <div className="absolute inset-0 border-t border-destructive transform rotate-45 top-1/2"></div>}</button>))}</div></div>}</div>}{(selectedAnno.type === 'shape' || selectedAnno.type === 'brush' || selectedAnno.type === 'line') && <div className="space-y-1"><div className="flex items-center justify-between"><label className="text-[9px] font-semibold text-muted-foreground uppercase">{t('prop.width')}</label><span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{selectedAnno.borderWidth}px</span></div><ScrollSlider min={1} max={50} step={1} value={selectedAnno.borderWidth || 0} onChange={(v) => updateAnnotation(selectedAnno.id, { borderWidth: v })} /></div>}</div> : toolMode === 'brush' ? <div className="w-full space-y-3 animate-fade-in"><div className="p-2 bg-accent rounded-md border border-border"><div className="flex items-center gap-2 text-foreground mb-1"><Paintbrush size={14} /><span className="font-medium text-xs">Brush</span></div><p className="text-[10px] text-muted-foreground">Draw on canvas</p></div><div className="space-y-1"><label className="text-[9px] font-semibold text-muted-foreground uppercase">{t('label.color')}</label><div className="flex flex-wrap gap-1">{COLORS.filter(c => c !== 'transparent').map(c => (<button key={c} onClick={() => setBrushSettings({...brushSettings, color: c})} className={`w-6 h-6 rounded border transition-all hover:scale-110 ${brushSettings.color === c ? 'border-primary ring-1 ring-primary/20' : 'border-transparent'}`} style={{ backgroundColor: c }} />))}</div></div><div className="space-y-1"><div className="flex items-center justify-between"><label className="text-[9px] font-semibold text-muted-foreground uppercase">{t('prop.width')}</label><span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{brushSettings.width}px</span></div><ScrollSlider min={1} max={50} step={1} value={brushSettings.width} onChange={(v) => setBrushSettings({...brushSettings, width: v})} /></div></div> : <div className="flex flex-col items-center justify-center h-40 text-muted-foreground"><div className="p-3 bg-muted rounded-full mb-2"><MousePointer2 size={20} /></div><span className="text-xs">{t('editor.select')}</span></div>}</div>
                    )}
                </div>
                {selectedAnno && activeTab === 'props' && toolMode !== 'perspective' && toolMode !== 'transform' && <div className="p-2 border-t border-border flex-shrink-0"><button onClick={() => deleteAnnotation(selectedAnno.id)} className="w-full py-1.5 bg-card border border-border text-destructive rounded-md hover:bg-destructive/10 text-[10px] font-medium transition-all flex items-center justify-center gap-1.5"><Trash2 size={12} /> {t('btn.deleteObj')}</button></div>}
            </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(<>{modalContent}</>, document.body);
};

export default ImageEditor;