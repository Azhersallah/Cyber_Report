
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { SearchProvider } from './store/SearchContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import PhotoPage from './components/PhotoGrid/PhotoPage';

import ImageEditor from './components/Editor/ImageEditor';
import TextFormattingToolbar from './components/Editor/TextFormattingToolbar';
import PrintModal from './components/Modals/PrintModal';
import ConfirmModal from './components/Modals/ConfirmModal';
import SetupWizardModal from './components/Modals/SetupWizardModal';
import { Photo, LayoutType, AppState } from './types';
import { LAYOUTS, getLayoutCapacity } from './constants';
import { getTranslation } from './utils/translations';
import { Plus, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { decryptProjectData } from './utils/encryption';
import { cn } from './lib/utils';
import { ToastProvider, useToast } from './components/ui/toast';

const AddPageButton: React.FC<{ onClick: () => void; isTop?: boolean }> = ({ onClick, isTop = false }) => {
  const { state } = useApp();
  const label = getTranslation(state.language, 'btn.addPage');

  return (
    <div className={`relative group flex items-center justify-center no-print w-full ${isTop ? 'pt-1 pb-4' : 'py-6'}`}>
      <div className="absolute inset-x-0 h-px bg-zinc-200 dark:bg-zinc-800 opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      <button
        onClick={onClick}
        className="relative z-10 w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 flex items-center justify-center opacity-65 group-hover:opacity-100 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-md transition-all duration-300 transform scale-90 group-hover:scale-105 active:scale-95"
        title={label}
      >
        <Plus size={14} className="stroke-[2.5]" />
      </button>
    </div>
  );
};

const FloatingZoomControls: React.FC<{ maxPossibleZoom: number }> = ({ maxPossibleZoom }) => {
  const { state, dispatch } = useApp();

  const handleZoom = (delta: number) => {
    const nextZoom = Math.round((state.zoom + delta) * 10) / 10;
    const cappedZoom = Math.min(maxPossibleZoom, Math.max(0.2, nextZoom));
    dispatch({ type: 'SET_ZOOM', payload: cappedZoom });
  };

  const isKurdish = state.language === 'ku';

  return (
    <div className={cn(
      "fixed bottom-4 flex items-center bg-background rounded-md shadow-lg border border-border p-1 z-40 no-print animate-fade-in",
      isKurdish ? "left-6" : "right-6"
    )}>
      <button
        onClick={() => handleZoom(-0.1)}
        className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground transition-colors"
        title="Zoom Out"
      >
        <ZoomOut size={14} />
      </button>
      <span className="text-xs font-mono font-medium text-foreground w-10 text-center select-none">
        {Math.round(state.zoom * 100)}%
      </span>
      <button
        onClick={() => handleZoom(0.1)}
        disabled={state.zoom >= maxPossibleZoom}
        className={cn(
          "w-7 h-7 flex items-center justify-center rounded-sm transition-colors",
          state.zoom >= maxPossibleZoom
            ? "text-muted-foreground/30 cursor-not-allowed"
            : "hover:bg-muted text-muted-foreground"
        )}
        title="Zoom In"
      >
        <ZoomIn size={14} />
      </button>
      <div className="w-px h-4 bg-border mx-0.5"></div>
      <button
        onClick={() => dispatch({ type: 'SET_ZOOM', payload: Math.min(1, maxPossibleZoom) })}
        className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground transition-colors"
        title="Reset Zoom"
      >
        <Maximize size={14} />
      </button>
    </div>
  );
};


const MainContent: React.FC = () => {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [pagesToPrint, setPagesToPrint] = useState<number[] | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ pageIndex: number; startIndex: number; count: number } | null>(null);
  const [resetConfirmation, setResetConfirmation] = useState<{ pageIndex: number; startIndex: number; count: number } | null>(null);
  const [droppedProjectFile, setDroppedProjectFile] = useState<string | null>(null);
  const [pendingProjectData, setPendingProjectData] = useState<{content: string; filePath?: string} | null>(null);
  const [newlyAddedPageIndex, setNewlyAddedPageIndex] = useState<number | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const t = (key: string) => getTranslation(key, state.language);

  useEffect(() => {
    const isSetupCompleted = localStorage.getItem('photoPrinterSetupCompleted') === 'true';
    if (!isSetupCompleted) {
      setShowSetupWizard(true);
    }
  }, []);

  useEffect(() => {
    if (newlyAddedPageIndex !== null) {
      const timer = setTimeout(() => {
        setNewlyAddedPageIndex(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [newlyAddedPageIndex]);





  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window && (window as any).process && (window as any).process.type === 'renderer') {
      const { ipcRenderer } = (window as any).require('electron');

      const handleOpenEncryptedProject = async (event: any, data: string | { content: string, filePath: string }) => {
        try {
          // Handle both old format (string) and new format (object)
          const content = typeof data === 'string' ? data : data.content;
          const filePath = typeof data === 'object' && data.filePath ? data.filePath : undefined;
          
          // Check if there's already a project loaded (user has photos or settings changed)
          // If not, load directly without confirmation (this is a new window from double-click)
          const hasProject = state.photos.length > 0 || state.cardPhotos.length > 0;
          
          if (hasProject) {
            // Show confirmation dialog - user might lose unsaved changes
            setPendingProjectData({ content, filePath });
          } else {
            // Load directly - this is a fresh window, no data to lose
            const decryptedJson = await decryptProjectData(content);
            const parsed = JSON.parse(decryptedJson);
            dispatch({ type: 'LOAD_PROJECT', payload: parsed });
            
            // Set the file path so the title shows the project name
            if (filePath) {
              ipcRenderer.invoke('set-current-project-path', filePath);
              // Also send event to Header to update currentFilePath state
              window.dispatchEvent(new CustomEvent('project-file-path-changed', { detail: filePath }));
            }
          }
        } catch (err) {
          console.error("IPC Opening Failed:", err);
          alert("Could not open this project file. It may be corrupted or encrypted with a different key.");
        }
      };

      ipcRenderer.on('open-project-encrypted', handleOpenEncryptedProject);
      
      // Check for pending file to open immediately after mount (fixes double-click open timing issues)
      ipcRenderer.invoke('get-pending-file').then(async (result: any) => {
        if (result && result.success && result.content) {
          try {
            // On initial mount, photos array is always empty, so load directly without confirmation
            // This handles the double-click startup case
            const decryptedJson = await decryptProjectData(result.content);
            const parsed = JSON.parse(decryptedJson);
            dispatch({ type: 'LOAD_PROJECT', payload: parsed });
            
            // Set the file path so the title shows the project name
            if (result.filePath) {
              ipcRenderer.invoke('set-current-project-path', result.filePath);
              // Also send event to Header to update currentFilePath state
              window.dispatchEvent(new CustomEvent('project-file-path-changed', { detail: result.filePath }));
            }
          } catch (err) {
            console.error("Failed to load pending file:", err);
            alert("Could not open this project file. It may be corrupted or encrypted with a different key.");
          }
        }
      });

      return () => {
        ipcRenderer.removeListener('open-project-encrypted', handleOpenEncryptedProject);
      };
    }
  }, [dispatch, state.photos.length, state.cardPhotos.length]);

  // Global drag & drop handler for project files and background images
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault(); // Necessary to allow dropping
    };

    const handleGlobalDrop = async (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const fileLower = file.name.toLowerCase();
      
      // Check if drop is happening inside a modal/dialog - if so, ignore it
      const targetElement = e.target as HTMLElement;
      const isInsideModal = targetElement.closest('[role="dialog"]') || 
                           targetElement.closest('.modal') || 
                           targetElement.closest('[data-dialog]') ||
                           targetElement.closest('[data-radix-popper-content-wrapper]');
      
      if (isInsideModal) {
        // Let the modal handle its own drops
        return;
      }

      // 1. If it is a project file, ALWAYS intercept globally and load it!
      if (fileLower.endsWith('.pppro') || fileLower.endsWith('.ppfree') || fileLower.endsWith('.cyr')) {
        e.preventDefault();
        e.stopPropagation();

        const filePath = (file as any).path; // Electron file path
        if (filePath && window && (window as any).process && (window as any).process.type === 'renderer') {
          setDroppedProjectFile(filePath);
        } else {
          // Web version or fallback: read with FileReader and show confirmation
          const reader = new FileReader();
          reader.onload = async (event) => {
            const content = event.target?.result as string;
            setPendingProjectData({ content });
          };
          reader.readAsText(file);
        }
        return;
      }

      // 2. If it is an image file:
      // If it is dropped on a slot or dropzone, we let the element handle it.
      // If it is dropped on the background, margins, or any other element, we add it globally!
      const isDroppedOnSlot = targetElement.closest('[data-drop-target="slot"]') || targetElement.closest('[data-drop-target="dropzone"]');

      if (!isDroppedOnSlot) {
        const imageFiles: File[] = [];
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)) {
            imageFiles.push(f);
          }
        }

        if (imageFiles.length > 0) {
          e.preventDefault();
          e.stopPropagation();

          try {
            const { readFileAsDataURL, generateId } = await import('./utils/helpers');
            const newPhotos: Photo[] = [];

            for (const f of imageFiles) {
              try {
                const src = await readFileAsDataURL(f);
                newPhotos.push({
                  id: generateId(),
                  name: f.name,
                  src,
                  rotation: 0,
                  annotations: []
                });
              } catch (err) {
                console.error("Failed to load dropped image", err);
              }
            }

            if (newPhotos.length > 0) {
              dispatch({ type: 'ADD_PHOTOS', payload: newPhotos });
            }
          } catch (err) {
            console.error("Failed to load helpers module", err);
          }
        }
      }
    };

    // Use capture phase (true) to intercept the event before child elements (like PhotoSlot) call stopPropagation()
    window.addEventListener('dragover', handleGlobalDragOver, true);
    window.addEventListener('drop', handleGlobalDrop, true);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver, true);
      window.removeEventListener('drop', handleGlobalDrop, true);
    };
  }, [dispatch]);

  const PAGE_WIDTH_PX = 794;

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(scrollContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const maxPossibleZoom = useMemo(() => {
    if (state.mode === 'stamp') return 6.0; // Allow huge zoom for tiny physical stamps
    if (containerWidth <= 0) return 1.0;
    const availableWidth = containerWidth - 48;
    const limit = availableWidth / PAGE_WIDTH_PX;
    return Math.min(3.0, Math.max(1.0, Math.floor(limit * 10) / 10)); // Guarantee at least 1.0
  }, [containerWidth, state.mode]);

  useEffect(() => {
    if (state.zoom > maxPossibleZoom && maxPossibleZoom > 0.2 && state.mode !== 'stamp') {
      dispatch({ type: 'SET_ZOOM', payload: maxPossibleZoom });
    }
  }, [maxPossibleZoom, state.zoom, dispatch, state.mode]);

  // Keyboard shortcut: Ctrl+P for Print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setShowPrintModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const generatedPages: {
    pageIndex: number;
    photos: (Photo | null)[];
    layout: LayoutType;
    startIndex: number;
    capacity: number;
    overlayNumbers?: number[];
  }[] = [];

  const activePhotos = state.mode === 'businesscard'
    ? state.cardPhotos
    : state.mode === 'invoice'
      ? state.invoicePhotos
      : state.mode === 'idphoto'
        ? state.idPhotos
        : state.photos;

  let totalInvoicePages = 0;

  if (state.mode === 'invoice') {
    const invoiceLayout = state.settings.invoiceLayout || '2-landscape';
    const numberingMode = state.settings.invoiceNumberingMode || 'sequential-split';
    const startNum = state.settings.invoiceStartNumber || 1;
    const endNum = state.settings.invoiceEndNumber ?? 100;
    const totalInvoices = Math.max(0, endNum - startNum + 1);

    // Get templates based on layout
    const templates = state.invoicePhotos;

    if (invoiceLayout === '1-portrait') {
      // 1 invoice per page (portrait)
      totalInvoicePages = totalInvoices;
      const template = templates[0] || null;

      for (let i = 0; i < totalInvoicePages; i++) {
        const invoiceNum = startNum + i;
        generatedPages.push({
          pageIndex: i,
          photos: [template],
          layout: 'invoice-1',
          startIndex: 0,
          capacity: 1,
          overlayNumbers: [invoiceNum]
        });
      }
    } else if (invoiceLayout === '2-landscape') {
      // 2 invoices per page (landscape)
      const templateLeft = templates[0] || null;
      const templateRight = templates[1] || null;

      if (numberingMode === 'all-same') {
        // Both columns: same numbers on both sides
        totalInvoicePages = totalInvoices;
        for (let i = 0; i < totalInvoicePages; i++) {
          const invoiceNum = startNum + i;
          generatedPages.push({
            pageIndex: i,
            photos: [templateLeft, templateRight],
            layout: 'invoice',
            startIndex: 0,
            capacity: 2,
            overlayNumbers: [invoiceNum, invoiceNum]
          });
        }
      } else {
        // Sequential split: Left column gets first half, Right column gets second half
        // Example: total=100, start=25 → Left: 25-74, Right: 75-124
        const halfCount = Math.ceil(totalInvoices / 2);
        totalInvoicePages = halfCount;

        for (let i = 0; i < totalInvoicePages; i++) {
          const leftNum = startNum + i;
          const rightNum = startNum + halfCount + i;
          generatedPages.push({
            pageIndex: i,
            photos: [templateLeft, templateRight],
            layout: 'invoice',
            startIndex: 0,
            capacity: 2,
            overlayNumbers: [leftNum, rightNum]
          });
        }
      }
    } else if (invoiceLayout === '4-portrait') {
      // 4 invoices per page (portrait, A6 sections)
      const template = templates[0] || null;

      if (numberingMode === 'all-same') {
        // All 4 sections: same numbers in all quadrants
        totalInvoicePages = totalInvoices;
        for (let i = 0; i < totalInvoicePages; i++) {
          const invoiceNum = startNum + i;
          generatedPages.push({
            pageIndex: i,
            photos: [template, template, template, template],
            layout: 'invoice-4',
            startIndex: 0,
            capacity: 4,
            overlayNumbers: [invoiceNum, invoiceNum, invoiceNum, invoiceNum]
          });
        }
      } else {
        // Sequential split: Q1: first quarter, Q2: second quarter, Q3: third quarter, Q4: fourth quarter
        // Example: total=100, start=25 → Q1: 25-49, Q2: 50-74, Q3: 75-99, Q4: 100-124
        const quarterCount = Math.ceil(totalInvoices / 4);
        totalInvoicePages = quarterCount;

        for (let i = 0; i < totalInvoicePages; i++) {
          const q1Num = startNum + i;
          const q2Num = startNum + quarterCount + i;
          const q3Num = startNum + (quarterCount * 2) + i;
          const q4Num = startNum + (quarterCount * 3) + i;
          generatedPages.push({
            pageIndex: i,
            photos: [template, template, template, template],
            layout: 'invoice-4',
            startIndex: 0,
            capacity: 4,
            overlayNumbers: [q1Num, q2Num, q3Num, q4Num]
          });
        }
      }
    }
  } else if (state.mode === 'idphoto') {
    const idPhotoLayout = state.settings.idPhotoLayout || '4';
    let currentSectionIndex = 0;
    let pageIndex = 0;

    // Determine capacity based on layout
    // Each A6 section has 12 photo slots
    let numA6Sections = 4; // default: 4 A6 sections per A4 page
    let layoutType: LayoutType = 'idphoto-4';

    if (idPhotoLayout === '1') {
      numA6Sections = 1;
      layoutType = 'idphoto-1';
    } else if (idPhotoLayout === '2') {
      numA6Sections = 2;
      layoutType = 'idphoto-2';
    } else {
      numA6Sections = 4;
      layoutType = 'idphoto-4';
    }

    // Total photo slots per page = number of A6 sections * 12 slots per section
    const capacity = numA6Sections * 12;

    while (currentSectionIndex < activePhotos.length || pageIndex < state.manualPageCount) {
      const endSlice = currentSectionIndex + capacity;
      let pagePhotos = activePhotos.slice(currentSectionIndex, endSlice);
      while (pagePhotos.length < capacity) pagePhotos.push(null);

      generatedPages.push({
        pageIndex,
        photos: pagePhotos,
        layout: layoutType,
        startIndex: currentSectionIndex,
        capacity: capacity
      });

      currentSectionIndex += capacity;
      pageIndex++;
      if (pageIndex > 1000) break;
    }
  } else {
    let currentPhotoIndex = 0;
    let pageIndex = 0;

    while (currentPhotoIndex < activePhotos.length || pageIndex < state.manualPageCount) {
      let layoutId: LayoutType = state.pageLayouts[pageIndex] || state.globalLayout;
      if (state.mode === 'businesscard') {
        const pageLayout = state.pageLayouts[pageIndex];
        if (pageLayout === 'businesscard' || pageLayout === 'businesscard-form' || pageLayout === 'businesscard-form-reverse') {
          layoutId = pageLayout;
        } else {
          if (state.globalLayout === 'businesscard-form') layoutId = 'businesscard-form';
          else if (state.globalLayout === 'businesscard-form-reverse') layoutId = 'businesscard-form-reverse';
          else layoutId = 'businesscard';
        }
      }

      const layoutDef = LAYOUTS.find(l => l.id === layoutId) || LAYOUTS[0];
      const capacity = getLayoutCapacity(layoutId, state.settings);

      let pagePhotos: (Photo | null)[] = [];
      if (layoutId === 'onlytext') {
        pagePhotos = [];
      } else {
        const endSlice = currentPhotoIndex + capacity;
        pagePhotos = activePhotos.slice(currentPhotoIndex, endSlice);
        while (pagePhotos.length < capacity) pagePhotos.push(null);
      }

      generatedPages.push({
        pageIndex,
        photos: pagePhotos,
        layout: layoutId,
        startIndex: currentPhotoIndex,
        capacity: capacity
      });

      if (layoutId !== 'onlytext') {
        currentPhotoIndex += capacity;
      }
      pageIndex++;

      if (pageIndex > 1000) break;
    }
  }

  const sectionSize = state.settings.sectionSize || 10;
  const startIndex = state.currentSectionIndex * sectionSize;
  const visiblePages = isPrinting
    ? (pagesToPrint ? generatedPages.filter(p => pagesToPrint.includes(p.pageIndex)) : generatedPages)
    : generatedPages.slice(startIndex, startIndex + sectionSize);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const nextZoom = Math.round((state.zoom + delta) * 10) / 10;
        const cappedZoom = Math.min(maxPossibleZoom, Math.max(0.2, nextZoom));
        dispatch({ type: 'SET_ZOOM', payload: cappedZoom });
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [state.zoom, state.mode, maxPossibleZoom, dispatch]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPagesToPrint(null);
      setIsPrinting(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  const handleAddPage = (insertAtIndex: number, insertAtPageIndex: number) => {
    let capacity = 1;
    if (state.mode === 'businesscard') {
      capacity = (state.globalLayout === 'businesscard-form' || state.globalLayout === 'businesscard-form-reverse') ? 6 : 10;
    }
    else if (state.mode === 'invoice') capacity = 2;
    else if (state.mode === 'idphoto') {
      const idPhotoLayout = state.settings.idPhotoLayout || '4';
      capacity = idPhotoLayout === '1' ? 1 : idPhotoLayout === '2' ? 2 : 4;
    }
    else {
      capacity = getLayoutCapacity(state.globalLayout, state.settings);
    }
    dispatch({ type: 'INSERT_PAGE', payload: { insertIndex: insertAtIndex, count: capacity === 0 ? 1 : capacity, insertAtPageIndex } });
    dispatch({ type: 'SELECT_PAGE', payload: insertAtPageIndex });
    setNewlyAddedPageIndex(insertAtPageIndex);
    showToast(getTranslation('toast.pageAdded', state.language), 'success');
  };

  const handleDeletePageRequest = (pIndex: number, startIdx: number, count: number) => {
    setDeleteConfirmation({ pageIndex: pIndex, startIndex: startIdx, count });
  };

  const handleResetPageRequest = (pIndex: number, startIdx: number, count: number) => {
    setResetConfirmation({ pageIndex: pIndex, startIndex: startIdx, count });
  };

  const confirmDeletePage = () => {
    if (deleteConfirmation) {
      dispatch({
        type: 'DELETE_PAGE',
        payload: {
          pageIndex: deleteConfirmation.pageIndex,
          startIndex: deleteConfirmation.startIndex,
          count: deleteConfirmation.count
        }
      });
      showToast(getTranslation('toast.pageDeleted', state.language), 'success');
      setDeleteConfirmation(null);
    }
  };

  const confirmResetPage = () => {
    if (resetConfirmation) {
      dispatch({
        type: 'RESET_PAGE',
        payload: {
          pageIndex: resetConfirmation.pageIndex,
          startIndex: resetConfirmation.startIndex,
          count: resetConfirmation.count
        }
      });
      setResetConfirmation(null);
    }
  };

  const handleChangePageLayout = (pIndex: number, newLayout: LayoutType) => {
    dispatch({ type: 'SET_PAGE_LAYOUT', payload: { pageIndex: pIndex, layout: newLayout } });
  };

  const handlePrintConfirm = (selectedPages: number[]) => {
    setPagesToPrint(selectedPages);
    setIsPrinting(true);
  };

  const isInvoice = state.mode === 'invoice';
  const invoiceLayout = state.settings.invoiceLayout || '2-landscape';
  const isLandscapeInvoice = isInvoice && invoiceLayout === '2-landscape';
  const baseWidthStr = isLandscapeInvoice ? '297mm' : '210mm';

  // Use state.zoom for all modes including invoice
  const effectiveZoom = state.zoom;

  const modalTotalPages = state.mode === 'invoice' ? totalInvoicePages : generatedPages.length;

  return (
    <div className={cn(
      "flex flex-col h-screen overflow-hidden bg-background",
      state.language === 'ku' ? 'font-kufi' : 'font-sans'
    )}>
      {state.mode === 'invoice' && (
        <style dangerouslySetInnerHTML={{ __html: `@media print { @page { size: A4 ${state.settings.invoiceLayout === '2-landscape' ? 'landscape' : 'portrait'}; margin: 0; } }` }} />
      )}

      <Header onPrintClick={() => setShowPrintModal(true)} />
      <TextFormattingToolbar />
      {<FloatingZoomControls maxPossibleZoom={maxPossibleZoom} />}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main
          ref={scrollContainerRef}
          className="flex-1 overflow-x-hidden overflow-y-auto pt-2 md:pt-4 px-4 md:px-8 pb-4 md:pb-8 custom-scrollbar scroll-smooth paper-canvas flex flex-col items-center print:p-0 print:m-0 print:block"
        >
          {activePhotos.length === 0 && state.globalLayout !== 'onlytext' && generatedPages.length === 0 && (
            <div className="text-center text-muted-foreground mt-4 animate-fade-in no-print">
              <p className="text-sm font-medium">{t('list.empty')}</p>
            </div>
          )}

          <div
            className="relative flex flex-col items-center overflow-visible print-scale-container"
            style={{
              width: isPrinting ? 'auto' : `calc(${baseWidthStr} * ${effectiveZoom})`,
              maxWidth: isPrinting ? 'none' : '100%',
            }}
          >
            <div
              ref={contentRef}
              className="flex flex-col items-center origin-top transition-transform duration-200 ease-out print-scale-container"
              style={{
                transform: isPrinting ? 'none' : `scale(${effectiveZoom})`,
                width: isPrinting ? 'auto' : baseWidthStr,
              }}
            >
              {visiblePages.length > 0 && !isPrinting && startIndex === 0 && (
                <AddPageButton onClick={() => handleAddPage(0, 0)} isTop={true} />
              )}

              {visiblePages.map((page) => {
                const isLandscape = page.layout === 'invoice';
                const isInvoice1 = page.layout === 'invoice-1';
                const isInvoice4 = page.layout === 'invoice-4';
                const isInvoicePage = isLandscape || isInvoice1 || isInvoice4;
                const isIdPhotoPage = page.layout === 'idphoto' || page.layout === 'idphoto-1' || page.layout === 'idphoto-2' || page.layout === 'idphoto-4';
                return (
                  <React.Fragment key={page.pageIndex}>
                    <div className={cn(
                      isLandscape ? 'a4-page-landscape' : 'a4-page',
                      isIdPhotoPage ? 'idphoto-page' : '',
                      `relative mx-auto page-container-${page.pageIndex} ring-1 ring-black/5 print:ring-0`,
                      isInvoicePage && !isPrinting ? 'mb-8' : 'mb-0',
                      'print:mb-0',
                      newlyAddedPageIndex === page.pageIndex && 'animate-pulse-highlight'
                    )}>
                      <PhotoPage
                        pageIndex={page.pageIndex}
                        startIndex={page.startIndex}
                        photos={page.photos}
                        layout={page.layout}
                        itemsPerPage={page.capacity}
                        onEditPhoto={setEditingPhoto}
                        onDelete={() => handleDeletePageRequest(page.pageIndex, page.startIndex, page.capacity)}
                        onReset={() => handleResetPageRequest(page.pageIndex, page.startIndex, page.capacity)}
                        onChangeLayout={(l) => handleChangePageLayout(page.pageIndex, l)}
                        overlayNumbers={page.overlayNumbers}
                      />
                    </div>
                    {!isPrinting && (
                      <AddPageButton onClick={() => handleAddPage(page.startIndex + page.capacity, page.pageIndex + 1)} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      {editingPhoto && (
        <ImageEditor
          photo={editingPhoto}
          onClose={() => { setEditingPhoto(null); }}
        />
      )}

      {showPrintModal && (
        <PrintModal
          totalPages={modalTotalPages}
          onClose={() => setShowPrintModal(false)}
          onConfirm={handlePrintConfirm}
        />
      )}

      {deleteConfirmation && (
        <ConfirmModal
          isOpen={true}
          title={state.language === 'ku' ? 'سڕینەوەی پەڕە' : 'Delete Page'}
          message={getTranslation('confirm.deletePage', state.language)}
          confirmLabel={state.language === 'ku' ? 'سڕینەوە' : 'Delete'}
          cancelLabel={state.language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
          onConfirm={confirmDeletePage}
          onClose={() => setDeleteConfirmation(null)}
          isDestructive={true}
        />
      )}

      {resetConfirmation && (
        <ConfirmModal
          isOpen={true}
          title={state.language === 'ku' ? 'ڕیسێتکردنی پەڕە' : 'Reset Page'}
          message={state.language === 'ku' ? 'دڵنیایت دەتەوێت هەموو شتێک لەم پەڕەیەدا وەک خۆی لێ بکەیتەوە؟' : 'Are you sure you want to reset everything on this page to default?'}
          confirmLabel={state.language === 'ku' ? 'ڕیسێت' : 'Reset'}
          cancelLabel={state.language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
          onConfirm={confirmResetPage}
          onClose={() => setResetConfirmation(null)}
          isDestructive={true}
        />
      )}
      
      {droppedProjectFile && (
        <ConfirmModal
          isOpen={true}
          title={state.language === 'ku' ? 'کردنەوەی پرۆژە' : 'Load Project'}
          message={state.language === 'ku' ? 'ئایا دەتەوێت ئەم پرۆژەیە بکەیتەوە؟ گۆڕانکارییەکانی ئێستات لەدەست دەچێت.' : 'Do you want to load this project? Your current unsaved changes will be lost.'}
          confirmLabel={state.language === 'ku' ? 'کردنەوە' : 'Load Project'}
          cancelLabel={state.language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
          onConfirm={async () => {
            try {
              const fs = (window as any).require('fs');
              const content = fs.readFileSync(droppedProjectFile, 'utf-8');
              const decryptedJson = await decryptProjectData(content);
              const parsed = JSON.parse(decryptedJson);
              dispatch({ type: 'LOAD_PROJECT', payload: parsed });
              
              // Set the file path so the title shows the project name
              console.log('[Drag&Drop] Setting file path:', droppedProjectFile);
              if (window && (window as any).process && (window as any).process.type === 'renderer') {
                const { ipcRenderer } = (window as any).require('electron');
                await ipcRenderer.invoke('set-current-project-path', droppedProjectFile);
                console.log('[Drag&Drop] File path set in main process');
                // Also send event to Header to update currentFilePath state
                window.dispatchEvent(new CustomEvent('project-file-path-changed', { detail: droppedProjectFile }));
                console.log('[Drag&Drop] Custom event dispatched:', droppedProjectFile);
              }
              
              // Show success toast
              showToast(t('toast.projectOpened'), 'success');
              
              setDroppedProjectFile(null);
            } catch (err) {
              console.error('Failed to load dropped project:', err);
              showToast(t('toast.openFailed'), 'error');
              setDroppedProjectFile(null);
            }
          }}
          onClose={() => setDroppedProjectFile(null)}
          isDestructive={false}
        />
      )}
      
      {pendingProjectData && (
        <ConfirmModal
          isOpen={true}
          title={state.language === 'ku' ? 'کردنەوەی پرۆژە' : 'Load Project'}
          message={state.language === 'ku' ? 'ئایا دەتەوێت ئەم پرۆژەیە بکەیتەوە؟ گۆڕانکارییەکانی سەیڤ نەکراو لەدەست دەچێت.' : 'Do you want to load this project? Your current unsaved changes will be lost.'}
          confirmLabel={state.language === 'ku' ? 'کردنەوە' : 'Load Project'}
          cancelLabel={state.language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
          onConfirm={async () => {
            try {
              const decryptedJson = await decryptProjectData(pendingProjectData.content);
              const parsed = JSON.parse(decryptedJson);
              dispatch({ type: 'LOAD_PROJECT', payload: parsed });
              
              // Set the file path so the title shows the project name
              if (pendingProjectData.filePath && window && (window as any).process && (window as any).process.type === 'renderer') {
                const { ipcRenderer } = (window as any).require('electron');
                ipcRenderer.invoke('set-current-project-path', pendingProjectData.filePath);
                // Also send event to Header to update currentFilePath state
                window.dispatchEvent(new CustomEvent('project-file-path-changed', { detail: pendingProjectData.filePath }));
              }
              
              // Show success toast
              showToast(t('toast.projectOpened'), 'success');
              
              setPendingProjectData(null);
            } catch (err) {
              console.error("Failed to load project:", err);
              showToast(t('toast.openFailed'), 'error');
              setPendingProjectData(null);
            }
          }}
          onClose={() => setPendingProjectData(null)}
          isDestructive={false}
        />
      )}

      {showSetupWizard && (
        <SetupWizardModal onClose={() => setShowSetupWizard(false)} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [updateNotification, setUpdateNotification] = useState<{ message: string; latestVersion: string } | null>(null);

  // Handle dismissing update notification - opens update dialog
  const dismissUpdateNotification = async () => {
    try {
      if (updateNotification) {
        // Dispatch custom event to open update modal
        window.dispatchEvent(new CustomEvent('open-update-modal'));
      }
      setUpdateNotification(null);
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
      setUpdateNotification(null);
    }
  };

  // Listen for update notifications from main process
  useEffect(() => {
    if (window && (window as any).process && (window as any).process.type === 'renderer') {
      const { ipcRenderer } = (window as any).require('electron');

      ipcRenderer.on('server-update-notification', (event: any, data: { title: string; message: string; version: string; forceUpdate: boolean }) => {
        if (data && data.message) {
          setUpdateNotification({ message: data.message, latestVersion: data.version || 'unknown' });
        }
      });

      return () => {
        ipcRenderer.removeAllListeners('server-update-notification');
      };
    }
  }, []);

  return (
    <AppProvider>
      <SearchProvider>
        <ToastProvider>
          <MainContent />

          {/* Update Notification Toast - persistent until dismissed */}
          {updateNotification && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down" dir="rtl">
              <div className="bg-amber-500 text-black px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 min-w-[350px] font-kufi">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{updateNotification.message}</p>
                  <p className="text-xs opacity-80 mt-1">کۆتا وەشان: {updateNotification.latestVersion}</p>
                </div>
                <button
                  onClick={dismissUpdateNotification}
                  className="bg-black/20 hover:bg-black/30 text-black px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                >
                  باشە
                </button>
              </div>
            </div>
          )}
        </ToastProvider>
      </SearchProvider>
    </AppProvider>
  );
};

export default App;
