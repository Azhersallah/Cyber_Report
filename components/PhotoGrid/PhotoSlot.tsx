
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
              "absolute flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200 cursor-pointer group/trigger no-print z-[100]",
              isVert ? "-top-6 left-0 right-0 h-8" : "-left-6 top-0 bottom-0 w-8"
          )}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          title="Insert Photo Here"
      >
          <div className={cn(
              "absolute bg-foreground/0 group-hover/trigger:bg-foreground/10 transition-colors",
              isVert ? "w-full h-px" : "h-full w-px"
          )}></div>
          
          <div className="absolute bg-foreground text-background rounded-full p-1 shadow-sm transform scale-50 opacity-0 group-hover/trigger:opacity-100 group-hover/trigger:scale-100 transition-all duration-200">
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<Photo | null>(null);
  const [copyCount, setCopyCount] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const insertInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDims, setContainerDims] = useState({ width: 0, height: 0 });

  // Handle rounding logic - use square borders if requested by parent
  const isRoundedNone = className.includes('rounded-none');
  const roundingClass = isRoundedNone ? 'rounded-none' : 'rounded-xl';

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
            setContainerDims({ 
                width: entry.contentRect.width, 
                height: entry.contentRect.height 
            });
        }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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
    dispatch({ type: 'REMOVE_PHOTO', payload: photo.id });
  };

  const handleReplaceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
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
            
            // For ID photo slots, show dialog to ask how many copies
            if (isIdPhotoSlot) {
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
      e.preventDefault();
      // Allow both move (internal) and copy (external files)
      if (e.dataTransfer.types.includes('Files')) {
          e.dataTransfer.dropEffect = 'copy';
      } else {
          e.dataTransfer.dropEffect = 'move';
      }
      if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
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

  const wrapperStyle = isRotated90 && containerDims.width > 0 ? {
      width: `${containerDims.height}px`,
      height: `${containerDims.width}px`
  } : {
      width: '100%',
      height: '100%'
  };

  return (
    <div 
      className={cn(
        "relative group bg-white border select-none transition-all duration-200",
        roundingClass,
        className,
        !photo ? "shadow-none border-dashed border-muted-foreground/40 hover:border-muted-foreground print:border-muted-foreground/40" : "shadow-sm border-border print:border-border",
        isDragOver && "ring-2 ring-foreground/20 border-foreground/50 scale-[1.01] z-20",
        "print:shadow-none"
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

      <div ref={containerRef} className={`w-full h-full overflow-hidden relative ${roundingClass} z-0 flex items-center justify-center transition-opacity`}>
          
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
                onClick={handleReplaceClick}
             >
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground transition-colors no-print">
                    <div className={cn(
                        "w-10 h-10 rounded-md flex items-center justify-center transition-all border",
                        isDragOver 
                            ? "bg-foreground/10 text-foreground border-foreground/20" 
                            : "bg-muted text-muted-foreground border-transparent group-hover/empty:text-foreground group-hover/empty:bg-foreground/5"
                    )}>
                        <Plus size={20} />
                    </div>
                    
                    <span 
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

      {photo && (
        <div 
            className={cn(
                "absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5 p-1 bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-lg transition-all transform z-[100] no-print",
                isHovered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 pointer-events-none"
            )}
        >
            {!isIdPhotoSlot && (
                <>
                    <button onClick={handleRotate} className="p-1.5 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors" title={t('slot.rotate')}>
                    <RotateCw size={14} />
                    </button>
                    <button onClick={() => onEdit(photo)} className="p-1.5 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors" title={t('slot.edit')}>
                    <Edit2 size={14} />
                    </button>
                    <button onClick={handleReplaceClick} className="p-1.5 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors" title={t('slot.replace')}>
                    <ImageUp size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); if (!photo) return; const link = document.createElement('a'); link.download = photo.name || 'photo.png'; link.href = photo.src; link.click(); }} className="p-1.5 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors" title={state.language === 'ku' ? 'داگرتن' : 'Save'}>
                    <Download size={14} />
                    </button>
                    <button onClick={handleRemove} className="p-1.5 hover:bg-destructive/10 rounded-sm text-muted-foreground hover:text-destructive transition-colors" title={t('slot.remove')}>
                    <X size={14} />
                    </button>
                </>
            )}
            {isIdPhotoSlot && (
                <>
                    <button onClick={() => onEdit(photo)} className="p-1.5 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors" title={t('slot.edit')}>
                    <Edit2 size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); if (!photo) return; const link = document.createElement('a'); link.download = photo.name || 'photo.png'; link.href = photo.src; link.click(); }} className="p-1.5 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors" title={state.language === 'ku' ? 'داگرتن' : 'Save'}>
                    <Download size={14} />
                    </button>
                    <button onClick={handleRemove} className="p-1.5 hover:bg-destructive/10 rounded-sm text-muted-foreground hover:text-destructive transition-colors" title={t('slot.remove')}>
                    <X size={14} />
                    </button>
                </>
            )}
        </div>
      )}

      {photo && (
          <div className="absolute top-2 right-2 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing no-print z-[100]">
             <GripVertical size={16} />
          </div>
      )}

      {/* ID Photo Copy Count Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('idphoto.copyDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('idphoto.copyDialog.description')}
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
                  max={maxCopies}
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
    </div>
  );
};

export default PhotoSlot;