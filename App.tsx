
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { SearchProvider } from './store/SearchContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import PhotoPage from './components/PhotoGrid/PhotoPage';
import ResumeCanvas from './components/Resume/ResumeCanvas';
import ResumeEditor from './components/Resume/ResumeEditor';
import TemplateSelector from './components/Resume/TemplateSelector';
import BusinessCardCanvas from './components/BusinessCard/BusinessCardCanvas';
import BusinessCardEditor from './components/BusinessCard/BusinessCardEditor';
import type { BusinessCardSection } from './components/BusinessCard/BusinessCardEditor';

import ImageEditor from './components/Editor/ImageEditor';
import TextFormattingToolbar from './components/Editor/TextFormattingToolbar';
import PrintModal from './components/Modals/PrintModal';
import ConfirmModal from './components/Modals/ConfirmModal';
import { Photo, LayoutType, AppState } from './types';
import { LAYOUTS } from './constants';
import { getTranslation } from './utils/translations';
import { Plus, ZoomIn, ZoomOut, Maximize, RefreshCw, Phone, Monitor, Clock, AlertTriangle, X, Check } from 'lucide-react';
import { decryptProjectData } from './utils/encryption';
import {
  dismissNotificationOffline,
  initOfflineSync,
  isNotificationDismissed,
  setNotificationCallback
} from './utils/offlineSync';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/card';
import { cn } from './lib/utils';
import { ToastProvider } from './components/ui/toast';
import { QRCodeSVG } from 'qrcode.react';

// Activation Overlay Component
const ActivationOverlay: React.FC<{
  trialStatus: { isValid: boolean; daysLeft: number; hoursLeft: number; minutesLeft: number; secondsLeft: number; expired: boolean; tampered: boolean; message: string } | null;
  onTrialStart: (daysLeft: number, hoursLeft: number, minutesLeft: number, secondsLeft: number) => void;
  onActivationSuccess: () => void;
}> = ({ trialStatus: initialTrialStatus, onTrialStart, onActivationSuccess }) => {
  const [machineId, setMachineId] = useState<string>('Loading...');
  const [computerName, setComputerName] = useState<string>('');
  const [startingTrial, setStartingTrial] = useState(false);
  const [checking, setChecking] = useState(false);
  const [localTrialStatus, setLocalTrialStatus] = useState(initialTrialStatus);

  useEffect(() => {
    const init = async () => {
      try {
        if (window && (window as any).process && (window as any).process.type === 'renderer') {
          const { ipcRenderer } = (window as any).require('electron');
          const id = await ipcRenderer.invoke('get-machine-id');
          if (id) setMachineId(id);
          else setMachineId('N/A');

          // Get computer name
          try {
            const os = (window as any).require('os');
            const hostname = os.hostname();
            setComputerName(hostname);
          } catch (err) {
            console.error('Failed to get computer name:', err);
            setComputerName('Unknown');
          }

          // Always fetch trial status directly if not provided
          if (!initialTrialStatus) {
            const trial = await ipcRenderer.invoke('check-trial');
            setLocalTrialStatus(trial);
          }
        } else {
          setMachineId('N/A');
          setComputerName('Browser');
        }
      } catch (err) {
        console.error('Failed to init overlay:', err);
        setMachineId('ERROR');
        setComputerName('Error');
      }
    };
    init();
  }, [initialTrialStatus]);

  // Use local or passed-in trial status
  const trialStatus = localTrialStatus || initialTrialStatus;

  const handleCheckActivation = async () => {
    setChecking(true);
    try {
      if (window && (window as any).process && (window as any).process.type === 'renderer') {
        const { ipcRenderer } = (window as any).require('electron');
        const result = await ipcRenderer.invoke('check-license');
        
        if (result.activated) {
          // License is now activated, notify parent without reload
          onActivationSuccess();
        } else {
          // Still not activated, just refresh the status
          if (result.trial) {
            setLocalTrialStatus(result.trial);
          }
        }
      }
    } catch (err) {
      console.error('Failed to check activation:', err);
    } finally {
      setChecking(false);
    }
  };

  // Can show trial button: trial exists and is not expired and not tampered
  const canTrial = trialStatus && !trialStatus.expired && !trialStatus.tampered;
  // Trial expired
  const trialExpired = trialStatus && trialStatus.expired && !trialStatus.tampered;
  // Trial tampered
  const trialTampered = trialStatus && trialStatus.tampered;

  // Create QR code data as JSON object
  const qrData = JSON.stringify({
    computerName: computerName,
    machineId: machineId
  }, null, 2);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in font-kufi" dir="rtl">
      <div className="fixed inset-0 bg-black/50" />

      <Card className="relative w-full max-w-md animate-slide-up">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-muted">
              <Monitor size={20} className="text-foreground" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">چالاککردنی بەرنامە</CardTitle>
              <CardDescription className="mt-1">بۆ چالاککردن پەیوەندی بکە</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <div className="p-3 bg-muted rounded-md">
            <label className="text-[10px] font-medium text-muted-foreground uppercase mb-1.5 block">
              Machine ID
            </label>
            <div className="font-mono text-sm text-foreground break-all select-all bg-background rounded-md p-2 text-center border border-border" dir="ltr">
              {machineId}
            </div>
            
            {/* QR Code for Machine ID + Computer Name (Computer Name only in QR, not displayed) */}
            {machineId && machineId !== 'Loading...' && machineId !== 'N/A' && machineId !== 'ERROR' && (
              <div className="mt-3 flex justify-center">
                <div className="p-3 bg-white rounded-lg border border-border shadow-sm">
                  <QRCodeSVG 
                    value={qrData} 
                    size={140}
                    level="M"
                    includeMargin={false}
                  />
                  <p className="text-center text-[9px] text-muted-foreground mt-2 font-sans">
                    سکان بکە بۆ وەرگرتنی زانیاری
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 rounded-md border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
                <Phone size={14} className="text-background" />
              </div>
              <span className="text-xs font-medium">پەیوەندی بکە</span>
            </div>
            <a href="tel:07711742031" className="block text-xl font-bold text-foreground text-center py-2 bg-muted rounded-md hover:bg-accent transition-colors" dir="ltr">
              07711742031
            </a>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2 pt-0">
          {/* Trial Button - show when trial is available (not expired and not tampered) */}
          {canTrial && (
            <Button
              onClick={async () => {
                setStartingTrial(true);
                try {
                  if (window && (window as any).process && (window as any).process.type === 'renderer') {
                    const { ipcRenderer } = (window as any).require('electron');
                    const trial = await ipcRenderer.invoke('start-trial');
                    if (trial && trial.isValid) {
                      onTrialStart(trial.daysLeft, trial.hoursLeft || 0, trial.minutesLeft || 0, trial.secondsLeft || 0);
                    }
                  }
                } catch (err) {
                  console.error('Failed to start trial:', err);
                } finally {
                  setStartingTrial(false);
                }
              }}
              disabled={startingTrial}
              variant="outline"
              className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
            >
              <Clock size={16} />
              {startingTrial ? 'چاوەڕوان بە...' : trialStatus?.isValid
                ? `دەستپێکردن (${trialStatus.hoursLeft || 0} کاتژمێر ${trialStatus.minutesLeft || 0} خولەک ${trialStatus.secondsLeft || 0} چرکە)`
                : `تاقیکردنەوە بۆ ${trialStatus?.hoursLeft || 10} کاتژمێر`}
            </Button>
          )}

          {/* Trial Expired Message */}
          {trialExpired && (
            <div className="w-full p-2.5 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-center">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                <Clock size={12} className="inline ml-1" />
                ماوەی تاقیکردنەوە تەواو بوو
              </p>
            </div>
          )}

          {/* Trial Tampered Message */}
          {trialTampered && (
            <div className="w-full p-2.5 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-center">
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                <AlertTriangle size={12} className="inline ml-1" />
                ناتوانرێت ماوەی تاقیکردنەوە ڕیسێت بکرێتەوە
              </p>
            </div>
          )}

          <Button onClick={handleCheckActivation} disabled={checking} className="w-full">
            <Check size={16} />
            {checking ? 'پشکنین...' : 'پشکنین'}
          </Button>
          <p className="text-center text-muted-foreground text-[10px]">
            ناسنامەی ئامێرەکەت بنێرە
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

const AddPageButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div className="relative group py-6 flex items-center justify-center no-print w-full">
    <div className="absolute inset-x-0 h-px bg-border opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <button
      onClick={onClick}
      className="relative z-10 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm transform scale-90 group-hover:scale-100"
      title="Add New Page"
    >
      <Plus size={16} />
    </button>
  </div>
);

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

const MainContent: React.FC<{ isActivated: boolean }> = ({ isActivated }) => {
  const { state, dispatch } = useApp();
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [resumePhotoEditing, setResumePhotoEditing] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [pagesToPrint, setPagesToPrint] = useState<number[] | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeResumeSection, setActiveResumeSection] = useState<'personal' | 'photo' | 'experience' | 'education' | 'skills' | 'languages' | 'template' | 'customize'>('personal');
  const [activeBusinessCardSection, setActiveBusinessCardSection] = useState<BusinessCardSection>('info');
  const t = (key: string) => getTranslation(key, state.language);

  const handleEditResumePhoto = () => {
    if (!state.resumeData.photo) return;
    const tempPhoto: Photo = {
      id: 'resume-photo',
      src: state.resumeData.photo,
      name: 'Resume Photo',
      rotation: 0,
      annotations: []
    };
    setResumePhotoEditing(true);
    setEditingPhoto(tempPhoto);
  };

  const handleSaveResumePhoto = (dataUrl: string) => {
    dispatch({ type: 'UPDATE_RESUME_DATA', payload: { photo: dataUrl } });
    setResumePhotoEditing(false);
  };

  // Block all actions if not activated
  const requireActivation = (action: () => void) => {
    if (!isActivated) {
      return;
    }
    action();
  };

  // Custom Modal for deletion
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    pageIndex: number;
    startIndex: number;
    count: number;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window && (window as any).process && (window as any).process.type === 'renderer') {
      const { ipcRenderer } = (window as any).require('electron');

      const handleOpenEncryptedProject = async (event: any, data: string | { content: string, filePath: string }) => {
        try {
          // Handle both old format (string) and new format (object)
          const encryptedContent = typeof data === 'string' ? data : data.content;
          const decryptedJson = await decryptProjectData(encryptedContent);
          const parsed = JSON.parse(decryptedJson);
          dispatch({ type: 'LOAD_PROJECT', payload: parsed });
        } catch (err) {
          console.error("IPC Opening Failed:", err);
          alert("Could not open this project file. It may be corrupted or encrypted with a different key.");
        }
      };

      ipcRenderer.on('open-project-encrypted', handleOpenEncryptedProject);
      return () => {
        ipcRenderer.removeListener('open-project-encrypted', handleOpenEncryptedProject);
      };
    }
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
    if (containerWidth <= 0) return 1.0;
    const availableWidth = containerWidth - 48;
    const limit = availableWidth / PAGE_WIDTH_PX;
    return Math.min(3.0, Math.floor(limit * 10) / 10);
  }, [containerWidth]);

  useEffect(() => {
    if (state.zoom > maxPossibleZoom && maxPossibleZoom > 0.2) {
      dispatch({ type: 'SET_ZOOM', payload: maxPossibleZoom });
    }
  }, [maxPossibleZoom, state.zoom, dispatch]);

  // Keyboard shortcut: Ctrl+P for Print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (isActivated) {
          setShowPrintModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActivated]);

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
        if (state.globalLayout === 'businesscard-form') layoutId = 'businesscard-form';
        else if (state.globalLayout === 'businesscard-form-reverse') layoutId = 'businesscard-form-reverse';
        else layoutId = 'businesscard';
      }

      const layoutDef = LAYOUTS.find(l => l.id === layoutId) || LAYOUTS[0];
      const capacity = layoutDef.capacity;

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
  const visiblePages = isPrinting ? generatedPages : generatedPages.slice(startIndex, startIndex + sectionSize);

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
      const defaultLayout = LAYOUTS.find(l => l.id === state.globalLayout);
      capacity = defaultLayout ? defaultLayout.capacity : 1;
    }
    dispatch({ type: 'INSERT_PAGE', payload: { insertIndex: insertAtIndex, count: capacity === 0 ? 1 : capacity, insertAtPageIndex } });
  };

  const handleDeletePageRequest = (pIndex: number, startIdx: number, count: number) => {
    setDeleteConfirmation({ pageIndex: pIndex, startIndex: startIdx, count });
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
      setDeleteConfirmation(null);
    }
  };

  const handleChangePageLayout = (pIndex: number, newLayout: LayoutType) => {
    // In business card mode, change global layout instead of page layout
    if (state.mode === 'businesscard') {
      dispatch({ type: 'SET_LAYOUT', payload: newLayout });
    } else {
      dispatch({ type: 'SET_PAGE_LAYOUT', payload: { pageIndex: pIndex, layout: newLayout } });
    }
  };

  const handlePrintConfirm = (selectedPages: number[]) => {
    setPagesToPrint(selectedPages);
    setIsPrinting(true);
  };

  const pagesToHide = pagesToPrint
    ? generatedPages.filter(p => !pagesToPrint.includes(p.pageIndex))
    : [];
  const hidePagesCss = pagesToHide.length > 0
    ? `@media print { ${pagesToHide.map(p => `.page-container-${p.pageIndex}`).join(', ')} { display: none !important; } }`
    : '';

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
      {pagesToPrint && hidePagesCss && (
        <style dangerouslySetInnerHTML={{ __html: hidePagesCss }} />
      )}
      {state.mode === 'invoice' && (
        <style dangerouslySetInnerHTML={{ __html: `@media print { @page { size: A4 ${state.settings.invoiceLayout === '2-landscape' ? 'landscape' : 'portrait'}; margin: 0; } }` }} />
      )}

      <Header onPrintClick={() => requireActivation(() => setShowPrintModal(true))} isActivated={isActivated} />
      <TextFormattingToolbar />
      <FloatingZoomControls maxPossibleZoom={maxPossibleZoom} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isActivated={isActivated} 
          activeResumeSection={activeResumeSection}
          onResumeSectionChange={setActiveResumeSection}
          activeBusinessCardSection={activeBusinessCardSection}
          onBusinessCardSectionChange={setActiveBusinessCardSection}
        />

        {/* Business Card Design Mode - Special Layout */}
        {state.mode === 'businesscard' && state.businessCardDesignMode ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Business Card Editor - Left Side */}
            <div className="w-96 border-r border-border overflow-y-auto bg-background no-print">
              <BusinessCardEditor activeSection={activeBusinessCardSection} />
            </div>
            
            {/* Business Card Canvas - Right Side */}
            <main 
              ref={scrollContainerRef}
              className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth paper-canvas flex flex-col items-center print:p-0 print:m-0 print:block"
            >
              <BusinessCardCanvas />
            </main>
          </div>
        ) : state.mode === 'resume' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Resume Editor - Left Side */}
            <div className="w-96 border-r border-border overflow-y-auto bg-background no-print">
              <ResumeEditor activeSection={activeResumeSection} onEditPhoto={handleEditResumePhoto} />
            </div>
            
            {/* Resume Canvas - Right Side (same paper grid background as other tabs) */}
            <main 
              ref={scrollContainerRef}
              className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth paper-canvas flex flex-col items-center print:p-0 print:m-0 print:block"
            >
              <div
                className="relative flex flex-col items-center overflow-visible print-scale-container"
                style={{
                  width: isPrinting ? 'auto' : `calc(210mm * ${effectiveZoom})`,
                  maxWidth: isPrinting ? 'none' : '100%',
                }}
              >
                <div
                  className="flex flex-col items-center origin-top transition-transform duration-200 ease-out print-scale-container"
                  style={{
                    transform: isPrinting ? 'none' : `scale(${effectiveZoom})`,
                    width: isPrinting ? 'auto' : '210mm',
                  }}
                >
                  <ResumeCanvas />
                </div>
              </div>
            </main>
          </div>
        ) : (
          <main
            ref={scrollContainerRef}
            className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth paper-canvas flex flex-col items-center print:p-0 print:m-0 print:block"
          >
          {(state.mode !== 'invoice' && state.mode !== 'idphoto') && activePhotos.length === 0 && state.globalLayout !== 'onlytext' && generatedPages.length === 0 && (
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
              {visiblePages.length > 0 && state.mode !== 'invoice' && state.mode !== 'idphoto' && !isPrinting && startIndex === 0 && (
                <AddPageButton onClick={() => handleAddPage(0, 0)} />
              )}

              {visiblePages.map((page) => {
                const isLandscape = page.layout === 'invoice';
                const isInvoice1 = page.layout === 'invoice-1';
                const isInvoice4 = page.layout === 'invoice-4';
                const isInvoicePage = isLandscape || isInvoice1 || isInvoice4;
                const isIdPhotoPage = page.layout === 'idphoto' || page.layout === 'idphoto-1' || page.layout === 'idphoto-2' || page.layout === 'idphoto-4';
                return (
                  <React.Fragment key={page.pageIndex}>
                    <div className={`${isLandscape ? 'a4-page-landscape' : 'a4-page'} ${isIdPhotoPage ? 'idphoto-page' : ''} relative mx-auto page-container-${page.pageIndex} ring-1 ring-black/5 print:ring-0 ${isInvoicePage && !isPrinting ? 'mb-8' : 'mb-0'} print:mb-0`}>
                      <PhotoPage
                        pageIndex={page.pageIndex}
                        startIndex={page.startIndex}
                        photos={page.photos}
                        layout={page.layout}
                        itemsPerPage={page.capacity}
                        onEditPhoto={setEditingPhoto}
                        onDelete={() => handleDeletePageRequest(page.pageIndex, page.startIndex, page.capacity)}
                        onChangeLayout={(l) => handleChangePageLayout(page.pageIndex, l)}
                        overlayNumbers={page.overlayNumbers}
                      />
                    </div>
                    {state.mode !== 'invoice' && state.mode !== 'idphoto' && !isPrinting && (
                      <AddPageButton onClick={() => handleAddPage(page.startIndex + page.capacity, page.pageIndex + 1)} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </main>
        )}
      </div>

      {editingPhoto && (
        <ImageEditor
          photo={editingPhoto}
          onClose={() => { setEditingPhoto(null); setResumePhotoEditing(false); }}
          onSave={resumePhotoEditing ? handleSaveResumePhoto : undefined}
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
    </div>
  );
};

const App: React.FC = () => {
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [machineId, setMachineId] = useState<string>('');
  const [trialStatus, setTrialStatus] = useState<{ isValid: boolean; daysLeft: number; hoursLeft: number; minutesLeft: number; secondsLeft: number; expired: boolean; tampered: boolean; message: string } | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [trialHoursLeft, setTrialHoursLeft] = useState<number>(0);
  const [trialMinutesLeft, setTrialMinutesLeft] = useState<number>(0);
  const [trialSecondsLeft, setTrialSecondsLeft] = useState<number>(0);
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const [updateNotification, setUpdateNotification] = useState<{ message: string; latestVersion: string } | null>(null);

  // Live countdown timer — update trial time every second
  useEffect(() => {
    if (!isActivated || trialDaysLeft === null) return;
    const interval = setInterval(async () => {
      try {
        if (window && (window as any).process && (window as any).process.type === 'renderer') {
          const { ipcRenderer } = (window as any).require('electron');
          const trial = await ipcRenderer.invoke('check-trial');
          if (trial) {
            setTrialDaysLeft(trial.daysLeft);
            setTrialHoursLeft(trial.hoursLeft || 0);
            setTrialMinutesLeft(trial.minutesLeft || 0);
            setTrialSecondsLeft(trial.secondsLeft || 0);
            if (!trial.isValid) {
              setIsActivated(false);
              setTrialStatus(trial);
            }
          }
        }
      } catch (err) {
        // ignore
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isActivated, trialDaysLeft]);

  // Handle dismissing update notification - opens update dialog
  const dismissUpdateNotification = async () => {
    try {
      if (updateNotification) {
        // Store locally that this version was dismissed
        await dismissNotificationOffline(updateNotification.latestVersion, machineId);

        // Dispatch custom event to open update modal
        window.dispatchEvent(new CustomEvent('open-update-modal'));
      }
      setUpdateNotification(null);
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
      setUpdateNotification(null);
    }
  };

  // Set up callback for when notification should be shown (from offline sync)
  useEffect(() => {
    setNotificationCallback((data) => {
      if (!isNotificationDismissed(data.latestVersion)) {
        setUpdateNotification(data);
      }
    });

    return () => {
      setNotificationCallback(null);
    };
  }, []);

  // Track user activity for smart heartbeat
  useEffect(() => {
    if (window && (window as any).process && (window as any).process.type === 'renderer') {
      const { ipcRenderer } = (window as any).require('electron');

      // Throttle activity events to avoid too many IPC calls
      let lastActivitySent = 0;
      const THROTTLE_MS = 5000; // Send at most once per 5 seconds

      const sendActivity = () => {
        const now = Date.now();
        if (now - lastActivitySent > THROTTLE_MS) {
          lastActivitySent = now;
          ipcRenderer.send('user-activity');
        }
      };

      // Listen for user activity
      const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        window.addEventListener(event, sendActivity, { passive: true });
      });

      return () => {
        events.forEach(event => {
          window.removeEventListener(event, sendActivity);
        });
      };
    }
  }, []);

  useEffect(() => {
    const checkLicense = async () => {
      try {
        // Check if running in Electron
        if (window && (window as any).process && (window as any).process.type === 'renderer') {
          const { ipcRenderer } = (window as any).require('electron');
          const result = await ipcRenderer.invoke('check-license');

          setMachineId(result.machineId || '');

          // If no license, always show activation dialog (with trial button)
          // Trial status is passed so the dialog can show the right button/message
          if (!result.activated && result.trial) {
            setTrialStatus(result.trial);
            setIsActivated(false);
          } else {
            setIsActivated(result.activated);
          }

          // Listen for real-time license status changes
          ipcRenderer.on('license-status-changed', (event: any, data: { activated: boolean; machineId: string }) => {
            console.log('License status changed:', data);
            setIsActivated(data.activated);
            setMachineId(data.machineId || '');
          });

          // Listen for license ACTIVATED remotely (from heartbeat)
          ipcRenderer.on('license-activated', () => {
            console.log('License activated remotely!');
            setIsActivated(true);
          });

          // Listen for license REVOKED remotely (from heartbeat)
          ipcRenderer.on('license-revoked', () => {
            console.log('License revoked remotely!');
            setIsActivated(false);
          });

          // Listen for update notification from server (via heartbeat API)
          ipcRenderer.on('server-update-notification', (event: any, data: { title: string; message: string; version: string; forceUpdate: boolean }) => {
            console.log('Server update notification received:', data);
            if (data && data.message) {
              // If notification exists in Firebase, always show it (Firebase is source of truth)
              // Local dismiss only prevents showing until next Firebase update
              console.log('Showing notification toast from server');
              setUpdateNotification({ message: data.message, latestVersion: data.version || 'unknown' });
            }
          });

          // Listen for update notification from admin (real-time from Firestore)
          ipcRenderer.on('update-notification', async (event: any, data: { message: string; latestVersion: string }) => {
            console.log('Update notification received from Firestore:', data);
            // Check if this notification was already dismissed locally
            if (!isNotificationDismissed(data.latestVersion)) {
              setUpdateNotification(data);
            } else {
              console.log('Notification already dismissed locally, skipping');
            }
          });

          // Initialize offline sync system (will check Firestore when online)
          const cleanupOfflineSync = initOfflineSync(result.machineId);

          // Cleanup listener on unmount
          return () => {
            ipcRenderer.removeAllListeners('license-status-changed');
            ipcRenderer.removeAllListeners('license-activated');
            ipcRenderer.removeAllListeners('license-revoked');
            ipcRenderer.removeAllListeners('update-notification');
            ipcRenderer.removeAllListeners('server-update-notification');
            cleanupOfflineSync();
          };
        } else {
          // Web fallback - check localStorage
          const storedLicense = localStorage.getItem('app-license');
          if (storedLicense) {
            const license = JSON.parse(storedLicense);
            setMachineId(license.machineId || '');
            setIsActivated(license.valid === true);
          } else {
            setIsActivated(false);
          }
        }
      } catch (err) {
        console.error('License check failed:', err);
        setIsActivated(false);
      }
    };

    checkLicense();
  }, []);

  // Show loading while checking license
  if (isActivated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-muted-foreground text-sm font-kufi">چاوەڕوان بە...</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <SearchProvider>
        <ToastProvider>
          <MainContent isActivated={isActivated} />
          {/* Activation Overlay - blocks all interaction if not activated */}
          {!isActivated && <ActivationOverlay 
            trialStatus={trialStatus} 
            onTrialStart={(days, hours, minutes, seconds) => { 
              setTrialDaysLeft(days); 
              setTrialHoursLeft(hours); 
              setTrialMinutesLeft(minutes); 
              setTrialSecondsLeft(seconds); 
              setShowTrialBanner(true); 
              setIsActivated(true); 
            }}
            onActivationSuccess={() => {
              setIsActivated(true);
            }}
          />}

          {/* Trial Days Remaining Banner */}
          {isActivated && trialDaysLeft !== null && showTrialBanner && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] animate-fade-in" dir="rtl">
              <div className="bg-amber-500 text-black px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-3 font-kufi">
                <Clock size={16} />
                <span className="text-sm font-medium">
                  {trialHoursLeft} کاتژمێر {trialMinutesLeft} خولەک {trialSecondsLeft} چرکە ماوە
                </span>
                <button
                  onClick={() => setShowTrialBanner(false)}
                  className="bg-black/20 hover:bg-black/30 rounded-full p-1 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

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
