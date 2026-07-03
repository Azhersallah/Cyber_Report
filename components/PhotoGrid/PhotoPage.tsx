
import React, { useState, useEffect, useRef, memo } from 'react';
import { Photo, LayoutType } from '../../types';
import PhotoSlot from './PhotoSlot';
import { useApp } from '../../store/AppContext';
import { getTranslation } from '../../utils/translations';
import { Trash2, LayoutTemplate, ArrowLeftRight, Check, Plus, Type, X, Download, RotateCcw, Grid, FileText } from 'lucide-react';
import { LAYOUTS } from '../../constants';
import { LayoutPreview } from '../Layout/LayoutPreview';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

// --- Sub-component for Rich Text Areas ---
interface EditableBlockProps {
  initialHtml: string;
  onSave: (html: string) => void;
  placeholder: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  fontFamily?: string;
}

const EditableBlock: React.FC<EditableBlockProps> = memo(({ initialHtml, onSave, placeholder, className, style, disabled, fontFamily }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(!initialHtml || initialHtml === '<br>');
  const effectiveFontFamily = fontFamily || 'inherit';

  useEffect(() => {
    if (contentRef.current) {
        const newVal = initialHtml || '';
        if (contentRef.current.innerHTML !== newVal) {
            contentRef.current.innerHTML = newVal;
        }
        setIsEmpty(!newVal || newVal === '<br>' || newVal.trim() === '');
    }
  }, [initialHtml]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent;
    setIsEmpty(!text || text.trim() === '');
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onSave(e.currentTarget.innerHTML);
  };

  return (
    <div className={cn(
      "relative bg-white overflow-hidden group/text border transition-all duration-300",
      disabled && "opacity-50 cursor-not-allowed",
      isEmpty ? "border-border shadow-none print:border-white" : "border-border print:border-border",
      className
    )} style={style}>
      {isEmpty && (
        <div className="absolute top-3 left-3 right-3 text-muted-foreground pointer-events-none select-none z-10 text-justify no-print transition-opacity duration-300" style={{ fontFamily: effectiveFontFamily }}>
            {placeholder}
        </div>
      )}
      
      <div 
        ref={contentRef}
        className={cn(
          "w-full h-full p-3 outline-none text-black focus:ring-1 focus:ring-primary/30 overflow-auto relative z-0 text-justify leading-relaxed",
          disabled && "pointer-events-none"
        )}
        contentEditable={!disabled}
        onInput={handleInput}
        onBlur={handleBlur}
        dir="auto"
        style={{ ...style, color: 'black', fontFamily: effectiveFontFamily }}
      />
    </div>
  );
});


interface PhotoPageProps {
  pageIndex: number;
  photos: (Photo | null)[];
  layout: LayoutType;
  itemsPerPage: number;
  startIndex: number;
  onEditPhoto: (photo: Photo) => void;
  onDelete: () => void;
  onReset?: () => void;
  onChangeLayout?: (layout: LayoutType) => void;
  overlayNumbers?: number[];
}

const PhotoPage: React.FC<PhotoPageProps> = memo(({ 
    pageIndex, 
    startIndex,
    photos, 
    layout, 
    itemsPerPage, 
    onEditPhoto, 
    onDelete, 
    onReset,
    onChangeLayout,
    overlayNumbers
}) => {
  const { state, dispatch } = useApp();
  const t = (key: string) => getTranslation(key, state.language);
  const { settings } = state;
  
  // Use custom date from settings
  const dateStr = settings.footerDate;

  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(!!state.pageSubtitles[pageIndex]);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  
  const [localTitle, setLocalTitle] = useState(state.pageTitles[pageIndex] || state.globalTitle);
  const [localSubtitle, setLocalSubtitle] = useState(state.pageSubtitles[pageIndex] || '');
  const isReportMode = state.mode === 'photos';
  const showPageActions = state.mode === 'photos' || state.mode === 'businesscard' || state.mode === 'idphoto';

  useEffect(() => {
      const targetTitle = state.pageTitles[pageIndex] || state.globalTitle;
      setLocalTitle(targetTitle);
  }, [state.globalTitle, pageIndex, state.pageTitles[pageIndex]]);

  useEffect(() => {
      const subtitle = state.pageSubtitles[pageIndex] || '';
      setLocalSubtitle(subtitle);
      setShowSubtitle(!!subtitle);
  }, [pageIndex, state.pageSubtitles[pageIndex]]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setShowLayoutMenu(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const newHtml = e.currentTarget.innerHTML;
    setLocalTitle(newHtml);
    
    if (state.settings.autoUpdateSectionTitle && state.settings.sectionSize > 1) {
        dispatch({ 
            type: 'SET_BATCH_PAGE_TITLE', 
            payload: { startIndex: pageIndex, count: state.settings.sectionSize, title: newHtml } 
        });
    } else {
        dispatch({ 
            type: 'SET_PAGE_TITLE', 
            payload: { pageIndex, title: newHtml } 
        });
    }
  };

  const handleSubtitleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const newHtml = e.currentTarget.innerHTML;
    setLocalSubtitle(newHtml);
    dispatch({ 
        type: 'SET_PAGE_SUBTITLE', 
        payload: { pageIndex, subtitle: newHtml } 
    });
  };

  const handleAddSubtitle = () => {
    setShowSubtitle(true);
    setTimeout(() => {
        subtitleRef.current?.focus();
    }, 100);
  };

  const handleDeleteSubtitle = () => {
    setShowSubtitle(false);
    setLocalSubtitle('');
    dispatch({ 
        type: 'SET_PAGE_SUBTITLE', 
        payload: { pageIndex, subtitle: '' } 
    });
  };

  const getGridClass = () => {
    switch (layout) {
      case '1': return 'grid-cols-1 grid-rows-1';
      case '2': return 'grid-cols-1 grid-rows-2 gap-3';
      case '2col': return 'grid-cols-2 grid-rows-1 gap-3';
      case '4': return 'grid-cols-2 grid-rows-2 gap-3';
      case '1text': return 'grid-cols-1 grid-rows-[2fr_1fr] gap-3';
      case 'businesscard': return 'grid-cols-2 grid-rows-5 gap-0';
      case 'businesscard-form': return 'grid-cols-2 grid-rows-1 gap-0';
      case 'businesscard-form-reverse': return 'grid-cols-2 grid-rows-1 gap-0';
      case 'invoice': return 'grid-cols-2 grid-rows-1 gap-3';
      case 'invoice-1': return 'grid-cols-1 grid-rows-1';
      case 'invoice-4': return 'grid-cols-2 grid-rows-2 gap-0';
      case 'idphoto': return 'grid-cols-2 grid-rows-2 gap-0';
      case 'idphoto-1': return 'grid-cols-1 grid-rows-1';
      case 'idphoto-2': return 'grid-cols-1 grid-rows-2 gap-2';
      case 'idphoto-4': return 'grid-cols-2 grid-rows-2 gap-0';
      default: return 'grid-cols-1';
    }
  };

  const handleDescriptionChange = (photo: Photo, val: string) => {
      dispatch({ 
          type: 'UPDATE_PHOTO', 
          payload: { ...photo, description: val } 
      });
  };

  const handlePageTextChange = (key: string, value: string) => {
     dispatch({ type: 'UPDATE_TEXT_AREA', payload: { key, value } });
  };

  const handleInsertPhoto = (relativeIndex: number, newPhotos: Photo[]) => {
      if (state.mode === 'businesscard' || state.mode === 'invoice' || state.mode === 'idphoto') {
          newPhotos.forEach((photo, i) => {
              dispatch({ 
                  type: 'SET_SLOT_PHOTO', 
                  payload: { index: startIndex + relativeIndex + i, photo } 
              });
          });
      } else {
          dispatch({ 
              type: 'INSERT_PHOTOS', 
              payload: { index: startIndex + relativeIndex, photos: newPhotos } 
          });
      }
  };

  const handleSwapPhotos = (sourceIdx: number, targetIdx: number) => {
      if ('startViewTransition' in document) {
          (document as any).startViewTransition(() => {
              dispatch({
                  type: 'SWAP_PHOTOS',
                  payload: { sourceIndex: sourceIdx, targetIndex: targetIdx }
              });
          });
      } else {
          dispatch({
              type: 'SWAP_PHOTOS',
              payload: { sourceIndex: sourceIdx, targetIndex: targetIdx }
          });
      }
  };

  const getLayoutButtonData = (btnLayoutId: string) => {
      if (btnLayoutId === '2') {
          const is2Col = layout === '2col';
          const isActive = layout === '2' || layout === '2col';
          return {
              isActive,
              previewType: is2Col ? '2col' : '2',
              label: is2Col ? 'layout.2col' : 'layout.2',
              isToggle: true
          };
      }
      if (btnLayoutId === '1text') {
          const isSide = layout === '1text-side';
          const isActive = layout === '1text' || layout === '1text-side';
          return {
              isActive,
              previewType: isSide ? '1text-side' : '1text',
              label: isSide ? 'layout.1text-side' : 'layout.1text',
              isToggle: true
          };
      }
      if (btnLayoutId === 'businesscard') {
          const isGrid = layout === 'businesscard';
          const isForm = layout === 'businesscard-form';
          const isFormReverse = layout === 'businesscard-form-reverse';
          const isActive = isGrid || isForm || isFormReverse;
          let previewType = 'businesscard';
          let label = 'nav.businesscard';
          if (isForm) {
              previewType = 'businesscard-form';
              label = 'card.formLayout';
          } else if (isFormReverse) {
              previewType = 'businesscard-form-reverse';
              label = 'card.formLayoutReverse';
          }
          return {
              isActive,
              previewType,
              label,
              isToggle: true
          };
      }
      return {
          isActive: layout === btnLayoutId,
          previewType: btnLayoutId,
          label: LAYOUTS.find(l => l.id === btnLayoutId)?.label || '',
          isToggle: false
      };
  };

  const handleLayoutItemClick = (btnLayoutId: string) => {
      let target = btnLayoutId;
      if (btnLayoutId === '2') {
          if (layout === '2') target = '2col';
          else if (layout === '2col') target = '2';
          else target = '2';
      } else if (btnLayoutId === '1text') {
          if (layout === '1text') target = '1text-side';
          else if (layout === '1text-side') target = '1text';
          else target = '1text';
      } else if (btnLayoutId.startsWith('businesscard')) {
          target = btnLayoutId;
      }
      onChangeLayout(target as LayoutType);
      setShowLayoutMenu(false);
  };

  const renderContent = () => {
    const textStyle = { fontSize: `${settings.defaultTextFontSize || 20}px` };

    // ID Photo layouts - render A6 sections with 12 photos each (3×4 grid)
    // A6 size: 10.5cm × 14.8cm
    // For 1 and 2 A6 layouts: use fixed A6 size
    // For 4 A6 layout: each section fills 1/4 of A4 (which is exactly A6 size)
    
    const a6FixedSizeStyle: React.CSSProperties = { 
        width: '10.5cm', 
        height: '14.8cm',
        minWidth: '10.5cm',
        minHeight: '14.8cm',
        maxWidth: '10.5cm',
        maxHeight: '14.8cm'
    };

    const renderIdPhotoSection = (sectionIdx: number, useFixedSize: boolean = true) => {
        // Get slot count for this section (default 12)
        const slotCount = settings.idPhotoSlotCounts?.[sectionIdx] ?? 12;
        
        // Calculate the starting index for this A6 section's photos
        // Each A6 section has 12 photo slots
        const sectionPhotoStartIndex = sectionIdx * 12;
        
        return (
            <div 
                key={sectionIdx} 
                className={`border border-gray-200 relative bg-white flex items-center justify-center group ${!useFixedSize ? 'h-full w-full' : ''}`}
                style={useFixedSize ? a6FixedSizeStyle : undefined}
            >
                {/* Each A6 section: 3 columns × 4 rows = 12 ID photos */}
                <div className="grid grid-cols-3 grid-rows-4 gap-0 items-center justify-items-center">
                    {Array(12).fill(null).map((_, i) => {
                        const photoIndex = sectionPhotoStartIndex + i;
                        return (
                            <div key={i} className="relative overflow-hidden bg-white border border-gray-100" style={{ width: '2.7cm', height: '3.7cm' }}>
                                {i < slotCount ? (
                                    <PhotoSlot 
                                        index={i} 
                                        slotId={`p${pageIndex}_s${sectionIdx}_i${i}`}
                                        photo={photos[photoIndex]} 
                                        badgeColor={undefined}
                                        className="w-full h-full shadow-none rounded-none"
                                        onEdit={onEditPhoto}
                                        onInsert={(p) => handleInsertPhoto(photoIndex, p)}
                                        enableInsertTriggers={false}
                                        globalIndex={startIndex + photoIndex}
                                        onSwap={handleSwapPhotos}
                                        hideBadge={true}
                                        isIdPhotoSlot={true}
                                        maxCopies={slotCount}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-50" />
                                )}
                            </div>
                        );
                    })}
                </div>
                {/* A6 Section Badge (No-print) */}
                <div className="absolute top-1 left-1 text-[8px] font-black text-gray-300 no-print uppercase">A6 ({slotCount})</div>
                {/* Export A6 Section Button */}
                <button
                    className="absolute top-1 right-1 w-6 h-6 rounded-md bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors no-print opacity-0 group-hover:opacity-100 hover:opacity-100 z-10"
                    style={{ opacity: undefined }}
                    title={state.language === 'ku' ? 'داگرتنی بەش' : 'Export Section'}
                    onClick={async (e) => {
                        e.stopPropagation();
                        const sectionEl = (e.currentTarget as HTMLElement).parentElement;
                        if (!sectionEl) return;
                        try {
                            const { default: html2canvas } = await import('html2canvas');
                            const canvas = await html2canvas(sectionEl, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
                            const link = document.createElement('a');
                            link.download = `id-photos-section-${sectionIdx + 1}.png`;
                            link.href = canvas.toDataURL('image/png');
                            link.click();
                        } catch (err) { console.error('Export failed:', err); }
                    }}
                >
                    <Download size={12} />
                </button>
            </div>
        );
    };

    // 1 A6 section per A4 page (positioned based on setting)
    if (layout === 'idphoto-1') {
        const position = state.settings.idPhotoPosition || 'center';
        const positionClasses = {
            'center': 'items-start justify-center',
            'top-left': 'items-start justify-start',
            'top-right': 'items-start justify-end',
            'bottom-left': 'items-end justify-start',
            'bottom-right': 'items-end justify-end'
        };
        return (
            <div className={`h-full w-full flex ${positionClasses[position]}`}>
                {renderIdPhotoSection(0, true)}
            </div>
        );
    }

    // 2 A6 sections per A4 page (positioned based on setting)
    if (layout === 'idphoto-2') {
        const position2 = state.settings.idPhotoPosition2 || 'top';
        const positionClasses2 = {
            'top': 'flex-row items-start justify-center',
            'bottom': 'flex-row items-end justify-center',
            'left': 'flex-col items-start justify-center',
            'right': 'flex-col items-end justify-center'
        };
        return (
            <div className={`h-full w-full flex ${positionClasses2[position2]} gap-0`}>
                {[0, 1].map((sectionIdx) => renderIdPhotoSection(sectionIdx, true))}
            </div>
        );
    }

    // 4 A6 sections per A4 page (2×2 grid, each fills 1/4 of A4 = A6 size)
    if (layout === 'idphoto-4' || layout === 'idphoto') {
        return (
            <div className="grid grid-cols-2 grid-rows-2 gap-0 h-full w-full">
                {[0, 1, 2, 3].map((sectionIdx) => renderIdPhotoSection(sectionIdx, false))}
            </div>
        );
    }

    if (layout === 'businesscard') {
      return (
         <div className="grid grid-cols-2 grid-rows-5 gap-0 h-full w-full border-t border-l border-gray-100">
            {Array(10).fill(null).map((_, i) => (
                 <div key={i} className="border-r border-b border-gray-200 p-1.5 relative overflow-hidden bg-white">
                    <PhotoSlot 
                        index={i} 
                        slotId={`p${pageIndex}_s${i}`}
                        photo={photos[i]} 
                        badgeColor={settings.badgeColor}
                        className="w-full h-full shadow-none rounded-none"
                        onEdit={onEditPhoto}
                        onInsert={(p) => handleInsertPhoto(i, p)}
                        enableInsertTriggers={false}
                        globalIndex={startIndex + i}
                        onSwap={handleSwapPhotos}
                    />
                 </div>
            ))}
         </div>
      );
    }

    if (layout === 'businesscard-form') {
      const formGIdx = startIndex + 0;
      const formSize = state.businessCardSizes?.[formGIdx] || { width: 101.5, height: 290 };
      const isFormSelected = state.selectedBusinessCardIndex === formGIdx;
      const isFormHidden = formSize?.hidden;

      return (
         <div className="flex gap-0 h-full w-full border-t border-l border-gray-100 bg-white" onClick={() => { dispatch({ type: 'SELECT_BUSINESS_CARD_SLOT', payload: null }); dispatch({ type: 'SELECT_PAGE', payload: pageIndex }); }}>
            {/* Left side - 1 large form */}
            {!isFormHidden && (
               <div 
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SELECT_BUSINESS_CARD_SLOT', payload: formGIdx }); dispatch({ type: 'SELECT_PAGE', payload: pageIndex }); }}
                  className={cn(
                     "border-r border-b border-gray-200 p-1.5 relative overflow-hidden transition-all flex items-center justify-center bg-white min-h-0",
                     isFormSelected ? "ring-2 ring-blue-500 border-blue-500 z-10 bg-blue-50/5" : "hover:border-gray-400"
                  )}
                  style={{ 
                     width: `${formSize.width}mm`, 
                     height: `${formSize.height}mm`,
                     flex: 'none'
                  }}
               >
                  <div className="w-full h-full flex items-center justify-center min-h-0 min-w-0">
                     <PhotoSlot 
                        index={0} 
                        slotId={`p${pageIndex}_form`}
                        photo={photos[0] || undefined} 
                        badgeColor={settings.badgeColor}
                        className="w-full h-full shadow-none rounded-none min-h-0"
                        onEdit={onEditPhoto}
                        onInsert={(p) => handleInsertPhoto(0, p)}
                        enableInsertTriggers={false}
                        globalIndex={formGIdx}
                        onSwap={handleSwapPhotos}
                     />
                  </div>
               </div>
            )}
            
            {/* Right side - 5 cards vertically stacked */}
            <div className="flex-1 flex flex-col gap-0 items-start h-full min-h-0 bg-white">
               {Array(5).fill(null).map((_, i) => {
                  const idx = i + 1;
                  const gIdx = startIndex + idx;
                  const cardSize = state.businessCardSizes?.[gIdx];
                  const isSelected = state.selectedBusinessCardIndex === gIdx;

                  if (cardSize?.hidden) {
                     return null;
                  }

                  const actualCardSize = cardSize || { width: 101.5, height: 58 };

                  return (
                     <div 
                        key={i} 
                        onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SELECT_BUSINESS_CARD_SLOT', payload: gIdx }); dispatch({ type: 'SELECT_PAGE', payload: pageIndex }); }}
                        className={cn(
                           "border-r border-b border-gray-200 p-1.5 relative overflow-hidden transition-all flex items-center justify-center bg-white min-h-0",
                           isSelected ? "ring-2 ring-blue-500 border-blue-500 z-10 bg-blue-50/5" : "hover:border-gray-400"
                        )}
                        style={{
                           flex: 'none',
                           height: `${actualCardSize.height}mm`,
                           width: `${actualCardSize.width}mm`
                        }}
                     >
                        <div className="w-full h-full flex items-center justify-center min-h-0 min-w-0">
                           <PhotoSlot 
                              index={idx} 
                              slotId={`p${pageIndex}_s${idx}`}
                              photo={photos[idx] || undefined} 
                              badgeColor={settings.badgeColor}
                              className="w-full h-full shadow-none rounded-none min-h-0"
                              onEdit={onEditPhoto}
                              onInsert={(p) => handleInsertPhoto(idx, p)}
                              enableInsertTriggers={false}
                              globalIndex={gIdx}
                              onSwap={handleSwapPhotos}
                           />
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      );
    }

    if (layout === 'businesscard-form-reverse') {
      const formGIdx = startIndex + 5;
      const formSize = state.businessCardSizes?.[formGIdx] || { width: 101.5, height: 290 };
      const isFormSelected = state.selectedBusinessCardIndex === formGIdx;
      const isFormHidden = formSize?.hidden;

      return (
         <div className="flex gap-0 h-full w-full border-t border-l border-gray-100 bg-white" onClick={() => { dispatch({ type: 'SELECT_BUSINESS_CARD_SLOT', payload: null }); dispatch({ type: 'SELECT_PAGE', payload: pageIndex }); }}>
            {/* Left side - 5 cards vertically stacked */}
            <div className="flex-1 flex flex-col gap-0 items-end h-full min-h-0 bg-white">
               {Array(5).fill(null).map((_, i) => {
                  const idx = i + 1;
                  const gIdx = startIndex + idx;
                  const cardSize = state.businessCardSizes?.[gIdx];
                  const isSelected = state.selectedBusinessCardIndex === gIdx;

                  if (cardSize?.hidden) {
                     return null;
                  }

                  const actualCardSize = cardSize || { width: 101.5, height: 58 };

                  return (
                     <div 
                        key={i} 
                        onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SELECT_BUSINESS_CARD_SLOT', payload: gIdx }); dispatch({ type: 'SELECT_PAGE', payload: pageIndex }); }}
                        className={cn(
                           "border-r border-b border-gray-200 p-1.5 relative overflow-hidden transition-all flex items-center justify-center bg-white min-h-0",
                           isSelected ? "ring-2 ring-blue-500 border-blue-500 z-10 bg-blue-50/5" : "hover:border-gray-400"
                        )}
                        style={{
                           flex: 'none',
                           height: `${actualCardSize.height}mm`,
                           width: `${actualCardSize.width}mm`
                        }}
                     >
                        <div className="w-full h-full flex items-center justify-center min-h-0 min-w-0">
                           <PhotoSlot 
                              index={idx} 
                              slotId={`p${pageIndex}_s${idx}`}
                              photo={photos[idx] || undefined} 
                              badgeColor={settings.badgeColor}
                              className="w-full h-full shadow-none rounded-none min-h-0"
                              onEdit={onEditPhoto}
                              onInsert={(p) => handleInsertPhoto(idx, p)}
                              enableInsertTriggers={false}
                              globalIndex={gIdx}
                              onSwap={handleSwapPhotos}
                           />
                        </div>
                     </div>
                  );
               })}
            </div>

            {/* Right side - 1 large form */}
            {!isFormHidden && (
               <div 
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SELECT_BUSINESS_CARD_SLOT', payload: formGIdx }); dispatch({ type: 'SELECT_PAGE', payload: pageIndex }); }}
                  className={cn(
                     "border-r border-b border-gray-200 p-1.5 relative overflow-hidden transition-all flex items-center justify-center bg-white min-h-0",
                     isFormSelected ? "ring-2 ring-blue-500 border-blue-500 z-10 bg-blue-50/5" : "hover:border-gray-400"
                  )}
                  style={{ 
                     width: `${formSize.width}mm`, 
                     height: `${formSize.height}mm`,
                     flex: 'none'
                  }}
               >
                  <div className="w-full h-full flex items-center justify-center min-h-0 min-w-0">
                     <PhotoSlot 
                        index={0} 
                        slotId={`p${pageIndex}_form`}
                        photo={photos[0] || undefined} 
                        badgeColor={settings.badgeColor}
                        className="w-full h-full shadow-none rounded-none min-h-0"
                        onEdit={onEditPhoto}
                        onInsert={(p) => handleInsertPhoto(0, p)}
                        enableInsertTriggers={false}
                        globalIndex={formGIdx}
                        onSwap={handleSwapPhotos}
                     />
                  </div>
               </div>
            )}
         </div>
      );
    }
    
    if (layout === 'invoice') {
        const handleOverlayPositionChange = (x: number, y: number) => {
            dispatch({ 
                type: 'UPDATE_SETTINGS', 
                payload: { 
                    invoiceNumberStyle: { 
                        ...settings.invoiceNumberStyle, 
                        x: Math.round(x * 10) / 10, 
                        y: Math.round(y * 10) / 10 
                    } 
                } 
            });
        };
        
        return (
           <div className="grid grid-cols-2 grid-rows-1 gap-3 h-full w-full">
             <PhotoSlot 
                index={0} slotId="0" photo={photos[0]} 
                badgeColor={settings.badgeColor} className="h-full w-full min-h-0 min-w-0 rounded-none" 
                onEdit={onEditPhoto} 
                onInsert={(p) => handleInsertPhoto(0, p)}
                enableInsertTriggers={false}
                globalIndex={startIndex + 0}
                onSwap={handleSwapPhotos}
                overlayNumber={overlayNumbers ? overlayNumbers[0] : undefined}
                overlayStyle={settings.invoiceNumberStyle}
                onOverlayPositionChange={handleOverlayPositionChange}
             />
             <PhotoSlot 
                index={1} slotId="1" photo={photos[1]} 
                badgeColor={settings.badgeColor} className="h-full w-full min-h-0 min-w-0 rounded-none" 
                onEdit={onEditPhoto} 
                onInsert={(p) => handleInsertPhoto(1, p)}
                enableInsertTriggers={false}
                globalIndex={startIndex + 1}
                onSwap={handleSwapPhotos}
                overlayNumber={overlayNumbers ? overlayNumbers[1] : undefined}
                overlayStyle={settings.invoiceNumberStyle}
                onOverlayPositionChange={handleOverlayPositionChange}
             />
           </div>
        );
    }

    // Single invoice per page (portrait)
    if (layout === 'invoice-1') {
        const handleOverlayPositionChange = (x: number, y: number) => {
            dispatch({ 
                type: 'UPDATE_SETTINGS', 
                payload: { 
                    invoiceNumberStyle: { 
                        ...settings.invoiceNumberStyle, 
                        x: Math.round(x * 10) / 10, 
                        y: Math.round(y * 10) / 10 
                    } 
                } 
            });
        };
        
        return (
           <div className="h-full w-full">
             <PhotoSlot 
                index={0} slotId="0" photo={photos[0]} 
                badgeColor={settings.badgeColor} className="h-full w-full min-h-0 min-w-0 rounded-none" 
                onEdit={onEditPhoto} 
                onInsert={(p) => handleInsertPhoto(0, p)}
                enableInsertTriggers={false}
                globalIndex={startIndex + 0}
                onSwap={handleSwapPhotos}
                overlayNumber={overlayNumbers ? overlayNumbers[0] : undefined}
                overlayStyle={settings.invoiceNumberStyle}
                onOverlayPositionChange={handleOverlayPositionChange}
             />
           </div>
        );
    }

    // 4 invoices per page (portrait, A6 sections)
    if (layout === 'invoice-4') {
        const handleOverlayPositionChange = (x: number, y: number) => {
            dispatch({ 
                type: 'UPDATE_SETTINGS', 
                payload: { 
                    invoiceNumberStyle: { 
                        ...settings.invoiceNumberStyle, 
                        x: Math.round(x * 10) / 10, 
                        y: Math.round(y * 10) / 10 
                    } 
                } 
            });
        };
        
        return (
           <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full w-full">
             {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="border border-gray-200 relative bg-white rounded-sm overflow-hidden">
                    <PhotoSlot 
                        index={idx} slotId={idx.toString()} photo={photos[idx]} 
                        badgeColor={settings.badgeColor} className="h-full w-full min-h-0 min-w-0 rounded-none" 
                        onEdit={onEditPhoto} 
                        onInsert={(p) => handleInsertPhoto(idx, p)}
                        enableInsertTriggers={false}
                        globalIndex={startIndex + idx}
                        onSwap={handleSwapPhotos}
                        overlayNumber={overlayNumbers ? overlayNumbers[idx] : undefined}
                        overlayStyle={settings.invoiceNumberStyle}
                        onOverlayPositionChange={handleOverlayPositionChange}
                    />
                </div>
             ))}
           </div>
        );
    }

    if (layout === '2text') {
        return (
            <div className="grid grid-cols-2 gap-3 h-full w-full">
                <div className="flex flex-col gap-3 h-full min-h-0 min-w-0">
                    <PhotoSlot 
                        index={0} 
                        slotId={`p${pageIndex}_s0`} 
                        photo={photos[0]} 
                        badgeColor={settings.badgeColor} 
                        className="flex-1 w-full min-h-0 min-w-0 rounded-none" 
                        onEdit={onEditPhoto} 
                        onInsert={(p) => handleInsertPhoto(0, p)}
                        globalIndex={startIndex + 0}
                        onSwap={handleSwapPhotos}
                    />
                    <PhotoSlot 
                        index={1} 
                        slotId={`p${pageIndex}_s1`} 
                        photo={photos[1]} 
                        badgeColor={settings.badgeColor} 
                        className="flex-1 w-full min-h-0 min-w-0 rounded-none" 
                        onEdit={onEditPhoto} 
                        onInsert={(p) => handleInsertPhoto(1, p)}
                        globalIndex={startIndex + 1}
                        onSwap={handleSwapPhotos}
                    />
                </div>
                
                <div className="flex flex-col gap-3 h-full min-h-0 min-w-0">
                    {[0, 1].map((i) => {
                        const p = photos[i];
                        return (
                            <EditableBlock
                                key={`desc_${i}_${p ? p.id : 'empty'}`}
                                className="flex-1 w-full transition-colors min-h-0 min-w-0"
                                initialHtml={p?.description || ''}
                                onSave={(val) => p && handleDescriptionChange(p, val)}
                                placeholder={p ? t('ph.text.multi') : t('list.empty')}
                                style={textStyle}
                                disabled={!p}
                                fontFamily={settings.defaultFontFamily}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }

    if (layout === '1text') {
       const photo = photos[0];
       return (
         <div className="flex flex-col h-full gap-3 min-h-0">
            <PhotoSlot 
              index={0} 
              slotId={`p${pageIndex}_s0`}
              photo={photo} 
              badgeColor={settings.badgeColor}
              className="h-3/5 w-full min-h-0 min-w-0 rounded-none"
              onEdit={onEditPhoto}
              onInsert={(p) => handleInsertPhoto(0, p)}
              globalIndex={startIndex + 0}
              onSwap={handleSwapPhotos}
            />
            <EditableBlock
                key={`desc_0_${photo ? photo.id : 'empty'}`}
                className="flex-1 transition-colors min-h-0 min-w-0"
                initialHtml={photo?.description || ''}
                onSave={(val) => photo && handleDescriptionChange(photo, val)}
                placeholder={photo ? t('ph.text.single') : t('list.empty')}
                style={textStyle}
                disabled={!photo}
                fontFamily={settings.defaultFontFamily}
            />
         </div>
       );
    }

    if (layout === '1text-side') {
       const photo = photos[0];
       return (
         <div className="grid grid-cols-2 gap-3 h-full w-full">
            <PhotoSlot 
              index={0} 
              slotId={`p${pageIndex}_s0`}
              photo={photo} 
              badgeColor={settings.badgeColor}
              className="h-full w-full min-h-0 min-w-0 rounded-none"
              onEdit={onEditPhoto}
              onInsert={(p) => handleInsertPhoto(0, p)}
              globalIndex={startIndex + 0}
              onSwap={handleSwapPhotos}
            />
            <EditableBlock
                key={`desc_0_${photo ? photo.id : 'empty'}`}
                className="h-full w-full transition-colors min-h-0 min-w-0"
                initialHtml={photo?.description || ''}
                onSave={(val) => photo && handleDescriptionChange(photo, val)}
                placeholder={photo ? t('ph.text.single') : t('list.empty')}
                style={textStyle}
                disabled={!photo}
                fontFamily={settings.defaultFontFamily}
            />
         </div>
       );
    }
    
    if (layout === 'onlytext') {
       const textKey = `page_${pageIndex}_text`;
       return (
          <EditableBlock
              className="h-full w-full transition-colors min-h-0 min-w-0"
              initialHtml={state.textAreas[textKey] || ''}
              onSave={(val) => handlePageTextChange(textKey, val)}
              placeholder={t('ph.text.only')}
              style={textStyle}
              fontFamily={settings.defaultFontFamily}
          />
       );
    }

    return (
      <div className={`grid ${getGridClass()} h-full w-full`}>
        {layout === '1' && (
            <PhotoSlot 
                index={0} slotId="0" photo={photos[0]} 
                badgeColor={settings.badgeColor} className="h-full w-full min-h-0 min-w-0 rounded-none" 
                onEdit={onEditPhoto} 
                onInsert={(p) => handleInsertPhoto(0, p)}
                globalIndex={startIndex + 0}
                onSwap={handleSwapPhotos}
            />
        )}
        {(layout === '2' || layout === '2col') && (
           <>
             <PhotoSlot 
                index={0} slotId="0" photo={photos[0]} 
                badgeColor={settings.badgeColor} className="h-full w-full min-h-0 min-w-0 rounded-none" 
                onEdit={onEditPhoto} 
                onInsert={(p) => handleInsertPhoto(0, p)}
                globalIndex={startIndex + 0}
                onSwap={handleSwapPhotos}
             />
             <PhotoSlot 
                index={1} slotId="1" photo={photos[1]} 
                badgeColor={settings.badgeColor} className="h-full w-full min-h-0 min-w-0 rounded-none" 
                onEdit={onEditPhoto} 
                onInsert={(p) => handleInsertPhoto(1, p)}
                globalIndex={startIndex + 1}
                onSwap={handleSwapPhotos}
             />
           </>
        )}
        {layout === '4' && Array(4).fill(null).map((_, i) => (
             <PhotoSlot 
                key={i} index={i} slotId={i.toString()} 
                photo={photos[i]} 
                badgeColor={settings.badgeColor} className="h-full w-full min-h-0 min-w-0 rounded-none" 
                onEdit={onEditPhoto} 
                onInsert={(p) => handleInsertPhoto(i, p)}
                globalIndex={startIndex + i}
                onSwap={handleSwapPhotos}
             />
        ))}
      </div>
    );
  };

  const getPaddingClass = () => {
    if (layout === 'idphoto' || layout === 'idphoto-1' || layout === 'idphoto-2' || layout === 'idphoto-4') return 'p-0';
    if (layout === 'businesscard' || layout === 'businesscard-form' || layout === 'businesscard-form-reverse') return 'p-3';
    if (layout === 'invoice' || layout === 'invoice-1' || layout === 'invoice-4') return 'p-2';
    if (isReportMode) return 'p-4';
    return 'p-6';
  };

  return (
    <div 
      className={`flex flex-col h-full w-full relative group ${getPaddingClass()} bg-white`} 
      style={{ 
        fontFamily: settings.defaultFontFamily || 'Inter',
        paddingTop: `${4 + (settings.marginTop ?? 0)}mm`,
        paddingRight: `${3 + (settings.marginRight ?? 0)}mm`,
                        paddingBottom: `${3 + (settings.marginBottom ?? 0)}mm`,
        paddingLeft: `${3 + (settings.marginLeft ?? 0)}mm`
      }} 
      dir="ltr"
      onClick={() => { dispatch({ type: 'SELECT_PAGE', payload: pageIndex }); }}
    >
       
       {showPageActions && (
         <div className={cn(
             "absolute top-2 right-2 flex gap-1 transition-opacity no-print z-50",
             showLayoutMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            {(state.mode === 'photos' || state.mode === 'businesscard') && (
              <Button 
                 onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                 onMouseDown={(e) => e.stopPropagation()}
                 variant="secondary"
                 size="icon"
                 className="h-8 w-8"
                 title="Change Layout"
              >
                  <LayoutTemplate size={16} />
              </Button>
            )}
            
            {showLayoutMenu && state.mode === 'photos' && (
                <div 
                  ref={menuRef}
                  className="absolute top-full right-0 mt-2 rounded-xl shadow-xl border p-3 grid grid-cols-3 gap-3 w-64 z-50 animate-fade-in"
                  style={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7' }}
                >
                    {LAYOUTS.filter(l => !['2col', '1text-side', 'businesscard', 'businesscard-form', 'businesscard-form-reverse', 'invoice', 'invoice-1', 'invoice-4', 'idphoto', 'idphoto-1', 'idphoto-2', 'idphoto-4'].includes(l.id)).map(l => {
                        const { isActive, previewType, label, isToggle } = getLayoutButtonData(l.id);
                        return (
                            <button
                                key={l.id}
                                onClick={() => handleLayoutItemClick(l.id)}
                                className={cn(
                                    "relative flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all group"
                                )}
                                style={{ 
                                    color: '#18181b',
                                    borderColor: isActive ? '#18181b' : 'transparent',
                                    backgroundColor: isActive ? 'rgba(24,24,27,0.05)' : 'transparent'
                                }}
                                title={t(label)}
                            >
                                <LayoutPreview type={previewType} forPaper={true} />
                                <span 
                                    className="text-[10px] font-medium text-center leading-tight"
                                    style={{ color: isActive ? '#18181b' : '#71717a' }}
                                >
                                    {t(label)}
                                </span>

                                {isActive && (
                                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center border-2 shadow-sm z-20" style={{ backgroundColor: '#18181b', borderColor: '#ffffff' }}>
                                      <Check size={10} className="text-white" strokeWidth={4} />
                                  </div>
                                )}

                                {isToggle && (
                                  <div 
                                      className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full transition-colors z-10"
                                      style={{ backgroundColor: isActive ? 'rgba(24,24,27,0.2)' : '#f4f4f5', color: isActive ? '#18181b' : '#71717a' }}
                                  >
                                      <ArrowLeftRight size={10} />
                                  </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {showLayoutMenu && state.mode === 'businesscard' && (
                <div 
                  ref={menuRef}
                  className="absolute top-full right-0 mt-2 rounded-xl shadow-xl border p-3 flex flex-col gap-2 w-52 z-50 animate-fade-in bg-white"
                  style={{ borderColor: '#e4e4e7' }}
                >
                    {/* Grid Layout */}
                    <button
                        onClick={() => handleLayoutItemClick('businesscard')}
                        className="flex items-center gap-2 p-2 rounded-lg border-2 transition-all hover:bg-muted w-full text-left"
                        style={{ 
                            borderColor: layout === 'businesscard' ? '#18181b' : 'transparent',
                            backgroundColor: layout === 'businesscard' ? 'rgba(24,24,27,0.05)' : 'transparent'
                        }}
                    >
                        <Grid size={14} />
                        <span className="text-sm font-medium">{t('card.gridLayout')}</span>
                    </button>

                    {/* Form Layout */}
                    <button
                        onClick={() => handleLayoutItemClick('businesscard-form')}
                        className="flex items-center gap-2 p-2 rounded-lg border-2 transition-all hover:bg-muted w-full text-left"
                        style={{ 
                            borderColor: layout === 'businesscard-form' ? '#18181b' : 'transparent',
                            backgroundColor: layout === 'businesscard-form' ? 'rgba(24,24,27,0.05)' : 'transparent'
                        }}
                    >
                        <FileText size={14} />
                        <span className="text-sm font-medium">{t('card.formLayout')}</span>
                    </button>

                    {/* Form Layout Reverse */}
                    <button
                        onClick={() => handleLayoutItemClick('businesscard-form-reverse')}
                        className="flex items-center gap-2 p-2 rounded-lg border-2 transition-all hover:bg-muted w-full text-left"
                        style={{ 
                            borderColor: layout === 'businesscard-form-reverse' ? '#18181b' : 'transparent',
                            backgroundColor: layout === 'businesscard-form-reverse' ? 'rgba(24,24,27,0.05)' : 'transparent'
                        }}
                    >
                        <FileText size={14} className="rotate-180" />
                        <span className="text-sm font-medium">{t('card.formLayoutReverse')}</span>
                    </button>
                </div>
            )}

            {onReset && (
                <Button 
                   onClick={onReset}
                   variant="secondary"
                   size="icon"
                   className="h-8 w-8 hover:bg-muted"
                   title={state.language === 'ku' ? 'ڕیسێتکردنی پەڕە' : 'Reset Page'}
                >
                    <RotateCcw size={16} />
                </Button>
            )}

            <Button 
               onClick={onDelete}
               variant="secondary"
               size="icon"
               className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
               title={state.language === 'ku' ? 'سڕینەوەی پەڕە' : 'Delete Page'}
            >
                <Trash2 size={16} />
            </Button>
         </div>
       )}

       {settings.showTitle && isReportMode && (
           <div className="flex flex-col items-center mb-4 relative group">
               <div className="w-full text-center pb-2 border-b-2 border-border relative">
                    <div 
                        ref={titleRef}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleTitleBlur}
                        className="font-bold outline-none border-b border-transparent focus:border-primary transition-colors inline-block min-w-[100px] text-black"
                        style={{ 
                            fontSize: `${settings.defaultTitleFontSize}px`,
                            color: 'black',
                            fontFamily: settings.defaultFontFamily || 'Inter'
                        }}
                        dir="auto"
                        dangerouslySetInnerHTML={{ __html: localTitle }}
                    />
                    
                    {/* Add text button - circle, positioned on the border line */}
                    {!showSubtitle && (
                        <button
                            onClick={handleAddSubtitle}
                            className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-muted hover:bg-foreground hover:text-background border border-border flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 no-print z-10"
                            title="Add text"
                        >
                            <Type size={12} />
                        </button>
                    )}
               </div>
               
               {/* Subtitle section - below the border line */}
               {showSubtitle && (
                   <div className="w-full relative group/subtitle mt-2">
                       <div 
                           ref={subtitleRef}
                           contentEditable
                           suppressContentEditableWarning
                           onBlur={handleSubtitleBlur}
                           className="w-full text-center outline-none border-b border-transparent focus:border-primary transition-colors text-muted-foreground"
                           style={{ 
                               fontSize: `${Math.max(12, (settings.defaultTitleFontSize || 20) - 6)}px`,
                               color: '#666',
                               fontFamily: settings.defaultFontFamily || 'Inter'
                           }}
                           dir="auto"
                           dangerouslySetInnerHTML={{ __html: localSubtitle }}
                           data-placeholder="Add text here..."
                       />
                       <button
                           onClick={handleDeleteSubtitle}
                           className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-destructive/10 hover:bg-destructive text-destructive hover:text-white flex items-center justify-center transition-all opacity-0 group-hover/subtitle:opacity-100 no-print"
                           title="Delete text"
                       >
                           <X size={10} />
                       </button>
                   </div>
               )}
           </div>
       )}

       <div className="flex-1 min-h-0 min-w-0 relative">
          {renderContent()}
       </div>

       {settings.showFooter && isReportMode && (
           <div className="h-8 px-0 mt-auto flex items-center justify-between border-t border-border bg-white relative z-20 pt-[10px]">
               <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-4">
                   {settings.showDateUser && (
                       <span className="text-muted-foreground">{dateStr} &bull; {settings.userName}</span>
                   )}
               </div>
               
               {settings.showPageNumber && (
                   <div className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground/50 select-none">
                       {pageIndex + (settings.startPageNumber || 1)}
                   </div>
               )}

               <div className="h-full py-0.5 flex justify-end items-center">
                   {settings.showLogo && settings.logo && (
                       <img 
                            src={settings.logo} 
                            alt="Logo" 
                            className="w-auto object-contain" 
                            style={{ 
                                height: '100%',
                                maxHeight: '100%',
                                transform: `scale(${settings.logoScale || 1})`,
                                transformOrigin: 'right'
                            }} 
                       />
                   )}
               </div>
           </div>
       )}
    </div>
  );
});

export default PhotoPage;
