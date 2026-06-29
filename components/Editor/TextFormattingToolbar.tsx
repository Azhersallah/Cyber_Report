import React, { useEffect, useState, useRef } from 'react';
import { 
  Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ChevronDown, Palette
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useApp } from '../../store/AppContext';
import { getTranslation } from '../../utils/translations';

// Standard Microsoft Word-like font sizes in pixels
const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'];
const TEXT_COLORS = ['#000000', '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280', '#ffffff'];

const TextFormattingToolbar: React.FC = () => {
  const { state } = useApp();
  const t = (key: string) => getTranslation(key, state.language);

  const FONTS = [
    { name: 'Inter', label: t('font.sans') },
    { name: 'Noto Kufi Arabic', label: t('font.kufi') },
    { name: 'Noto Naskh Arabic', label: t('font.naskh') },
    { name: 'Arial', label: t('font.arial') },
    { name: 'Courier New', label: t('font.mono') },
  ];

  const ALIGN_OPTIONS = [
    { id: 'justifyLeft', label: t('align.left'), icon: AlignLeft },
    { id: 'justifyCenter', label: t('align.center'), icon: AlignCenter },
    { id: 'justifyRight', label: t('align.right'), icon: AlignRight },
    { id: 'justifyFull', label: t('align.justify'), icon: AlignJustify },
  ];

  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [show, setShow] = useState(false);
  
  const [currentFont, setCurrentFont] = useState('Inter');
  const [showFontMenu, setShowFontMenu] = useState(false);
  
  const [currentSize, setCurrentSize] = useState('16'); // Default to 16px
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  const [currentAlign, setCurrentAlign] = useState('justifyLeft');
  const [showAlignMenu, setShowAlignMenu] = useState(false);

  const [showColorMenu, setShowColorMenu] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      // Basic validation: must have text selected, and must be inside a contentEditable area
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        setShow(false);
        setShowFontMenu(false);
        setShowSizeMenu(false);
        setShowAlignMenu(false);
        setShowColorMenu(false);
        return;
      }

      const anchorNode = selection.anchorNode;
      const element = anchorNode?.nodeType === 3 ? anchorNode.parentElement : anchorNode as HTMLElement;
      
      if (!element?.closest('[contenteditable="true"]')) {
        setShow(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Check if visible (has width)
      if (rect.width === 0) {
        setShow(false);
        return;
      }

      // Calculate position (centered above the selection)
      setPosition({
        top: rect.top - 50 + window.scrollY, // 50px above
        left: rect.left + (rect.width / 2)
      });
      setShow(true);

      // Sync state with current selection style
      const font = document.queryCommandValue('fontName');
      if (font) setCurrentFont(font.replace(/['"]+/g, ''));
      
      // Get computed font size in pixels
      if (element) {
        const computedSize = window.getComputedStyle(element).fontSize;
        // computedSize returns string like "16px", parse it
        const sizeVal = parseInt(computedSize, 10);
        if (!isNaN(sizeVal)) {
          setCurrentSize(sizeVal.toString());
        }
      }

      // Sync alignment state
      if (document.queryCommandState('justifyCenter')) setCurrentAlign('justifyCenter');
      else if (document.queryCommandState('justifyRight')) setCurrentAlign('justifyRight');
      else if (document.queryCommandState('justifyFull')) setCurrentAlign('justifyFull');
      else setCurrentAlign('justifyLeft');
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    // Also listen to mouseup to capture end of selection drag
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
    };
  }, []);

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  };

  const applyFontSize = (px: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    const span = document.createElement('span');
    span.style.fontSize = `${px}px`;
    
    try {
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
        
        // Reset selection to the new span so user can keep typing/editing
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
        
        setCurrentSize(px);
    } catch (e) {
        console.error("Failed to apply font size", e);
    }
  };

  // Prevent toolbar click from deselecting text
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const isKurdish = state.language === 'ku';

  if (!show || !position) return null;

  return createPortal(
    <div
      ref={toolbarRef}
      onMouseDown={handleMouseDown}
      className={`fixed z-[9999] flex items-center bg-popover text-popover-foreground rounded-xl shadow-2xl py-1.5 px-2 gap-1 animate-fade-in transform -translate-x-1/2 border border-border ${isKurdish ? 'font-kufi' : 'font-sans'}`}
      style={{ top: position.top, left: position.left }}
      dir={isKurdish ? 'rtl' : 'ltr'}
    >
      {/* Font Family Dropdown */}
      <div className="relative border-r border-border pr-1 mr-1">
        <button 
            onClick={() => {
              setShowFontMenu(!showFontMenu);
              setShowSizeMenu(false);
              setShowAlignMenu(false);
              setShowColorMenu(false);
            }}
            className="flex items-center gap-1 hover:bg-accent px-2 py-1 rounded text-xs font-medium w-24 justify-between"
            title={t('font.label')}
        >
            <span className="truncate">{FONTS.find(f => f.name === currentFont)?.label || currentFont || t('font.label')}</span>
            <ChevronDown size={10} />
        </button>
        
        {showFontMenu && (
            <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-lg shadow-xl overflow-hidden w-32 flex flex-col max-h-48 overflow-y-auto">
                {FONTS.map(font => (
                    <button
                        key={font.name}
                        onClick={() => {
                            exec('fontName', font.name);
                            setCurrentFont(font.name);
                            setShowFontMenu(false);
                        }}
                        className="px-3 py-2 text-left text-xs hover:bg-accent text-popover-foreground"
                        style={{ fontFamily: font.name }}
                    >
                        {font.label}
                    </button>
                ))}
            </div>
        )}
      </div>

      <button onClick={() => exec('bold')} className="p-1.5 hover:bg-accent rounded transition-colors" title={t('fmt.bold')}>
        <Bold size={14} />
      </button>
      
      <button onClick={() => exec('italic')} className="p-1.5 hover:bg-accent rounded transition-colors" title={t('fmt.italic')}>
        <Italic size={14} />
      </button>
      
      <button onClick={() => exec('underline')} className="p-1.5 hover:bg-accent rounded transition-colors" title={t('fmt.underline')}>
        <Underline size={14} />
      </button>

      <div className="w-px h-4 bg-border mx-1"></div>

      {/* Color Picker */}
      <div className="relative">
          <button 
            onClick={() => {
                setShowColorMenu(!showColorMenu);
                setShowAlignMenu(false);
                setShowFontMenu(false);
                setShowSizeMenu(false);
            }}
            className="p-1.5 hover:bg-accent rounded transition-colors relative"
            title="Text Color"
          >
              <Palette size={14} />
          </button>
          
          {showColorMenu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-popover border border-border rounded-lg shadow-xl p-2 w-32 grid grid-cols-5 gap-1">
                  {TEXT_COLORS.map(color => (
                      <button
                          key={color}
                          onClick={() => {
                              exec('foreColor', color);
                              setShowColorMenu(false);
                          }}
                          className="w-5 h-5 rounded-full border border-border hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                      />
                  ))}
              </div>
          )}
      </div>

      {/* Alignment Dropdown */}
      <div className="relative">
        <button 
            onClick={() => {
              setShowAlignMenu(!showAlignMenu);
              setShowFontMenu(false);
              setShowSizeMenu(false);
              setShowColorMenu(false);
            }}
            className="flex items-center gap-1 hover:bg-accent px-2 py-1 rounded text-xs font-medium justify-between"
            title={t('fmt.align')}
        >
            {(() => {
                const Option = ALIGN_OPTIONS.find(o => o.id === currentAlign) || ALIGN_OPTIONS[0];
                const Icon = Option.icon;
                return <Icon size={14} />;
            })()}
            <ChevronDown size={10} />
        </button>
        
        {showAlignMenu && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-popover border border-border rounded-lg shadow-xl overflow-hidden w-28 flex flex-col">
                {ALIGN_OPTIONS.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => {
                            exec(opt.id);
                            setCurrentAlign(opt.id);
                            setShowAlignMenu(false);
                        }}
                        className={`px-3 py-2 text-left text-xs hover:bg-accent text-popover-foreground flex items-center gap-2 ${currentAlign === opt.id ? 'bg-accent' : ''}`}
                    >
                        <opt.icon size={14} />
                        <span>{opt.label}</span>
                    </button>
                ))}
            </div>
        )}
      </div>

      <div className="w-px h-4 bg-border mx-1"></div>
      
      {/* Font Size Dropdown */}
      <div className="relative">
        <button 
            onClick={() => {
              setShowSizeMenu(!showSizeMenu);
              setShowFontMenu(false);
              setShowAlignMenu(false);
              setShowColorMenu(false);
            }}
            className="flex items-center gap-1 hover:bg-accent px-2 py-1 rounded text-xs font-medium w-12 justify-between"
            title={t('fmt.size')}
        >
            <span>{currentSize}</span>
            <ChevronDown size={10} />
        </button>
        
        {showSizeMenu && (
            <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-lg shadow-xl overflow-hidden w-16 flex flex-col max-h-48 overflow-y-auto custom-scrollbar">
                {FONT_SIZES.map(size => (
                    <button
                        key={size}
                        onClick={() => {
                            applyFontSize(size);
                            setShowSizeMenu(false);
                        }}
                        className={`px-3 py-2 text-center text-xs hover:bg-accent text-popover-foreground ${currentSize === size ? 'bg-accent font-bold' : ''}`}
                    >
                        {size}
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* Triangle Arrow at bottom */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-popover"></div>
    </div>,
    document.body
  );
};

export default TextFormattingToolbar;