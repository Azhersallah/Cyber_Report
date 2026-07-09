
import React, { useState, useRef, useEffect } from 'react';
import { Photo } from '../../types';
import { RotateCw, X, Edit2, Plus, GripVertical, ImageUp, Download } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { getTranslation } from '../../utils/translations';
import { readFileAsDataURL, generateId } from '../../utils/helpers';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface PhotoSlotProps {
  photo?: Photo | null;
  index: number; 
  slotId: string;
  className?: string;
  badgeColor?: string;
  onEdit: (photo: Photo) => void;
  onInsert: (photos: Photo[]) => void;
  enableInsertTriggers?: boolean;
  globalIndex: number;
  onSwap: (sourceIdx: number, targetIdx: number) => void;
  overlayNumber?: number;
  overlayStyle?: {
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
  };
  onOverlayPositionChange?: (x: number, y: number) => void;
  hideBadge?: boolean;
  isIdPhotoSlot?: boolean;
  maxCopies?: number;
}

const InsertTrigger = ({ orientation, onClick }: { orientation: 'vertical' | 'horizontal', onClick: () => void }) => {
  const isVert = orientation === 'vertical';
  
  return (
      <div 
          className={cn(
              "absolute flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200 cursor-pointer group/trigger no-print z-[9999]",
              isVert ? "-top-6 left-0 right-0 h-8" : "-left-6 top-0 bottom-0 w-8"
          )}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          title="Insert Photo Here"
      >
          <div className={cn(
              "absolute bg-foreground/0 group-hover/trigger:bg-foreground/10 transition-colors",
              isVert ? "w-full h-px" : "h-full w-px"
          )}></div>
          
          <div className="absolute bg-foreground text-background rounded-full p-1 shadow-lg transform scale-50 opacity-0 group-hover/trigger:opacity-100 group-hover/trigger:scale-100 transition-all duration-200 z-[9999]">
              <Plus size={12} strokeWidth={3} />
          </div>
      </div>
  );
}

const PhotoSlot: React.FC<PhotoSlotProps> = ({ 
  photo, 
  index, 
  slotId, 
  className = "", 
  badgeColor, 
  onEdit, 
  onInsert,
  enableInsertTriggers = true,
  globalIndex,
  onSwap,
  overlayNumber,
  overlayStyle,
  onOverlayPositionChange,
  hideBadge = false,
  isIdPhotoSlot = false,
  maxCopies = 12
}) => {
  const { state, dispatch } = useApp();
  const t = (key: string) => getTranslation(key, state.language);
  const { settings } = state;
  const [isHovered, setIsHovered] = useState(false);
  const [isToolbarHovered, setIsToolbarHovered] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const hoverTimeoutRef = useRef<any>(null);

  useEffect(() => {
      if (isHovered || isToolbarHovered) {
          if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
          }
          setShowToolbar(true);
      } else {
          if (!hoverTimeoutRef.current) {
              hoverTimeoutRef.current = setTimeout(() => {
                  setShowToolbar(false);
                  hoverTimeoutRef.current = null;
              }, 300);
          }
      }
      return () => {
          if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
          }
      };
  }, [isHovered, isToolbarHovered]);

  const [slotWidth, setSlotWidth] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showSelectExistingDialog, setShowSelectExistingDialog] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<Photo | null>(null);
  const [copyCount, setCopyCount] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const insertInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (!containerRef.current) return;
      
      const updateWidth = () => {
          if (containerRef.current) {
              setSlotWidth(containerRef.current.clientWidth);
          }
      };
      
      updateWidth();
      
      const observer = new ResizeObserver(() => {
          updateWidth();
      });
      observer.observe(containerRef.current);
      
      return () => {
          observer.disconnect();
      };
  }, []);

  const isBusinessCardSlot = state.mode === 'businesscard';
  const isMultiCopySlot = isIdPhotoSlot || isBusinessCardSlot;

  const uniquePhotos = isIdPhotoSlot 
    ? state.idPhotos.filter((p): p is Photo => p !== null)
        .filter((value, index, self) => self.findIndex(t => t.src === value.src) === index)
    : isBusinessCardSlot
    ? state.cardPhotos.filter((p): p is Photo => p !== null)
        .filter((value, index, self) => self.findIndex(t => t.src === value.src) === index)
    : [];

  const maxCopiesVal = isBusinessCardSlot ? 10 : maxCopies;

  const getCopyDialogTitle = () => {
    if (isBusinessCardSlot) {
      return state.language === 'ku' ? 'زیادکردنی کۆپی کارت' : state.language === 'ar' ? 'إضافة نسخ البطاقة' : 'Add Card Copies';
    }
    return t('idphoto.copyDialog.title');
  };

  const getCopyDialogDescription = () => {
    if (isBusinessCardSlot) {
      return state.language === 'ku' 
        ? 'چەند کۆپییەک لەم کارتی بازرگانییە دەتەوێت زیاد بکەیت؟' 
        : state.language === 'ar' 
        ? 'كم عدد النسخ من بطاقة العمل هذه تريد إضافتها؟' 
        : 'How many copies of this business card do you want to add?';
    }
    return t('idphoto.copyDialog.description');
  };

  const getSelectDialogTitle = () => {
    if (isBusinessCardSlot) {
      return state.language === 'ku' ? 'هەڵبژاردنی کارتی بازرگانی' : state.language === 'ar' ? 'اختر بطاقة العمل' : 'Select Business Card';
    }
    return state.language === 'ku' ? 'هەڵبژاردنی وێنە' : 'Select Photo';
  };

  const getSelectDialogDescription = () => {
    if (isBusinessCardSlot) {
      return state.language === 'ku' 
        ? 'کارتێکی بازرگانی لەوانەی هەن هەڵبژێرە یان کارتێکی نوێ باربکە' 
        : state.language === 'ar' 
        ? 'اختر بطاقة عمل موجودة أو قم برفع بطاقة جديدة' 
        : 'Select an existing business card or upload a new one';
    }
    return state.language === 'ku' 
      ? 'وێنەیەک لەوانەی هەن هەڵبژێرە یان وێنەیەکی نوێ باربکە' 
      : 'Select an existing photo from the page or upload a new one';
  };



  // Handle rounding logic - use square borders if requested by parent
  const isRoundedNone = className.includes('rounded-none');
  const roundingClass = isRoundedNone ? 'rounded-none' : 'rounded-xl';

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!photo) return;
    dispatch({ 
      type: 'UPDATE_PHOTO', 
      payload: { ...photo, rotation: (photo.rotation + 90) % 360 } 
    });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!photo) return;
    
    if (state.mode === 'businesscard' || state.mode === 'idphoto' || state.mode === 'invoice') {
      dispatch({ type: 'REMOVE_PHOTO_BY_INDEX', payload: globalIndex });
    } else {
      dispatch({ type: 'REMOVE_PHOTO', payload: photo.id });
    }
  };

  const handleReplaceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMultiCopySlot && uniquePhotos.length > 0) {
      setShowSelectExistingDialog(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleInsertClick = () => {
    insertInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const src = await readFileAsDataURL(file);

        if (photo) {
            dispatch({ 
                type: 'UPDATE_PHOTO', 
                payload: { 
                    ...photo, 
                    src, 
                    name: file.name,
                    crop: undefined, 
                    rotation: 0, 
                    annotations: [] 
                } 
            });
        } else {
            const newPhoto: Photo = {
                id: generateId(),
                name: file.name,
                src,
                rotation: 0,
                annotations: []
            };
            
            // For ID photo/Business card slots, show dialog to ask how many copies
            if (isMultiCopySlot) {
                setPendingPhoto(newPhoto);
                setCopyCount(1);
                setShowCopyDialog(true);
            } else {
                onInsert([newPhoto]);
            }
        }
    } catch (error) {
        console.error("Failed to read file", error);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmCopies = () => {
    if (pendingPhoto) {
      const copies: Photo[] = [];
      const sharedId = generateId(); // Generate ONE shared ID for all copies
      for (let i = 0; i < copyCount; i++) {
        copies.push({
          ...pendingPhoto,
          id: sharedId // Use the SAME ID for all copies so they're linked
        });
      }
      onInsert(copies);
    }
    setShowCopyDialog(false);
    setPendingPhoto(null);
  };

  const handleInsertFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newPhotos: Photo[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)) {
            try {
                const src = await readFileAsDataURL(file);
                newPhotos.push({
                    id: generateId(),
                    name: file.name,
                    src,
                    rotation: 0,
                    annotations: []
                });
            } catch (e) {
                console.error("Failed to load inserted image", e);
            }
        }
    }
    if (newPhotos.length > 0) {
        onInsert(newPhotos);
    }
    if (insertInputRef.current) insertInputRef.current.value = '';
  };

  const handleDragStart = (e: React.DragEvent) => {
      if (!photo) {
          e.preventDefault();
          return;
      }
      e.dataTransfer.setData('text/plain', globalIndex.toString());
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => {
          if (containerRef.current) containerRef.current.style.opacity = '0.4';
      }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
      if (containerRef.current) containerRef.current.style.opacity = '1';
      setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
      // Allow all drag operations to show visual feedback
      if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          if (!isDragOver) setIsDragOver(true);
      } else {
          // Internal drag (photo swap between slots)
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (!isDragOver) setIsDragOver(true);
      }
  };

  const handleDragLeave = (e: React.DragEvent) => {
      // Only clear isDragOver if we're actually leaving the slot (not just moving between children)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      
      // Check if mouse is still inside the slot
      if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
          setIsDragOver(false);
      }
  };

  const handleDrop = async (e: React.DragEvent) => {
      // ALWAYS clear drag state immediately, regardless of file type
      setIsDragOver(false);

      // If a project file (.pppro / .ppfree) is dropped on this slot, ignore it completely.
      // The global window capture handler in App.tsx will handle it and show the load modal.
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const firstName = e.dataTransfer.files[0].name.toLowerCase();
          if (firstName.endsWith('.pppro') || firstName.endsWith('.ppfree') || firstName.endsWith('.cyr')) {
              // Do NOT preventDefault - let it bubble to App.tsx global handler
              // isDragOver already cleared above
              return; // Let global handler deal with it; slot stays clean
          }
      }
      
      // For non-project files, prevent default to handle the drop here
      e.preventDefault();
      // Check if files are being dropped from outside the app
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const files = e.dataTransfer.files;
          const newPhotos: Photo[] = [];
          
          for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)) {
                  try {
                      const src = await readFileAsDataURL(file);
                      newPhotos.push({
                          id: generateId(),
                          name: file.name,
                          src,
                          rotation: 0,
                          annotations: []
                      });
                  } catch (err) {
                      console.error("Failed to load dropped image", err);
                  }
              }
          }
          
          if (newPhotos.length > 0) {
              if (photo) {
                  // Replace existing photo with first dropped image
                  dispatch({ 
                      type: 'UPDATE_PHOTO', 
                      payload: { 
                          ...photo, 
                          src: newPhotos[0].src, 
                          name: newPhotos[0].name,
                          crop: undefined, 
                          rotation: 0, 
                          annotations: [] 
                      } 
                  });
                  // Insert remaining photos after this slot
                  if (newPhotos.length > 1) {
                      onInsert(newPhotos.slice(1));
                  }
              } else {
                  // Empty slot - insert all photos
                  onInsert(newPhotos);
              }
          }
          return;
      }
      
      // Handle internal drag (swapping photos between slots)
      const sourceIndexStr = e.dataTransfer.getData('text/plain');
      if (sourceIndexStr) {
          const sourceIdx = parseInt(sourceIndexStr);
          if (!isNaN(sourceIdx) && sourceIdx !== globalIndex) {
              onSwap(sourceIdx, globalIndex);
          }
      }
  };


  const hasCrop = photo && !!photo.crop;
  const isRotated90 = photo && (photo.rotation % 180 !== 0);

  const wrapperStyle = isRotated90 ? {
      width: '100cqh',
      height: '100cqw',
      minWidth: '100cqh',
      minHeight: '100cqw',
      maxWidth: 'none',
      maxHeight: 'none',
      flexShrink: 0
  } : {
      width: '100%',
      height: '100%',
      minWidth: 'auto',
      minHeight: 'auto',
      maxWidth: '100%',
      maxHeight: '100%',
      flexShrink: 0
  };

  return (
    <div 
      data-drop-target="slot"
      className={cn(
        "relative group bg-white border select-none transition-all duration-200 print:border-transparent print:ring-0 print:shadow-none",
        roundingClass,
        className,
        !photo ? "shadow-none border-dashed border-muted-foreground/40 hover:border-muted-foreground" : "shadow-sm border-border",
        isDragOver && "ring-2 ring-foreground/20 border-foreground/50 scale-[1.01] z-20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={!!photo}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {enableInsertTriggers && (
        <>
            <InsertTrigger orientation="horizontal" onClick={handleInsertClick} />
        </>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.heic,.heif" className="hidden" />
      <input type="file" ref={insertInputRef} onChange={handleInsertFileChange} accept="image/*,.heic,.heif" multiple className="hidden" />

      <div ref={containerRef} className={`w-full h-full overflow-hidden relative ${roundingClass} z-0 flex items-center justify-center transition-opacity`} style={{ containerType: 'size' }}>
          
          {photo && settings.showPhotoBadges && !overlayNumber && !hideBadge && badgeColor && (
            <div 
                className={`absolute top-3 left-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg shadow-black/20 print:shadow-none font-sans print-preserve-color`}
                style={{ 
                  backgroundColor: badgeColor, 
                  color: 'white', 
                  WebkitPrintColorAdjust: 'exact'
                }}
            >
                {globalIndex + 1}
            </div>
          )}

          {overlayNumber !== undefined && overlayStyle && (
            <div 
                ref={overlayRef}
                className={cn(
                    "absolute z-50 font-bold print-preserve-color select-none",
                    isDraggingOverlay ? "opacity-70" : "",
                    onOverlayPositionChange ? "cursor-move hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 rounded print:pointer-events-none print:cursor-default" : "pointer-events-none"
                )}
                style={{
                    left: `${overlayStyle.x}%`,
                    top: `${overlayStyle.y}%`,
                    fontSize: `${overlayStyle.fontSize}px`,
                    color: overlayStyle.color,
                    fontFamily: overlayStyle.fontFamily,
                    transform: 'translate(-50%, -50%)',
                    WebkitPrintColorAdjust: 'exact'
                }}
                onMouseDown={(e) => {
                    if (!onOverlayPositionChange || !containerRef.current) return;
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingOverlay(true);
                    
                    const rect = containerRef.current.getBoundingClientRect();
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                        const newX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
                        const newY = ((moveEvent.clientY - rect.top) / rect.height) * 100;
                        onOverlayPositionChange(
                            Math.max(0, Math.min(100, newX)),
                            Math.max(0, Math.min(100, newY))
                        );
                    };
                    
                    const handleMouseUp = () => {
                        setIsDraggingOverlay(false);
                        window.removeEventListener('mousemove', handleMouseMove);
                        window.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    window.addEventListener('mousemove', handleMouseMove);
                    window.addEventListener('mouseup', handleMouseUp);
                }}
            >
                {overlayNumber}
            </div>
          )}

          {!photo ? (
              <div 
                 className={cn(
                     "w-full h-full flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden group/empty relative bg-white print:border-white",
                     roundingClass,
                     isDragOver ? "bg-muted" : ""
                 )}
                 onClick={(e) => {
                   if (isBusinessCardSlot) {
                     return;
                   }
                   handleReplaceClick(e);
                 }}
              >
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground transition-colors no-print">
                    <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReplaceClick(e);
                        }}
                        className={cn(
                            "w-10 h-10 rounded-md flex items-center justify-center transition-all border cursor-pointer",
                            isDragOver 
                                ? "bg-foreground/10 text-foreground border-foreground/20" 
                                : "bg-muted text-muted-foreground border-transparent group-hover/empty:text-foreground group-hover/empty:bg-foreground/5"
                        )}
                    >
                        <Plus size={20} />
                    </div>
                    
                    <span 
                        onClick={(e) => {
                          if (isBusinessCardSlot) {
                            return;
                          }
                          e.stopPropagation();
                          handleReplaceClick(e);
                        }}
                        className={cn(
                            "text-[9px] font-medium uppercase tracking-wide transition-colors",
                            isDragOver ? "text-foreground" : "text-muted-foreground group-hover/empty:text-foreground"
                        )}
                        style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}
                    >
                        {isDragOver ? t('slot.replace') : t('slot.empty')}
                    </span>
                </div>
             </div>
          ) : (
            <>
                {hasCrop ? (
                    <div className="w-full h-full relative overflow-hidden bg-white">
                        <img 
                            src={photo.src} 
                            alt={photo.name}
                            className="absolute max-w-none transition-transform duration-500 ease-out"
                            style={{ 
                                left: `-${photo.crop!.x}%`,
                                top: `-${photo.crop!.y}%`,
                                width: `${(100 / photo.crop!.width) * 100}%`,
                                height: `${(100 / photo.crop!.height) * 100}%`,
                                transform: `rotate(${photo.rotation}deg)`,
                                transformOrigin: 'center center',
                                viewTransitionName: `photo-${photo.id}`
                            } as React.CSSProperties}
                        />
                    </div>
                ) : (
                    <div 
                        className="flex items-center justify-center transition-all duration-500 ease-out bg-white"
                        style={{
                            ...wrapperStyle,
                            transform: `rotate(${photo.rotation}deg)`,
                        }}
                    >
                        <img 
                            src={photo.src} 
                            alt={photo.name}
                            className="w-full h-full max-w-full max-h-full object-contain pointer-events-none"
                            style={{ viewTransitionName: `photo-${photo.id}` } as React.CSSProperties}
                        />
                    </div>
                )}
                
                <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                    {photo.annotations.map(anno => (
                    <div 
                        key={anno.id}
                        className="absolute"
                        style={{ 
                            left: `${anno.x}%`, 
                            top: `${anno.y}%`,
                            width: `${anno.width}%`,
                            height: `${anno.height}%`,
                            border: anno.type === 'shape' && anno.shapeType === 'rectangle' ? `${anno.borderWidth}px solid ${anno.color}` : 'none',
                            borderRadius: anno.shapeType === 'circle' ? '50%' : '0',
                            backgroundColor: anno.fillColor,
                            color: anno.color,
                            fontSize: `${anno.fontSize}px`,
                            fontFamily: anno.fontFamily,
                            whiteSpace: 'nowrap',
                            display: anno.type === 'text' ? 'block' : 'block',
                        }}
                    >
                        {anno.type === 'text' && anno.text}
                        {anno.type === 'shape' && anno.shapeType === 'circle' && (
                            <div style={{ 
                                width: '100%', height: '100%', borderRadius: '50%', 
                                border: `${anno.borderWidth}px solid ${anno.color}`, 
                                backgroundColor: anno.fillColor 
                            }} />
                        )}
                    </div>
                    ))}
                </div>
            </>
          )}
      </div>

      {photo && (() => {
        let btnPadding = "p-1.5";
        let iconSize = 14;
        let gapClass = "gap-1";
        let toolbarPadding = "p-1";

        if (slotWidth && slotWidth < 75) {
            btnPadding = "p-0.5";
            iconSize = 10;
            gapClass = "gap-0.5";
            toolbarPadding = "p-0.5";
        } else if (slotWidth && slotWidth < 140) {
            btnPadding = "p-1";
            iconSize = 12;
            gapClass = "gap-0.5";
            toolbarPadding = "p-1";
        }

        const showRotate = !slotWidth || slotWidth >= 75;
        const showReplace = !slotWidth || slotWidth >= 75;
        const showSave = !slotWidth || slotWidth >= 140;

        return (
            <div 
                onMouseEnter={() => setIsToolbarHovered(true)}
                onMouseLeave={() => setIsToolbarHovered(false)}
                className={cn(
                    "absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center bg-background/95 dark:bg-zinc-950/95 backdrop-blur-md border border-border dark:border-zinc-800 rounded-xl shadow-lg shadow-black/10 transition-all transform z-[100] no-print",
                    gapClass,
                    toolbarPadding,
                    showToolbar ? "translate-y-0 opacity-100 scale-100" : "translate-y-2 opacity-0 scale-95 pointer-events-none"
                )}
            >
                {!isIdPhotoSlot && (
                    <>
                        {showRotate && (
                            <button onClick={handleRotate} className={cn("hover:bg-muted dark:hover:bg-zinc-800/80 rounded-lg text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors duration-150", btnPadding)} title={t('slot.rotate')}>
                                <RotateCw size={iconSize} />
                            </button>
                        )}
                        <button onClick={() => onEdit(photo)} className={cn("hover:bg-muted dark:hover:bg-zinc-800/80 rounded-lg text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors duration-150", btnPadding)} title={t('slot.edit')}>
                            <Edit2 size={iconSize} />
                        </button>
                        {showReplace && (
                            <button onClick={handleReplaceClick} className={cn("hover:bg-muted dark:hover:bg-zinc-800/80 rounded-lg text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors duration-150", btnPadding)} title={t('slot.replace')}>
                                <ImageUp size={iconSize} />
                            </button>
                        )}
                        {showSave && (
                            <button onClick={(e) => { e.stopPropagation(); if (!photo) return; const link = document.createElement('a'); link.download = photo.name || 'photo.png'; link.href = photo.src; link.click(); }} className={cn("hover:bg-muted dark:hover:bg-zinc-800/80 rounded-lg text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors duration-150", btnPadding)} title={state.language === 'ku' ? 'داگرتن' : 'Save'}>
                                <Download size={iconSize} />
                            </button>
                        )}
                        <button onClick={handleRemove} className={cn("hover:bg-destructive/10 dark:hover:bg-red-500/20 rounded-lg text-muted-foreground dark:text-zinc-400 hover:text-destructive dark:hover:text-red-400 transition-colors duration-150", btnPadding)} title={t('slot.remove')}>
                            <X size={iconSize} />
                        </button>
                    </>
                )}
                {isIdPhotoSlot && (
                    <>
                        <button onClick={() => onEdit(photo)} className={cn("hover:bg-muted dark:hover:bg-zinc-800/80 rounded-lg text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors duration-150", btnPadding)} title={t('slot.edit')}>
                            <Edit2 size={iconSize} />
                        </button>
                        {showSave && (
                            <button onClick={(e) => { e.stopPropagation(); if (!photo) return; const link = document.createElement('a'); link.download = photo.name || 'photo.png'; link.href = photo.src; link.click(); }} className={cn("hover:bg-muted dark:hover:bg-zinc-800/80 rounded-lg text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors duration-150", btnPadding)} title={state.language === 'ku' ? 'داگرتن' : 'Save'}>
                                <Download size={iconSize} />
                            </button>
                        )}
                        <button onClick={handleRemove} className={cn("hover:bg-destructive/10 dark:hover:bg-red-500/20 rounded-lg text-muted-foreground dark:text-zinc-400 hover:text-destructive dark:hover:text-red-400 transition-colors duration-150", btnPadding)} title={t('slot.remove')}>
                            <X size={iconSize} />
                        </button>
                    </>
                )}
            </div>
        );
      })()}

      {photo && (
          <div className="absolute top-2 right-2 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing no-print z-[100]">
             <GripVertical size={16} />
          </div>
      )}

      {/* ID Photo/Business Card Copy Count Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{getCopyDialogTitle()}</DialogTitle>
            <DialogDescription>
              {getCopyDialogDescription()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="copyCount" className="text-sm font-medium">
                {t('idphoto.copyDialog.copies')}
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="copyCount"
                  type="range"
                  min={1}
                  max={maxCopiesVal}
                  value={copyCount}
                  onChange={(e) => setCopyCount(parseInt(e.target.value))}
                  className="flex-1 h-2 accent-foreground"
                />
                <span className="text-lg font-bold w-12 text-center">{copyCount}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCopyDialog(false);
                setPendingPhoto(null);
              }}
            >
              {t('idphoto.copyDialog.cancel')}
            </Button>
            <Button type="button" onClick={handleConfirmCopies}>
              {t('idphoto.copyDialog.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ID Photo/Business Card Choose Existing or Upload Dialog */}
      <Dialog open={showSelectExistingDialog} onOpenChange={setShowSelectExistingDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {getSelectDialogTitle()}
            </DialogTitle>
            <DialogDescription>
              {getSelectDialogDescription()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              {isBusinessCardSlot 
                ? (state.language === 'ku' ? 'کارتەکانی ناو لاپەڕە' : state.language === 'ar' ? 'البطاقات في الصفحة' : 'Cards on page')
                : (state.language === 'ku' ? 'وێنەکانی ناو لاپەڕە' : 'Photos on page')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {uniquePhotos.map((item, idx) => (
                <button
                   key={idx}
                   type="button"
                   onClick={() => {
                     const clonedPhoto = {
                       ...item,
                       id: generateId()
                     };
                     if (photo) {
                       dispatch({
                         type: 'UPDATE_PHOTO',
                         payload: {
                           ...photo,
                           src: clonedPhoto.src,
                           name: clonedPhoto.name,
                           crop: undefined,
                           rotation: 0,
                           annotations: []
                         }
                       });
                       setShowSelectExistingDialog(false);
                     } else {
                       setPendingPhoto(clonedPhoto);
                       setCopyCount(1);
                       setShowSelectExistingDialog(false);
                       setShowCopyDialog(true);
                     }
                   }}
                   className="relative aspect-[3/4] border border-border rounded-md overflow-hidden hover:border-foreground hover:scale-105 transition-all bg-muted flex items-center justify-center shadow-sm"
                >
                  <img src={item.src} className="w-full h-full object-cover" alt={item.name} />
                </button>
              ))}
            </div>
          </div>
          
          <DialogFooter className="flex sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSelectExistingDialog(false)}
            >
              {state.language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
            </Button>
            <Button 
              type="button" 
              onClick={() => {
                setShowSelectExistingDialog(false);
                setTimeout(() => {
                  fileInputRef.current?.click();
                }, 100);
              }}
            >
              {isBusinessCardSlot
                ? (state.language === 'ku' ? 'بارکردنی کارتی نوێ' : state.language === 'ar' ? 'رفع بطاقة جديدة' : 'Upload New Card')
                : (state.language === 'ku' ? 'بارکردنی وێنەی نوێ' : 'Upload New Photo')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoSlot;