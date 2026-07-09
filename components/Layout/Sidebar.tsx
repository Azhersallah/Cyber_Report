import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useApp, getCardSizeKey } from '../../store/AppContext';
import {
    Layout, Grid, FileText, Check, X, ArrowLeftRight, Hash,
    Move, ArrowUp, Scaling, ChevronLeft, ChevronRight,
    Layers, User, Briefcase, GraduationCap, Award, Camera, Languages, Trash2, Palette,
    Phone, Image, PenTool, Building2, Download, Smartphone, Plus, CreditCard,
    Stamp, Sparkles, Sliders, Type, Upload, Star, Loader2, ChevronDown
} from 'lucide-react';
import { getStampPresets } from '../../utils/stampPresets';
import { LAYOUTS, getLayoutCapacity } from '../../constants';
import { getTranslation } from '../../utils/translations';
import { LayoutPreview } from './LayoutPreview';
import { readFileAsDataURL, generateId } from '../../utils/helpers';
import { WirelessTransferModal } from '../Modals/WirelessTransferModal';
import { Photo, LayoutType } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/toast';
import ExportFormatDialog from '../Modals/ExportFormatDialog';
import { FontPicker } from '../ui/font-picker';
import ImageEditor from '../Editor/ImageEditor';

export type BusinessCardSection = 'info' | 'contact' | 'media' | 'template' | 'customize';
export type ResumeSection = 'personal' | 'photo' | 'experience' | 'education' | 'skills' | 'languages' | 'template' | 'customize';

interface SidebarProps {
    isActivated?: boolean;
    activeResumeSection?: ResumeSection;
    onResumeSectionChange?: (section: ResumeSection) => void;
    activeBusinessCardSection?: BusinessCardSection;
    onBusinessCardSectionChange?: (section: BusinessCardSection) => void;
}

interface SectionProps {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon: Icon, children }) => (
    <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase px-1">
            <Icon size={12} className="text-muted-foreground/60" />
            {title}
        </div>
        <div className="space-y-3">{children}</div>
    </div>
);

const htmlToText = (html: string) => {
    if (!html) return "";
    return html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/div>/gi, '').replace(/<div>/gi, '\n').replace(/<\/p>/gi, '').replace(/<p>/gi, '\n').replace(/&nbsp;/g, ' ').trim();
};

const textToHtml = (text: string) => text.replace(/\n/g, '<br>');

const ProjectTitleEditor = ({ initialValue, onSave }: { initialValue: string, onSave: (val: string) => void }) => {
    const [value, setValue] = useState(htmlToText(initialValue));
    const [hasChanges, setHasChanges] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { state } = useApp();
    const t = (key: string) => getTranslation(key, state.language);

    useEffect(() => { if (!hasChanges) setValue(htmlToText(initialValue)); }, [initialValue, hasChanges]);
    useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; } }, [value]);

    return (
        <div className="p-4 border-b border-border">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase mb-2">
                <FileText size={12} className="text-muted-foreground/60" /> {t('input.projectTitle')}
            </label>
            <div className="space-y-2">
                <textarea 
                  ref={textareaRef} 
                  value={value} 
                  onChange={(e) => { setValue(e.target.value); setHasChanges(e.target.value !== htmlToText(initialValue)); }} 
                  rows={2} 
                  className="w-full text-sm font-semibold bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 rounded-lg p-2.5 outline-none text-foreground transition-all resize-none overflow-hidden" 
                  placeholder={t('placeholder.projectTitle')} 
                  dir="auto" 
                />
                {hasChanges && (
                    <div className="flex gap-2">
                        <Button onClick={() => { onSave(textToHtml(value)); setHasChanges(false); }} size="sm" className="flex-1 h-8 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"><Check size={14} className="mr-1" /> {t('action.apply')}</Button>
                        <Button onClick={() => { setValue(htmlToText(initialValue)); setHasChanges(false); }} variant="outline" size="sm" className="flex-1 h-8 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800"><X size={14} className="mr-1" /> {t('action.cancel')}</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ isActivated = true, activeResumeSection = 'personal', onResumeSectionChange, activeBusinessCardSection = 'info', onBusinessCardSectionChange }) => {
    const { state, dispatch } = useApp();
    const { showToast } = useToast();
    const t = (key: string) => getTranslation(key, state.language);
    const frontInputRef = useRef<HTMLInputElement>(null);
    const backInputRef = useRef<HTMLInputElement>(null);
    const idInputRef = useRef<HTMLInputElement>(null);
    const invoiceSingleRef = useRef<HTMLInputElement>(null);
    const photosInputRef = useRef<HTMLInputElement>(null);
    const [appVersion, setAppVersion] = useState<string>('');
    const [showClearResumeConfirm, setShowClearResumeConfirm] = useState(false);
    const [showResumeExportDialog, setShowResumeExportDialog] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);

    // Stamp Mode Local States
    const stampCanvasRef = useRef<HTMLCanvasElement>(null);
    const stampFileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessingStampImg, setIsProcessingStampImg] = useState(false);
    const [rawStampImg, setRawStampImg] = useState<string | null>(null);
    const [newText, setNewText] = useState('');
    const [newTextType, setNewTextType] = useState<'curve-up' | 'straight' | 'curve-down'>('straight');
    const [editingLogoPhoto, setEditingLogoPhoto] = useState<Photo | null>(null);
    const [shapeDropdownOpen, setShapeDropdownOpen] = useState(false);
    const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
    const shapeDropdownRef = useRef<HTMLDivElement>(null);
    const templateDropdownRef = useRef<HTMLDivElement>(null);

    // Re-read saved designs from localStorage whenever template dropdown opens
    const openTemplateDropdown = () => {
        setTemplateDropdownOpen(p => !p);
        setShapeDropdownOpen(false);
    };

    const STAMP_COLORS = [
      { name: 'Dark Blue', value: '#1e3a8a' },
      { name: 'Red', value: '#dc2626' },
      { name: 'Green', value: '#16a34a' },
      { name: 'Black', value: '#000000' },
      { name: 'Purple', value: '#6b21a8' },
      { name: 'Navy', value: '#0f172a' },
    ];

    const STAMP_FONTS = [
      'Inter',
      'Arial',
      'Courier New',
      'Georgia',
      'Times New Roman',
      'Impact',
      'Comic Sans MS'
    ];

    const extractStampSignature = (imgSource: string, thresholdValue: number) => {
        const img = new window.Image();
        img.src = imgSource;
        img.onload = () => {
            const canvas = stampCanvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const scale = Math.min(1, 400 / Math.max(img.width, img.height));
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;

                if (gray > thresholdValue) {
                    data[i + 3] = 0;
                } else {
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                    if (data[i + 3] > 0) {
                        data[i + 3] = 255;
                    }
                }
            }

            ctx.putImageData(imgData, 0, 0);
            const transparentPNG = canvas.toDataURL('image/png');
            dispatch({ type: 'UPDATE_STAMP_DATA', payload: { centerImage: transparentPNG } });
            setIsProcessingStampImg(false);
        };
    };

    const handleStampImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingStampImg(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const src = event.target?.result as string;
            setRawStampImg(src);
            extractStampSignature(src, state.stampData.signatureThreshold);
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (rawStampImg) {
            extractStampSignature(rawStampImg, state.stampData.signatureThreshold);
        }
    }, [state.stampData.signatureThreshold]);

    useEffect(() => {
        if (state.mode !== 'stamp') return;
        const currentLayers = state.stampData.layers || [];
        const legacyLogo = state.stampData.centerImage;
        const legacyOuter = state.stampData.outerText;
        const legacyInner = state.stampData.innerText;
        const legacyCenter = state.stampData.centerText;
        const legacyExtra = state.stampData.extraCenterText;
        
        const hasLogoLayer = currentLayers.some(l => l.type === 'logo');
        const outerLayer = currentLayers.find(l => l.id === 'outerText' || (l.type === 'text' && l.textType === 'curve-up'));
        const innerLayer = currentLayers.find(l => l.id === 'innerText' || (l.type === 'text' && l.textType === 'curve-down'));
        const centerLayer = currentLayers.find(l => l.id === 'centerText');
        const extraLayer = currentLayers.find(l => l.id === 'extraCenterText');
        
        let needsSync = false;
        if (!!legacyLogo !== hasLogoLayer) needsSync = true;
        if ((legacyOuter || '') !== (outerLayer?.text || '')) needsSync = true;
        if ((legacyInner || '') !== (innerLayer?.text || '')) needsSync = true;
        if ((legacyCenter || '') !== (centerLayer?.text || '')) needsSync = true;
        if ((legacyExtra || '') !== (extraLayer?.text || '')) needsSync = true;
        
        if (needsSync) {
            const newLayers = [];
            if (legacyLogo) {
                newLayers.push({
                    id: 'logo',
                    type: 'logo' as const,
                    offsetX: state.stampData.centerImageOffsetX || 0,
                    offsetY: state.stampData.centerImageOffsetY || 0,
                });
            }
            if (legacyOuter) {
                newLayers.push({
                    id: 'outerText',
                    type: 'text' as const,
                    textType: 'curve-up' as const,
                    text: legacyOuter,
                    fontFamily: state.stampData.outerFontFamily || state.stampData.fontFamily || 'Inter',
                    fontSize: state.stampData.outerFontSize || 38,
                    radiusOffset: state.stampData.outerRadiusOffset || -20,
                    offsetX: state.stampData.outerTextOffsetX || 0,
                    offsetY: state.stampData.outerTextOffsetY || 0,
                });
            }
            if (legacyInner) {
                newLayers.push({
                    id: 'innerText',
                    type: 'text' as const,
                    textType: 'curve-down' as const,
                    text: legacyInner,
                    fontFamily: state.stampData.innerFontFamily || state.stampData.fontFamily || 'Inter',
                    fontSize: state.stampData.innerFontSize || 38,
                    radiusOffset: state.stampData.innerRadiusOffset || -50,
                    offsetX: state.stampData.innerTextOffsetX || 0,
                    offsetY: state.stampData.innerTextOffsetY || 0,
                });
            }
            if (legacyCenter) {
                newLayers.push({
                    id: 'centerText',
                    type: 'text' as const,
                    textType: 'straight' as const,
                    text: legacyCenter,
                    fontFamily: state.stampData.centerFontFamily || state.stampData.fontFamily || 'Inter',
                    fontSize: state.stampData.centerFontSize || 42,
                    radiusOffset: 0,
                    offsetX: state.stampData.centerTextOffsetX || 0,
                    offsetY: state.stampData.centerTextOffsetY || 0,
                });
            }
            if (legacyExtra) {
                newLayers.push({
                    id: 'extraCenterText',
                    type: 'text' as const,
                    textType: 'straight' as const,
                    text: legacyExtra,
                    fontFamily: state.stampData.extraCenterFontFamily || state.stampData.fontFamily || 'Inter',
                    fontSize: state.stampData.extraCenterFontSize || 24,
                    radiusOffset: 0,
                    offsetX: state.stampData.extraCenterTextOffsetX || 0,
                    offsetY: state.stampData.extraCenterTextOffsetY || 0,
                });
            }
            dispatch({
                type: 'UPDATE_STAMP_DATA',
                payload: { layers: newLayers }
            });
        }
    }, [
        state.mode,
        state.stampData.centerImage,
        state.stampData.outerText,
        state.stampData.innerText,
        state.stampData.centerText,
        state.stampData.extraCenterText,
    ]);


    // Get app version from package.json or electron
    useEffect(() => {
        const getVersion = async () => {
            try {
                if (window && (window as any).process?.type === 'renderer') {
                    const { ipcRenderer } = (window as any).require('electron');
                    const version = await ipcRenderer.invoke('get-app-version');
                    setAppVersion(version);
                } else {
                    // Fallback for web
                    setAppVersion('1.5.1');
                }
            } catch (err) {
                setAppVersion('1.5.1');
            }
        };
        getVersion();
    }, []);

    // Click-outside: close stamp dropdowns
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (shapeDropdownRef.current && !shapeDropdownRef.current.contains(e.target as Node)) {
                setShapeDropdownOpen(false);
            }
            if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target as Node)) {
                setTemplateDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Defensive defaults for new settings
    const invoiceLayout = state.settings.invoiceLayout || '2-landscape';
    const invoiceNumberingMode = state.settings.invoiceNumberingMode || 'sequential-split';

    const handleFill = async (e: React.ChangeEvent<HTMLInputElement>, side: 'right' | 'left') => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const src = await readFileAsDataURL(file);
            dispatch({ type: 'FILL_CARDS', payload: { side, photo: { id: generateId(), name: file.name, src, rotation: 0, annotations: [] } } });
        } catch (err) { console.error("Failed to load image", err); }
        e.target.value = '';
    };

    const handleInvoiceSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const src = await readFileAsDataURL(file);
            const photo = { id: generateId(), name: file.name, src, rotation: 0, annotations: [] };
            // Fill all slots with the same photo
            const slotsNeeded = invoiceLayout === '4-portrait' ? 4 : invoiceLayout === '2-landscape' ? 2 : 1;
            for (let i = 0; i < slotsNeeded; i++) {
                dispatch({ type: 'SET_SLOT_PHOTO', payload: { index: i, photo: { ...photo, id: generateId() } } });
            }
        } catch (err) { console.error("Failed to load image", err); }
        e.target.value = '';
    };

    const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isActivated) {
            e.target.value = '';
            return;
        }

        const files = e.target.files;
        if (!files || files.length === 0) return;
        const newPhotos: Photo[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)) {
                try {
                    const src = await readFileAsDataURL(file);
                    newPhotos.push({ id: generateId(), name: file.name, src, rotation: 0, annotations: [] });
                } catch (err) { console.error("Failed to load image", err); }
            }
        }
        if (newPhotos.length > 0) {
            dispatch({ type: 'ADD_PHOTOS', payload: newPhotos });
        }
        e.target.value = '';
    };

    const handleLayoutClick = (id: string) => {
        const targetPageIndex = state.selectedPageIndex !== null ? state.selectedPageIndex : 0;
        const currentActiveLayout = state.pageLayouts[targetPageIndex] || state.globalLayout;
        
        let newLayout = id as any;
        if (id === '2') newLayout = currentActiveLayout === '2' ? '2col' : '2';
        else if (id === '1text') newLayout = currentActiveLayout === '1text' ? '1text-side' : '1text';
        else if (id === '2text1') newLayout = currentActiveLayout === '2text1' ? '2text1-side' : '2text1';

        // Update global layout (pages without page-specific overrides will inherit this)
        dispatch({ type: 'SET_LAYOUT', payload: newLayout });

        // If a specific page is selected, clear its page-specific override so it inherits this new layout
        if (state.selectedPageIndex !== null) {
            dispatch({ type: 'SET_PAGE_LAYOUT', payload: { pageIndex: state.selectedPageIndex, layout: undefined } });
        }
    };

    const getLayoutButtonData = (layout: typeof LAYOUTS[0]) => {
        const activeLayout = state.selectedPageIndex !== null ? (state.pageLayouts[state.selectedPageIndex] || state.globalLayout) : state.globalLayout;
        if (layout.id === '2') return { isActive: activeLayout === '2' || activeLayout === '2col', previewType: activeLayout === '2col' ? '2col' : '2', label: activeLayout === '2col' ? 'layout.2col' : 'layout.2', isToggle: true };
        if (layout.id === '1text') return { isActive: activeLayout === '1text' || activeLayout === '1text-side', previewType: activeLayout === '1text-side' ? '1text-side' : '1text', label: activeLayout === '1text-side' ? 'layout.1text-side' : 'layout.1text', isToggle: true };
        if (layout.id === '2text1') return { isActive: activeLayout === '2text1' || activeLayout === '2text1-side', previewType: activeLayout === '2text1-side' ? '2text1-side' : '2text1', label: activeLayout === '2text1-side' ? 'layout.2text1-side' : 'layout.2text1', isToggle: true };
        return { isActive: activeLayout === layout.id, previewType: layout.id, label: layout.label, isToggle: false };
    };

    const updateInvoiceSettings = (key: string, value: any) => dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
    const updateInvoiceStyle = (key: string, value: any) => dispatch({ type: 'UPDATE_SETTINGS', payload: { invoiceNumberStyle: { ...state.settings.invoiceNumberStyle, [key]: value } } });

    // Export handlers for Resume and Business Card
    const handleResumeExport = async (format: 'png' | 'jpeg' | 'pdf') => {
        try {
            const resumeEl = document.querySelector('[data-resume-canvas]') as HTMLElement;
            if (!resumeEl) return;
            
            if (format === 'pdf') {
                const { default: html2canvas } = await import('html2canvas');
                const jsPDF = (await import('jspdf')).default;
                
                // Capture with high quality settings
                const canvas = await html2canvas(resumeEl, { 
                    scale: 3,
                    useCORS: true, 
                    backgroundColor: '#ffffff',
                    logging: false,
                    allowTaint: false,
                    imageTimeout: 0,
                    removeContainer: true,
                    // These settings help preserve text positioning
                    onclone: (clonedDoc) => {
                        const clonedEl = clonedDoc.querySelector('[data-resume-canvas]') as HTMLElement;
                        if (clonedEl) {
                            // Apply transform to shift content up significantly
                            clonedEl.style.transform = 'translateY(-16px)';
                            clonedEl.style.letterSpacing = 'normal';
                            
                            // Also adjust all text elements
                            const allElements = clonedEl.querySelectorAll('*');
                            allElements.forEach((el: any) => {
                                const style = window.getComputedStyle(el);
                                
                                // Reduce line-height more aggressively
                                if (style.lineHeight && style.lineHeight !== 'normal') {
                                    const lh = parseFloat(style.lineHeight);
                                    if (!isNaN(lh)) {
                                        el.style.lineHeight = `${lh * 0.85}px`;
                                    }
                                }
                                
                                // Also reduce padding and margin slightly
                                if (style.paddingTop) {
                                    const pt = parseFloat(style.paddingTop);
                                    if (!isNaN(pt) && pt > 0) {
                                        el.style.paddingTop = `${pt * 0.9}px`;
                                    }
                                }
                                if (style.paddingBottom) {
                                    const pb = parseFloat(style.paddingBottom);
                                    if (!isNaN(pb) && pb > 0) {
                                        el.style.paddingBottom = `${pb * 0.9}px`;
                                    }
                                }
                                if (style.marginTop) {
                                    const mt = parseFloat(style.marginTop);
                                    if (!isNaN(mt) && mt > 0) {
                                        el.style.marginTop = `${mt * 0.9}px`;
                                    }
                                }
                                if (style.marginBottom) {
                                    const mb = parseFloat(style.marginBottom);
                                    if (!isNaN(mb) && mb > 0) {
                                        el.style.marginBottom = `${mb * 0.9}px`;
                                    }
                                }
                            });
                        }
                    }
                });
                
                const imgData = canvas.toDataURL('image/png', 1.0);
                
                // A4 dimensions in mm
                const a4Width = 210;
                const a4Height = 297;
                
                // Create PDF with A4 size
                const pdf = new (jsPDF as any)({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                });
                
                // Calculate image dimensions to fit A4 while maintaining aspect ratio
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = imgWidth / imgHeight;
                
                let pdfWidth = a4Width;
                let pdfHeight = a4Width / ratio;
                
                // If height exceeds A4, scale down
                if (pdfHeight > a4Height) {
                    pdfHeight = a4Height;
                    pdfWidth = a4Height * ratio;
                }
                
                // Center the image on the page
                const xOffset = (a4Width - pdfWidth) / 2;
                const yOffset = (a4Height - pdfHeight) / 2;
                
                pdf.addImage(imgData, 'PNG', xOffset, yOffset, pdfWidth, pdfHeight, undefined, 'FAST');
                pdf.save('resume.pdf');
            } else {
                // For PNG/JPEG, use html2canvas
                const { default: html2canvas } = await import('html2canvas');
                const canvas = await html2canvas(resumeEl, { 
                    scale: 3, 
                    useCORS: true, 
                    backgroundColor: '#ffffff',
                    logging: false
                });
                
                const link = document.createElement('a');
                link.download = `resume.${format}`;
                link.href = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
                link.click();
            }
        } catch (err) {
            console.error('Resume export failed:', err);
        }
    };

    const handleBusinessCardExport = async () => {
        try {
            const frontEl = document.querySelector('[data-bc-front]') as HTMLElement;
            const backEl = document.querySelector('[data-bc-back]') as HTMLElement;
            if (!frontEl) return;
            
            const { default: html2canvas } = await import('html2canvas');
            const jsPDF = (await import('jspdf')).default;
            
            // Capture front card with exact same settings as "Use in Slots" function
            const frontCanvas = await html2canvas(frontEl, { 
                scale: 4, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                width: 360, 
                height: 200,
                logging: false,
                imageTimeout: 0,
                removeContainer: true
            });
            
            // Create PDF with exact business card dimensions (90mm x 50mm)
            const pdf = new (jsPDF as any)({
                orientation: 'landscape',
                unit: 'mm',
                format: [90, 50],
                compress: true
            });
            
            // Add front card - use PNG for better quality
            const frontImgData = frontCanvas.toDataURL('image/png', 1.0);
            pdf.addImage(frontImgData, 'PNG', 0, 0, 90, 50, undefined, 'FAST');
            
            // Add back card if exists
            if (backEl) {
                const backCanvas = await html2canvas(backEl, { 
                    scale: 4, 
                    useCORS: true, 
                    backgroundColor: '#ffffff',
                    width: 360, 
                    height: 200,
                    logging: false,
                    imageTimeout: 0,
                    removeContainer: true
                });
                const backImgData = backCanvas.toDataURL('image/png', 1.0);
                pdf.addPage([90, 50], 'landscape');
                pdf.addImage(backImgData, 'PNG', 0, 0, 90, 50, undefined, 'FAST');
            }
            
            pdf.save('business-card.pdf');
        } catch (err) {
            console.error('Business card export failed:', err);
        }
    };

    const totalPages = state.mode === 'invoice'
      ? Math.ceil(Math.max(0, ((state.settings.invoiceEndNumber ?? 100) - (state.settings.invoiceStartNumber ?? 1) + 1)) / 2)
      : state.manualPageCount;
    const sectionSize = state.settings.sectionSize || 10;
    const totalSections = Math.ceil(totalPages / sectionSize);
    const currentSection = state.currentSectionIndex;

    return (
        <aside className={cn(
            "bg-background border-r border-border flex-shrink-0 flex flex-col h-[calc(100vh-56px)] no-print select-none",
            state.mode === 'resume' ? 'w-56' : state.mode === 'stamp' ? 'w-[350px]' : 'w-80'
        )}>
            {/* Photos mode - Upload button at very top */}
            {state.mode === 'photos' && (
                <div className="pt-2 pb-3 px-4 border-b border-border space-y-2">
                    <input type="file" ref={photosInputRef} className="hidden" accept="image/*,.heic,.heif" multiple onChange={handlePhotosUpload} />
                    <button 
                      onClick={() => photosInputRef.current?.click()} 
                      className="w-full flex flex-col items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 text-zinc-650 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100 transition-all duration-300 group shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                    >
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                          <Upload size={14} className="text-zinc-500 dark:text-zinc-300 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-xs font-bold tracking-wide">{t('upload.image')}</span>
                    </button>
                    
                    <button 
                      onClick={() => setShowTransferModal(true)} 
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900/60 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-100 shadow-sm transition-all duration-200"
                    >
                        <Smartphone size={13} className="text-zinc-500 dark:text-zinc-300 shrink-0" /> 
                        <span>{t('transfer.startShort')}</span>
                    </button>
                </div>
            )}

            {state.mode === 'photos' && <ProjectTitleEditor initialValue={state.globalTitle} onSave={(val) => dispatch({ type: 'SET_GLOBAL_TITLE', payload: val })} />}

            {/* Business Card Mode Toggle - Photo Slots vs Design */}
            {state.mode === 'businesscard' && (
                <div className="p-3 border-b border-border">
                    <div className="flex rounded-lg border border-border overflow-hidden">
                        <button
                            onClick={() => dispatch({ type: 'SET_BUSINESS_CARD_DESIGN_MODE', payload: false })}
                            className={cn(
                                "flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
                                !state.businessCardDesignMode ? "bg-primary text-primary-foreground" : "hover:bg-accent/10"
                            )}
                        >
                            <Grid size={12} />
                            {state.language === 'ku' ? 'وێنە' : state.language === 'ar' ? 'الفتحات' : 'Slots'}
                        </button>
                        <button
                            onClick={() => dispatch({ type: 'SET_BUSINESS_CARD_DESIGN_MODE', payload: true })}
                            className={cn(
                                "flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
                                state.businessCardDesignMode ? "bg-primary text-primary-foreground" : "hover:bg-accent/10"
                            )}
                        >
                            <PenTool size={12} />
                            {state.language === 'ku' ? 'دیزاین' : state.language === 'ar' ? 'التصميم' : 'Design'}
                        </button>
                    </div>
                </div>
            )}

            {/* ID Photo mode - Layout options */}
            {state.mode === 'idphoto' && (
                <div className="p-4 border-b border-border space-y-4">
                    {/* Hidden input for potential future use */}
                    <input type="file" ref={idInputRef} className="hidden" accept="image/*,.heic,.heif" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const src = await readFileAsDataURL(file); dispatch({ type: 'ADD_PHOTOS', payload: [{ id: generateId(), name: file.name, src, rotation: 0, annotations: [] }] }); } catch (err) { } if (idInputRef.current) idInputRef.current.value = ''; }} />

                    {/* Upload and wireless buttons */}
                    <div className="space-y-2">
                        <Button onClick={() => idInputRef.current?.click()} className="w-full">
                            <Upload size={16} /> {t('upload.image')}
                        </Button>
                        <Button onClick={() => setShowTransferModal(true)} variant="outline" className="w-full" size="sm">
                            <Smartphone size={14} /> {t('transfer.startShort')}
                        </Button>
                    </div>

                    {/* ID Photo Type Selection */}
                    <Section title={state.language === 'ku' ? 'جۆری وێنە' : state.language === 'ar' ? 'نوع الصورة' : 'Photo Type'} icon={CreditCard}>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { idPhotoType: 'standard' } })}
                                className={`relative p-2.5 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all ${(state.settings.idPhotoType ?? 'standard') === 'standard' ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}
                            >
                                {/* Mini preview: 3×4 grid */}
                                <div className="grid grid-cols-3 gap-0.5 pointer-events-none">
                                    {Array(12).fill(null).map((_, i) => (
                                        <div key={i} className="w-2 h-[11px] bg-foreground/30 rounded-[1px]" />
                                    ))}
                                </div>
                                <span className={`text-[9px] font-medium text-center ${(state.settings.idPhotoType ?? 'standard') === 'standard' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {state.language === 'ku' ? 'نۆرمال فۆتۆ' : state.language === 'ar' ? 'صورة عادية' : 'Normal Photo'}
                                </span>
                                {(state.settings.idPhotoType ?? 'standard') === 'standard' && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center"><Check size={8} className="text-background" /></div>}
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { idPhotoType: 'passport' } })}
                                className={`relative p-2.5 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all ${state.settings.idPhotoType === 'passport' ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}
                            >
                                {/* Mini preview: 2×3 grid */}
                                <div className="grid grid-cols-2 gap-0.5 pointer-events-none">
                                    {Array(6).fill(null).map((_, i) => (
                                        <div key={i} className="w-3 h-[15px] bg-foreground/30 rounded-[1px]" />
                                    ))}
                                </div>
                                <span className={`text-[9px] font-medium text-center ${state.settings.idPhotoType === 'passport' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {state.language === 'ku' ? 'پاسپۆرت فۆتۆ' : state.language === 'ar' ? 'صورة جواز' : 'Passport Photo'}
                                </span>
                                {state.settings.idPhotoType === 'passport' && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center"><Check size={8} className="text-background" /></div>}
                            </button>
                        </div>
                    </Section>

                    {/* ID Photo Layout Selection */}
                    <Section title={t('idphoto.pageLayout')} icon={Grid}>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { idPhotoLayout: '1' } })}
                                className={`relative p-2 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all ${state.settings.idPhotoLayout === '1' ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}
                            >
                                <div className="w-7 h-9 rounded-sm bg-background border border-border p-0.5 grid grid-cols-1 gap-0.5 pointer-events-none">
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                </div>
                                <span className={`text-[9px] font-medium text-center ${state.settings.idPhotoLayout === '1' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    1 A6
                                </span>
                                {state.settings.idPhotoLayout === '1' && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center"><Check size={8} className="text-background" /></div>}
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { idPhotoLayout: '2' } })}
                                className={`relative p-2 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all ${state.settings.idPhotoLayout === '2' ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}
                            >
                                <div className="w-9 h-7 rounded-sm bg-background border border-border p-0.5 grid grid-cols-2 gap-0.5 pointer-events-none">
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                </div>
                                <span className={`text-[9px] font-medium text-center ${state.settings.idPhotoLayout === '2' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    2 A6
                                </span>
                                {state.settings.idPhotoLayout === '2' && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center"><Check size={8} className="text-background" /></div>}
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { idPhotoLayout: '4' } })}
                                className={`relative p-2 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all ${state.settings.idPhotoLayout === '4' ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}
                            >
                                <div className="w-7 h-9 rounded-sm bg-background border border-border p-0.5 grid grid-cols-2 grid-rows-2 gap-0.5 pointer-events-none">
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                </div>
                                <span className={`text-[9px] font-medium text-center ${state.settings.idPhotoLayout === '4' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    4 A6
                                </span>
                                {state.settings.idPhotoLayout === '4' && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center"><Check size={8} className="text-background" /></div>}
                            </button>
                        </div>
                    </Section>

                    {/* A6 Position Selection - Only show when 1 A6 layout is selected */}
                    {state.settings.idPhotoLayout === '1' && (
                        <Section title={t('idphoto.position')} icon={Move}>
                            <div className="grid grid-cols-3 gap-2">
                                {([
                                    { id: 'center', label: t('idphoto.center') },
                                    { id: 'top-left', label: t('idphoto.topLeft') },
                                    { id: 'top-right', label: t('idphoto.topRight') },
                                    { id: 'bottom-left', label: t('idphoto.bottomLeft') },
                                    { id: 'bottom-right', label: t('idphoto.bottomRight') }
                                ] as const).map((pos) => (
                                    <button
                                        key={pos.id}
                                        onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { idPhotoPosition: pos.id } })}
                                        className={`relative p-2 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all ${state.settings.idPhotoPosition === pos.id ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}
                                    >
                                        <div className="w-7 h-9 rounded-sm bg-background border border-border p-0.5 relative pointer-events-none">
                                            <div
                                                className="bg-foreground/40 rounded-[1px] absolute"
                                                style={{
                                                    width: '45%',
                                                    height: '45%',
                                                    top: pos.id === 'center' || pos.id.includes('top') ? '2px' : 'auto',
                                                    bottom: pos.id.includes('bottom') ? '2px' : 'auto',
                                                    left: pos.id === 'center' ? '50%' : pos.id.includes('left') ? '2px' : 'auto',
                                                    right: pos.id.includes('right') ? '2px' : 'auto',
                                                    transform: pos.id === 'center' ? 'translateX(-50%)' : 'none'
                                                }}
                                            ></div>
                                        </div>
                                        <span className={`text-[9px] font-medium text-center ${state.settings.idPhotoPosition === pos.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {pos.label}
                                        </span>
                                        {state.settings.idPhotoPosition === pos.id && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center"><Check size={8} className="text-background" /></div>}
                                    </button>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* 2 A6 Position Selection - Only show when 2 A6 layout is selected */}
                    {state.settings.idPhotoLayout === '2' && (
                        <Section title={t('idphoto.position')} icon={Move}>
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { id: 'top', label: t('idphoto.top') },
                                    { id: 'bottom', label: t('idphoto.bottom') },
                                    { id: 'left', label: t('idphoto.left') },
                                    { id: 'right', label: t('idphoto.right') }
                                ] as const).map((pos) => (
                                    <button
                                        key={pos.id}
                                        onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { idPhotoPosition2: pos.id } })}
                                        className={`relative p-2 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all ${state.settings.idPhotoPosition2 === pos.id ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}
                                    >
                                        <div className="w-7 h-9 rounded-sm bg-background border border-border p-0.5 relative pointer-events-none">
                                            {/* Top: two boxes side by side at top */}
                                            {pos.id === 'top' && (
                                                <div className="absolute top-0.5 left-0.5 right-0.5 flex flex-row gap-0.5">
                                                    <div className="bg-foreground/40 rounded-[1px] flex-1 h-3"></div>
                                                    <div className="bg-foreground/40 rounded-[1px] flex-1 h-3"></div>
                                                </div>
                                            )}
                                            {/* Bottom: two boxes side by side at bottom */}
                                            {pos.id === 'bottom' && (
                                                <div className="absolute bottom-0.5 left-0.5 right-0.5 flex flex-row gap-0.5">
                                                    <div className="bg-foreground/40 rounded-[1px] flex-1 h-3"></div>
                                                    <div className="bg-foreground/40 rounded-[1px] flex-1 h-3"></div>
                                                </div>
                                            )}
                                            {/* Left: two boxes stacked on left */}
                                            {pos.id === 'left' && (
                                                <div className="absolute top-0.5 bottom-0.5 left-0.5 flex flex-col gap-0.5 w-2.5">
                                                    <div className="bg-foreground/40 rounded-[1px] w-full flex-1"></div>
                                                    <div className="bg-foreground/40 rounded-[1px] w-full flex-1"></div>
                                                </div>
                                            )}
                                            {/* Right: two boxes stacked on right */}
                                            {pos.id === 'right' && (
                                                <div className="absolute top-0.5 bottom-0.5 right-0.5 flex flex-col gap-0.5 w-2.5">
                                                    <div className="bg-foreground/40 rounded-[1px] w-full flex-1"></div>
                                                    <div className="bg-foreground/40 rounded-[1px] w-full flex-1"></div>
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-[9px] font-medium text-center ${state.settings.idPhotoPosition2 === pos.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {pos.label}
                                        </span>
                                        {state.settings.idPhotoPosition2 === pos.id && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center"><Check size={8} className="text-background" /></div>}
                                    </button>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Slot Count per A6 Section */}
                    <Section title={t('idphoto.slotCount')} icon={Scaling}>
                        <div className="space-y-2">
                            {(() => {
                                const numSections = parseInt(state.settings.idPhotoLayout) || 4;
                                return Array(numSections).fill(null).map((_, sectionIdx) => {
                                    const slotCount = state.settings.idPhotoSlotCounts?.[sectionIdx] ?? 12;
                                    return (
                                        <div key={sectionIdx} className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground w-10">A6 #{sectionIdx + 1}</span>
                                            <input
                                                type="range"
                                                min={0}
                                                max={12}
                                                value={slotCount}
                                                onChange={(e) => {
                                                    const newCount = parseInt(e.target.value);
                                                    dispatch({
                                                        type: 'UPDATE_SETTINGS',
                                                        payload: {
                                                            idPhotoSlotCounts: {
                                                                ...state.settings.idPhotoSlotCounts,
                                                                [sectionIdx]: newCount
                                                            }
                                                        }
                                                    });
                                                }}
                                                className="flex-1 h-1.5 accent-foreground"
                                            />
                                            <span className="text-[10px] font-medium text-foreground w-6 text-center">{slotCount}</span>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </Section>
                </div>
            )}

            {state.mode === 'invoice' && (
                <div className="p-4 border-b border-border space-y-4">
                    {/* Upload Template Button - at top like other modes */}
                    <div className="space-y-2">
                        <input type="file" ref={invoiceSingleRef} className="hidden" accept="image/*,.heic,.heif" onChange={handleInvoiceSingleUpload} />
                        <Button onClick={() => invoiceSingleRef.current?.click()} className="w-full">
                            <Upload size={16} /> {t('upload.image')}
                        </Button>
                        <Button onClick={() => setShowTransferModal(true)} variant="outline" className="w-full" size="sm">
                            <Smartphone size={14} /> {t('transfer.startShort')}
                        </Button>
                        <p className="text-[9px] text-muted-foreground text-center">
                            {t('upload.hint')}
                        </p>
                    </div>

                    {/* Invoice Layout Selection */}
                    <Section title={t('invoice.pageLayout')} icon={Grid}>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => updateInvoiceSettings('invoiceLayout', '1-portrait')}
                                className={`relative p-2 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all ${invoiceLayout === '1-portrait' ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}
                            >
                                <div className="w-7 h-9 rounded-sm bg-background border border-border p-0.5 grid grid-cols-1 gap-0.5 pointer-events-none">
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                </div>
                                <span className={`text-[9px] font-medium text-center ${invoiceLayout === '1-portrait' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {t('invoice.1invoice')}
                                </span>
                                {invoiceLayout === '1-portrait' && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center"><Check size={8} className="text-background" /></div>}
                            </button>
                            <button
                                onClick={() => updateInvoiceSettings('invoiceLayout', '2-landscape')}
                                className={`relative p-2 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all ${invoiceLayout === '2-landscape' ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}
                            >
                                <div className="w-9 h-7 rounded-sm bg-background border border-border p-0.5 grid grid-cols-2 gap-0.5 pointer-events-none">
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                </div>
                                <span className={`text-[9px] font-medium text-center ${invoiceLayout === '2-landscape' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {t('invoice.2invoice')}
                                </span>
                                {invoiceLayout === '2-landscape' && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center"><Check size={8} className="text-background" /></div>}
                            </button>
                            <button
                                onClick={() => updateInvoiceSettings('invoiceLayout', '4-portrait')}
                                className={`relative p-2 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all ${invoiceLayout === '4-portrait' ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}
                            >
                                <div className="w-7 h-9 rounded-sm bg-background border border-border p-0.5 grid grid-cols-2 grid-rows-2 gap-0.5 pointer-events-none">
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                    <div className="bg-foreground/40 rounded-[1px] w-full h-full"></div>
                                </div>
                                <span className={`text-[9px] font-medium text-center ${invoiceLayout === '4-portrait' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {t('invoice.4invoice')}
                                </span>
                                {invoiceLayout === '4-portrait' && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center"><Check size={8} className="text-background" /></div>}
                            </button>
                        </div>
                    </Section>

                    {/* Numbering Mode Selection */}
                    <Section title={t('invoice.numberingMode')} icon={Hash}>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => updateInvoiceSettings('invoiceNumberingMode', 'all-same')}
                                className={`relative p-2 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all ${invoiceNumberingMode === 'all-same' ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}
                            >
                                <div className="w-9 h-7 rounded-sm bg-background border border-border p-1 flex items-center justify-center pointer-events-none">
                                    <div className="text-[8px] font-mono text-foreground/80 leading-none whitespace-pre text-center">
                                        {invoiceLayout === '4-portrait' ? '1|1\n1|1' : invoiceLayout === '2-landscape' ? '1 | 1' : '1'}
                                    </div>
                                </div>
                                <span className={`text-[9px] font-medium text-center ${invoiceNumberingMode === 'all-same' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {t('invoice.allSame')}
                                </span>
                                {invoiceNumberingMode === 'all-same' && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center"><Check size={8} className="text-background" /></div>}
                            </button>
                            <button
                                onClick={() => updateInvoiceSettings('invoiceNumberingMode', 'sequential-split')}
                                className={`relative p-2 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all ${invoiceNumberingMode === 'sequential-split' ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}
                            >
                                <div className="w-9 h-7 rounded-sm bg-background border border-border p-1 flex items-center justify-center pointer-events-none">
                                    <div className="text-[8px] font-mono text-foreground/80 leading-none whitespace-pre text-center">
                                        {invoiceLayout === '4-portrait' ? '1|2\n3|4' : invoiceLayout === '2-landscape' ? '1 | 2' : '1→'}
                                    </div>
                                </div>
                                <span className={`text-[9px] font-medium text-center ${invoiceNumberingMode === 'sequential-split' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {t('invoice.sequential')}
                                </span>
                                {invoiceNumberingMode === 'sequential-split' && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center"><Check size={8} className="text-background" /></div>}
                            </button>
                        </div>
                    </Section>

                    {/* Invoice Settings */}
                    <Section title={t('invoice.config')} icon={FileText}>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1"><label className="text-[10px] text-muted-foreground">{t('invoice.startNumber')}</label><Input type="number" min={1} value={state.settings.invoiceStartNumber} onChange={(e) => updateInvoiceSettings('invoiceStartNumber', parseInt(e.target.value) || 1)} /></div>
                            <div className="space-y-1"><label className="text-[10px] text-muted-foreground">{t('invoice.endNumber')}</label><Input type="number" min={1} value={state.settings.invoiceEndNumber} onChange={(e) => updateInvoiceSettings('invoiceEndNumber', parseInt(e.target.value) || 1)} /></div>
                        </div>
                    </Section>

                    {/* Number Positioning */}
                    <Section title={t('invoice.positioning')} icon={Move}>
                        <div className="p-2 rounded-md border border-border bg-muted/50 space-y-2">
                            <p className="text-[9px] text-muted-foreground">{t('invoice.dragHint')}</p>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2"><span className="text-[10px] text-foreground/80 w-3">X</span><input type="range" min="0" max="100" step="0.5" value={state.settings.invoiceNumberStyle.x} onChange={(e) => updateInvoiceStyle('x', parseFloat(e.target.value))} className="flex-1 h-1" /><span className="text-[10px] text-foreground/80 w-8 text-right">{state.settings.invoiceNumberStyle.x.toFixed(0)}%</span></div>
                                <div className="flex items-center gap-2"><span className="text-[10px] text-foreground/80 w-3">Y</span><input type="range" min="0" max="100" step="0.5" value={state.settings.invoiceNumberStyle.y} onChange={(e) => updateInvoiceStyle('y', parseFloat(e.target.value))} className="flex-1 h-1" /><span className="text-[10px] text-foreground/80 w-8 text-right">{state.settings.invoiceNumberStyle.y.toFixed(0)}%</span></div>
                            </div>
                            <div className="space-y-2 pt-2 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                    <Scaling size={10} className="text-muted-foreground" />
                                    <input type="range" min="12" max="120" step="1" value={state.settings.invoiceNumberStyle.fontSize} onChange={(e) => updateInvoiceStyle('fontSize', parseInt(e.target.value))} className="flex-1 h-1" />
                                    <span className="text-[10px] text-muted-foreground w-8 text-right">{state.settings.invoiceNumberStyle.fontSize}px</span>
                                </div>
                                <div className="flex gap-1 items-center">
                                    {['#000000', '#ef4444', '#3b82f6', '#ffffff'].map(c => (<button key={c} onClick={() => updateInvoiceStyle('color', c)} className={`w-5 h-5 rounded border transition-all ${state.settings.invoiceNumberStyle.color === c ? 'ring-1 ring-foreground/60 ring-offset-1' : 'border-border hover:opacity-80'}`} style={{ backgroundColor: c }} />))}
                                    <input type="color" value={state.settings.invoiceNumberStyle.color} onChange={(e) => updateInvoiceStyle('color', e.target.value)} className="w-5 h-5 rounded border border-border cursor-pointer" title="Custom color" />
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>
            )}

            <div className="p-4 overflow-y-auto flex-1 space-y-6">
                {state.mode === 'photos' && (
                    <>
                    <Section title={t('section.grid')} icon={Grid}>
                        <div className="grid grid-cols-3 gap-2">
                            {LAYOUTS.filter(l => !['2col', '3col', '3row', '1text-side', '2text1-side', 'invoice', 'invoice-1', 'invoice-4', 'businesscard', 'businesscard-form', 'businesscard-form-reverse', 'idphoto', 'idphoto-1', 'idphoto-2', 'idphoto-4'].includes(l.id)).map((layout) => {
                                const { isActive, previewType, label, isToggle } = getLayoutButtonData(layout);
                                
                                if (layout.id === 'custom') {
                                    return (
                                        <div 
                                          key={layout.id} 
                                          className={cn(
                                            "col-span-3 p-3 rounded-xl border flex flex-col gap-3 transition-all duration-300 relative overflow-hidden",
                                            isActive 
                                              ? 'border-foreground bg-accent/40 shadow-sm' 
                                              : 'border-border hover:border-foreground/30 hover:bg-muted/30'
                                          )}
                                        >
                                            {/* Button Header Section */}
                                            <div 
                                              onClick={() => handleLayoutClick(layout.id)}
                                              className="flex items-center justify-between cursor-pointer w-full select-none"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <LayoutPreview type={previewType} />
                                                    <div className="flex flex-col text-left rtl:text-right">
                                                      <span className={cn(
                                                        "text-xs font-bold transition-colors",
                                                        isActive ? 'text-foreground' : 'text-zinc-500'
                                                      )}>
                                                        {t(label)}
                                                      </span>
                                                      <span className="text-[9px] text-muted-foreground">
                                                        {state.language === 'ku' ? 'تۆڕی دەستکاری کراو' : 'Configurable grid layout'}
                                                      </span>
                                                    </div>
                                                </div>
                                                
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                                    isActive 
                                                      ? "bg-foreground border-foreground text-background" 
                                                      : "border-zinc-300 dark:border-zinc-700 text-transparent"
                                                )}>
                                                    <Check size={10} strokeWidth={3} />
                                                </div>
                                            </div>
                                            
                                            {/* Sliders Container (Disabled when layout is not selected) */}
                                            <div className={cn(
                                                "grid grid-cols-2 gap-3 pt-2.5 border-t border-dashed border-border/80 transition-all duration-300",
                                                isActive ? "opacity-100" : "opacity-40 pointer-events-none select-none"
                                              )}
                                            >
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                                        <span>{t('settings.customCols')}</span>
                                                        <span className="font-bold text-foreground bg-zinc-150 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{state.settings.customCols || 2}</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min={1} 
                                                        max={6} 
                                                        step={1}
                                                        disabled={!isActive}
                                                        value={state.settings.customCols || 2} 
                                                        onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { customCols: parseInt(e.target.value) } })}
                                                        className="w-full accent-foreground h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                                        <span>{t('settings.customRows')}</span>
                                                        <span className="font-bold text-foreground bg-zinc-150 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{state.settings.customRows || 3}</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min={1} 
                                                        max={6} 
                                                        step={1}
                                                        disabled={!isActive}
                                                        value={state.settings.customRows || 3} 
                                                        onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { customRows: parseInt(e.target.value) } })}
                                                        className="w-full accent-foreground h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <button key={layout.id} onClick={() => handleLayoutClick(layout.id)} className={`relative p-2 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all group ${isActive ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}>
                                        <LayoutPreview type={previewType} />
                                        <span className={`text-[9px] font-medium text-center ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{t(label)}</span>
                                        {isActive && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center"><Check size={8} className="text-background" /></div>}
                                        {isToggle && <div className={`absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${isActive ? 'bg-foreground/30' : 'bg-muted'}`}><ArrowLeftRight size={8} className="text-foreground/60" /></div>}
                                    </button>
                                )
                            })}
                        </div>
                    </Section>
                    </>
                )}

                {(state.mode === 'photos' || state.mode === 'idphoto') && (
                    <Section title={t('section.navigation')} icon={ArrowLeftRight}>
                        <div className="p-3 rounded-md border border-border bg-muted/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] text-foreground/70 block">{t('section.currentView')}</span>
                                    <span className="text-sm font-medium text-foreground">{t('section.label')} {currentSection + 1} {t('section.of')} {totalSections || 1}</span>
                                </div>
                                <div className="w-7 h-7 rounded-md bg-background border border-border flex items-center justify-center"><Layers size={14} className="text-foreground/60" /></div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => currentSection > 0 && dispatch({ type: 'SET_SECTION_INDEX', payload: currentSection - 1 })} disabled={currentSection === 0} variant="outline" size="sm" className="flex-1"><ChevronLeft size={16} /></Button>
                                <Button onClick={() => currentSection < totalSections - 1 && dispatch({ type: 'SET_SECTION_INDEX', payload: currentSection + 1 })} disabled={currentSection >= totalSections - 1 || totalSections <= 1} variant="outline" size="sm" className="flex-1"><ChevronRight size={16} /></Button>
                            </div>
                        </div>
                    </Section>
                )}

                {state.mode === 'businesscard' && !state.businessCardDesignMode && (
                    <Section title={t('section.cards')} icon={Layout}>
                        <p className="text-xs text-foreground/70 p-2 rounded-md bg-muted/50 border border-border">{t('card.desc')}</p>
                        
                        {/* Layout Type Toggle */}
                        <div className="grid grid-cols-2 gap-2">
                            {(() => {
                                const targetPageIndex = state.selectedPageIndex !== null ? state.selectedPageIndex : 0;
                                const activePageLayout = state.pageLayouts[targetPageIndex] || state.globalLayout;
                                
                                const handleSetLayout = (layout: LayoutType) => {
                                    if (state.selectedPageIndex !== null) {
                                        dispatch({ type: 'SET_PAGE_LAYOUT', payload: { pageIndex: state.selectedPageIndex, layout } });
                                        
                                        const pageIndex = state.selectedPageIndex;
                                        const getPageStartIndex = (pIdx: number) => {
                                            let currentPhotoIndex = 0;
                                            for (let p = 0; p < pIdx; p++) {
                                                let layoutId = state.pageLayouts[p] || state.globalLayout;
                                                currentPhotoIndex += getLayoutCapacity(layoutId, state.settings);
                                            }
                                            return currentPhotoIndex;
                                        };
                                        const startIndex = getPageStartIndex(pageIndex);
                                        
                                        // Restore visibility of slots on this page for standard layouts
                                        const capacity = layout === 'businesscard' ? 10 : 6;
                                        for (let i = 0; i < capacity; i++) {
                                            dispatch({
                                                type: 'RESTORE_BUSINESS_CARD_SLOT',
                                                payload: startIndex + i
                                            });
                                        }
                                    } else {
                                        dispatch({ type: 'SET_LAYOUT', payload: layout });
                                    }
                                };

                                const layoutsData = [
                                    { id: 'businesscard', label: 'card.gridLayout', preview: 'businesscard' },
                                    { id: 'businesscard-form', label: 'card.formLayout', preview: 'businesscard-form' },
                                    { id: 'businesscard-form-reverse', label: 'card.formLayoutReverse', preview: 'businesscard-form-reverse' },

                                ];

                                return layoutsData.map(l => {
                                    const isActive = activePageLayout === l.id;
                                    return (
                                        <button 
                                            key={l.id} 
                                            onClick={() => handleSetLayout(l.id as LayoutType)} 
                                            className={`relative p-2 rounded-md border flex flex-col items-center justify-center gap-1.5 transition-all group ${isActive ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/60 hover:bg-muted/50'}`}
                                        >
                                            <LayoutPreview type={l.preview} />
                                            <span className={`text-[9px] font-medium text-center leading-tight ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {t(l.label)}
                                            </span>
                                            {isActive && (
                                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full flex items-center justify-center">
                                                    <Check size={8} className="text-background" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                });
                            })()}
                        </div>
                        
                        {(() => {
                            const targetPageIndex = state.selectedPageIndex !== null ? state.selectedPageIndex : 0;
                            const activePageLayout = state.pageLayouts[targetPageIndex] || state.globalLayout;
                            const isKurdish = state.language === 'ku' || state.language === 'ar';
                            

                            return (
                                <div className="flex flex-col gap-2">
                                    <input type="file" ref={frontInputRef} className="hidden" accept="image/*,.heic,.heif" onChange={(e) => handleFill(e, 'right')} />
                                    <Button onClick={() => frontInputRef.current?.click()} variant="outline" size="sm" className="w-full">
                                        <Scaling size={14} /> {(activePageLayout === 'businesscard-form' || activePageLayout === 'businesscard-form-reverse') ? t('card.fillSmall') : t('card.fillFront')}
                                    </Button>
                                    <input type="file" ref={backInputRef} className="hidden" accept="image/*,.heic,.heif" onChange={(e) => handleFill(e, 'left')} />
                                    <Button onClick={() => backInputRef.current?.click()} variant="outline" size="sm" className="w-full">
                                        <Scaling size={14} /> {(activePageLayout === 'businesscard-form' || activePageLayout === 'businesscard-form-reverse') ? t('card.fillForm') : t('card.fillBack')}
                                    </Button>
                                    <Button onClick={() => setShowTransferModal(true)} variant="outline" className="w-full" size="sm">
                                        <Smartphone size={14} /> {t('transfer.startShort')}
                                    </Button>
                                </div>
                            );
                        })()}
                        {(() => {
                            if (state.selectedBusinessCardIndex === null) return null;
                            const index = state.selectedBusinessCardIndex;

                            // Helper to dynamically calculate page layout and start index of card index
                            const getPageInfoForCardIndex = (cardIndex: number) => {
                                let currentPhotoIndex = 0;
                                for (let p = 0; p < state.manualPageCount; p++) {
                                    const layoutId = state.pageLayouts[p] || state.globalLayout;
                                    const cap = getLayoutCapacity(layoutId, state.settings);
                                    if (cardIndex >= currentPhotoIndex && cardIndex < currentPhotoIndex + cap) {
                                        return { pageIndex: p, startIndex: currentPhotoIndex, layoutId };
                                    }
                                    currentPhotoIndex += cap;
                                }
                                return { pageIndex: 0, startIndex: 0, layoutId: state.globalLayout };
                            };

                            const { startIndex, layoutId } = getPageInfoForCardIndex(index);
                            if (layoutId !== 'businesscard' && layoutId !== 'businesscard-form' && layoutId !== 'businesscard-form-reverse') return null;

                            const isForm = layoutId !== 'businesscard' && index === startIndex;
                            const sizeKey = getCardSizeKey(index, state.pageLayouts, state.globalLayout);
                            const cardSize = state.businessCardSizes?.[sizeKey] || { width: 101.5, height: isForm ? 290 : 58, hidden: false };
                            const isKurdish = state.language === 'ku' || state.language === 'ar';

                            const handleHeightChange = (val: number) => {
                                let cappedVal = val;
                                if (isForm) {
                                    cappedVal = 290;
                                } else {
                                    let otherHeightSum = 0;
                                    const isEven = index % 2 === 0;

                                    if (layoutId === 'businesscard') {
                                        // Grid Layout columns (Left: 0,2,4,6,8; Right: 1,3,5,7,9)
                                        const indices = isEven ? [0, 2, 4, 6, 8] : [1, 3, 5, 7, 9];
                                        indices.forEach(offset => {
                                            const gIdx = startIndex + offset;
                                            if (gIdx !== index) {
                                                const otherKey = getCardSizeKey(gIdx, state.pageLayouts, state.globalLayout);
                                                if (!state.businessCardSizes?.[otherKey]?.hidden) {
                                                    otherHeightSum += state.businessCardSizes?.[otherKey]?.height || 58;
                                                }
                                            }
                                        });
                                    } else {
                                        // Form Layout (Cards: 1,2,3,4,5)
                                        for (let i = 1; i <= 5; i++) {
                                            const gIdx = startIndex + i;
                                            if (gIdx !== index) {
                                                const otherKey = getCardSizeKey(gIdx, state.pageLayouts, state.globalLayout);
                                                if (!state.businessCardSizes?.[otherKey]?.hidden) {
                                                    otherHeightSum += state.businessCardSizes?.[otherKey]?.height || 58;
                                                }
                                            }
                                        }
                                    }
                                    const maxAllowedHeight = 290 - otherHeightSum;
                                    cappedVal = Math.max(10, Math.min(val, maxAllowedHeight));
                                }
                                dispatch({
                                    type: 'UPDATE_BUSINESS_CARD_SIZE',
                                    payload: { index, width: cardSize.width, height: cappedVal }
                                });
                            };

                            const handleWidthChange = (val: number) => {
                                let cappedVal = val;
                                    // For grid and form layouts, cap at half the page width minus paddings (approx 101.5) or full width
                                    // Actually, if it's form layout, it's 1 column? Wait, form is 1 column of 5 cards. It can be up to 101.5 or 200?
                                    // The standard width is 101.5. If it's grid, it's strictly 101.5 max because there are 2 columns.
                                    cappedVal = Math.max(10, Math.min(val, 101.5));
                                dispatch({
                                    type: 'UPDATE_BUSINESS_CARD_SIZE',
                                    payload: { index, width: cappedVal, height: cardSize.height }
                                });
                            };

                            const handleDeleteCard = () => {
                                dispatch({
                                    type: 'DELETE_BUSINESS_CARD_SLOT',
                                    payload: index
                                });
                            };

                            return (
                                 <div className="p-3 border border-border rounded-md bg-muted/40 space-y-3 mt-2">
                                     <p className="text-xs font-semibold text-foreground/80">
                                         {isKurdish ? `دەستکاری کارتی دیاریکراو (#${index - startIndex + 1})` : `Edit Selected Card (#${index - startIndex + 1})`}
                                     </p>
                                     <div className="grid grid-cols-2 gap-2">
                                         <div className="space-y-1">
                                             <label className="text-[10px] text-muted-foreground">{isKurdish ? 'پانی (mm)' : 'Width (mm)'}</label>
                                             <Input
                                                 type="number"
                                                 value={cardSize.width}
                                                 onChange={(e) => handleWidthChange(Number(e.target.value))}
                                                 onWheel={(e) => e.currentTarget.blur()}
                                                 className="h-8 text-xs"
                                             />
                                         </div>
                                         <div className="space-y-1">
                                             <label className="text-[10px] text-muted-foreground">{isKurdish ? 'بەرزی (mm)' : 'Height (mm)'}</label>
                                             <Input
                                                 type="number"
                                                 value={cardSize.height}
                                                 disabled={isForm}
                                                 onChange={(e) => handleHeightChange(Number(e.target.value))}
                                                 onWheel={(e) => e.currentTarget.blur()}
                                                 className={cn("h-8 text-xs", isForm && "bg-muted")}
                                             />
                                         </div>
                                     </div>
                                     <Button
                                         onClick={handleDeleteCard}
                                         variant="destructive"
                                         size="sm"
                                         className="w-full text-xs h-8"
                                     >
                                         <Trash2 size={12} className="mr-1" />
                                         {isKurdish ? 'سڕینەوەی کارت' : 'Delete Card'}
                                     </Button>
                                 </div>
                            );
                        })()}

                        {/* Hidden/Deleted Cards list */}
                        {(() => {
                            const targetPageIndex = state.selectedPageIndex !== null ? state.selectedPageIndex : 0;
                            const currentLayout = state.pageLayouts?.[targetPageIndex] || state.globalLayout;
                            if (currentLayout !== 'businesscard' && currentLayout !== 'businesscard-form' && currentLayout !== 'businesscard-form-reverse') return null;

                            const isKurdish = state.language === 'ku' || state.language === 'ar';
                            
                            // Helper to calculate start index of page
                            const getPageStartIndex = (pageIndex: number) => {
                                let currentPhotoIndex = 0;
                                for (let p = 0; p < pageIndex; p++) {
                                    let layoutId = state.pageLayouts[p] || state.globalLayout;
                                    currentPhotoIndex += getLayoutCapacity(layoutId, state.settings);
                                }
                                return currentPhotoIndex;
                            };
                            
                            const startIndex = getPageStartIndex(targetPageIndex);
                            const hiddenCards = [];
                            
                            if (currentLayout === 'businesscard') {
                                for (let i = 0; i < 10; i++) {
                                    const gIdx = startIndex + i;
                                    const key = getCardSizeKey(gIdx, state.pageLayouts, state.globalLayout);
                                    if (state.businessCardSizes?.[key]?.hidden) {
                                        hiddenCards.push(gIdx);
                                    }
                                }
                            } else {
                                for (let i = 1; i <= 5; i++) {
                                    const gIdx = startIndex + i;
                                    const key = getCardSizeKey(gIdx, state.pageLayouts, state.globalLayout);
                                    if (state.businessCardSizes?.[key]?.hidden) {
                                        hiddenCards.push(gIdx);
                                    }
                                }
                                const startKey = getCardSizeKey(startIndex, state.pageLayouts, state.globalLayout);
                                if (state.businessCardSizes?.[startKey]?.hidden) {
                                    hiddenCards.unshift(startIndex);
                                }
                            }

                            if (hiddenCards.length === 0) return null;

                            return (
                                <div className="p-3 border border-border rounded-md bg-muted/40 space-y-2 mt-2">
                                    <p className="text-xs font-semibold text-foreground/80">
                                        {isKurdish ? 'کارتە سڕاوەکان:' : 'Deleted Cards/Slots:'}
                                    </p>
                                    <div className="flex flex-col gap-1.5">
                                        {hiddenCards.map((gIdx) => {
                                            const isForm = currentLayout !== 'businesscard' && gIdx === startIndex;
                                            const label = isForm 
                                                ? (isKurdish ? 'فۆرمی سەرەکی' : 'Main Form') 
                                                : (isKurdish ? `کارت ${gIdx - startIndex + (currentLayout === 'businesscard' ? 1 : 0)}` : `Card #${gIdx - startIndex + (currentLayout === 'businesscard' ? 1 : 0)}`);
                                                
                                            const handleRestore = () => {
                                                dispatch({
                                                    type: 'RESTORE_BUSINESS_CARD_SLOT',
                                                    payload: gIdx
                                                });
                                            };

                                            return (
                                                <div key={gIdx} className="flex items-center justify-between bg-background border rounded px-2 py-1 text-xs">
                                                    <span className="text-muted-foreground">{label}</span>
                                                    <Button onClick={handleRestore} size="sm" variant="outline" className="h-6 px-2 text-[10px] py-0.5">
                                                        <Plus size={10} className="mr-0.5" />
                                                        {isKurdish ? 'گەڕاندنەوە' : 'Restore'}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </Section>
                )}

                {/* Business Card Design Mode - Section Tabs */}
                {state.mode === 'businesscard' && state.businessCardDesignMode && (
                    <Section title={state.language === 'ku' ? 'دیزاینی کارت' : state.language === 'ar' ? 'تصميم البطاقة' : 'Card Designer'} icon={PenTool}>
                        <div className="space-y-1">
                            {[
                                { id: 'info' as BusinessCardSection, icon: User, label: state.language === 'ku' ? 'زانیاری' : state.language === 'ar' ? 'معلومات' : 'Info' },
                                { id: 'contact' as BusinessCardSection, icon: Phone, label: state.language === 'ku' ? 'پەیوەندی' : state.language === 'ar' ? 'اتصال' : 'Contact' },
                                { id: 'media' as BusinessCardSection, icon: Image, label: state.language === 'ku' ? 'وێنە و لۆگۆ' : state.language === 'ar' ? 'صورة وشعار' : 'Media' },
                                { id: 'template' as BusinessCardSection, icon: Layout, label: state.language === 'ku' ? 'تێمپلەیت' : state.language === 'ar' ? 'قالب' : 'Template' },
                                { id: 'customize' as BusinessCardSection, icon: Palette, label: state.language === 'ku' ? 'دەستکاری' : state.language === 'ar' ? 'تخصيص' : 'Customize' },
                            ].map((section) => {
                                const Icon = section.icon;
                                const isActive = activeBusinessCardSection === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => onBusinessCardSectionChange?.(section.id)}
                                        className={cn(
                                            "w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-all",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Icon size={16} />
                                        <span>{section.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Business Card Language Selector */}
                        <div className="mt-4 pt-4 border-t border-border">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2 px-1">
                                <Languages size={12} />
                                {state.language === 'ku' ? 'زمانی کارت' : state.language === 'ar' ? 'لغة البطاقة' : 'Card Language'}
                            </label>
                            <div className="flex gap-1">
                                <Button
                                    onClick={() => dispatch({ type: 'SET_BUSINESS_CARD_LANGUAGE', payload: 'en' })}
                                    variant={state.businessCardLanguage === 'en' ? 'default' : 'outline'}
                                    size="sm"
                                    className="flex-1 text-xs"
                                >
                                    English
                                </Button>
                                <Button
                                    onClick={() => dispatch({ type: 'SET_BUSINESS_CARD_LANGUAGE', payload: 'ku' })}
                                    variant={state.businessCardLanguage === 'ku' ? 'default' : 'outline'}
                                    size="sm"
                                    className="flex-1 text-xs"
                                >
                                    کوردی
                                </Button>
                                <Button
                                    onClick={() => dispatch({ type: 'SET_BUSINESS_CARD_LANGUAGE', payload: 'ar' })}
                                    variant={state.businessCardLanguage === 'ar' ? 'default' : 'outline'}
                                    size="sm"
                                    className="flex-1 text-xs"
                                >
                                    عربی
                                </Button>
                            </div>
                        </div>

                        {/* Export Card Button */}
                        <div className="mt-4 pt-4 border-t border-border">
                            <Button
                                onClick={handleBusinessCardExport}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                <Download size={14} />
                                <span>{state.language === 'ku' ? 'داگرتنی PDF' : state.language === 'ar' ? 'تصدير PDF' : 'Export PDF'}</span>
                            </Button>
                        </div>

                        {/* Clear Card Button */}
                        <div className="mt-2">
                            <Button
                                onClick={() => dispatch({ type: 'CLEAR_BUSINESS_CARD_DATA' })}
                                variant="outline"
                                size="sm"
                                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 size={14} />
                                <span>{state.language === 'ku' ? 'سڕینەوەی کارت' : 'Clear Card'}</span>
                            </Button>
                        </div>
                    </Section>
                )}

                {/* Resume Mode - Section Tabs */}
                {state.mode === 'resume' && (
                    <Section title={t('section.resumeSections') || (state.language === 'ku' ? 'بەشەکانی سیڤی' : 'Resume Sections')} icon={FileText}>
                        <div className="space-y-1">
                            {[
                                { id: 'personal' as ResumeSection, icon: User, label: state.language === 'ku' ? 'زانیاری کەسی' : 'Personal Info' },
                                { id: 'photo' as ResumeSection, icon: Camera, label: state.language === 'ku' ? 'وێنە' : 'Photo' },
                                { id: 'experience' as ResumeSection, icon: Briefcase, label: state.language === 'ku' ? 'ئەزموون' : 'Experience' },
                                { id: 'education' as ResumeSection, icon: GraduationCap, label: state.language === 'ku' ? 'خوێندن' : 'Education' },
                                { id: 'skills' as ResumeSection, icon: Award, label: state.language === 'ku' ? 'لێهاتوویی' : 'Skills' },
                                { id: 'languages' as ResumeSection, icon: Languages, label: state.language === 'ku' ? 'زمانەکان' : 'Languages' },
                                { id: 'template' as ResumeSection, icon: Layout, label: state.language === 'ku' ? 'تێمپلەیت' : 'Template' },
                                { id: 'customize' as ResumeSection, icon: Palette, label: state.language === 'ku' ? 'دەستکاری' : 'Customize' }
                            ].map((section) => {
                                const Icon = section.icon;
                                const isActive = activeResumeSection === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => onResumeSectionChange?.(section.id)}
                                        className={cn(
                                            "w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-all",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Icon size={16} />
                                        <span>{section.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* CV Language Switcher */}
                        <div className="mt-4 pt-4 border-t border-border">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2 px-1">
                                <Languages size={12} />
                                {state.language === 'ku' ? 'زمانی سیڤی' : 'CV Language'}
                            </label>
                            <div className="flex gap-1">
                                <Button
                                    onClick={() => dispatch({ type: 'SET_RESUME_LANGUAGE', payload: 'en' })}
                                    variant={state.resumeLanguage === 'en' ? 'default' : 'outline'}
                                    size="sm"
                                    className="flex-1 text-xs"
                                >
                                    English
                                </Button>
                                <Button
                                    onClick={() => dispatch({ type: 'SET_RESUME_LANGUAGE', payload: 'ku' })}
                                    variant={state.resumeLanguage === 'ku' ? 'default' : 'outline'}
                                    size="sm"
                                    className="flex-1 text-xs"
                                >
                                    کوردی
                                </Button>
                                <Button
                                    onClick={() => dispatch({ type: 'SET_RESUME_LANGUAGE', payload: 'ar' })}
                                    variant={state.resumeLanguage === 'ar' ? 'default' : 'outline'}
                                    size="sm"
                                    className="flex-1 text-xs"
                                >
                                    عربی
                                </Button>
                            </div>
                        </div>

                        {/* Export Resume Button */}
                        <div className="mt-4 pt-4 border-t border-border">
                            <Button
                                onClick={() => setShowResumeExportDialog(true)}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                <Download size={14} />
                                <span>{state.language === 'ku' ? 'داگرتنی سیڤی' : 'Export Resume'}</span>
                            </Button>
                        </div>

                        {/* Clear Resume Button */}
                        <div className="mt-2">
                            <Button
                                onClick={() => setShowClearResumeConfirm(true)}
                                variant="outline"
                                size="sm"
                                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 size={14} />
                                <span>{state.language === 'ku' ? 'سڕینەوەی سیڤی' : 'Clear Resume'}</span>
                            </Button>
                        </div>
                    </Section>
                )}

                {/* Stamp Mode Editor Sections */}
                {state.mode === 'stamp' && (
                    <>
                        <Section title={t('stamp.settings') || 'Settings'} icon={Sliders}>
                            <div className="space-y-4">
                                {/* Ink Color Selector — single row */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        {t('stamp.textColor') || 'Ink Color'}
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                        {STAMP_COLORS.map((c) => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => dispatch({ type: 'UPDATE_STAMP_DATA', payload: { textColor: c.value } })}
                                                className={cn(
                                                    "w-6 h-6 rounded-full border-2 border-border transition-all hover:scale-110 relative flex-shrink-0 flex items-center justify-center shadow-sm",
                                                    state.stampData.textColor === c.value && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-110"
                                                )}
                                                style={{ backgroundColor: c.value }}
                                                title={c.name}
                                            >
                                                {state.stampData.textColor === c.value && <Check size={10} className="text-white" strokeWidth={3} />}
                                            </button>
                                        ))}
                                        {/* Divider */}
                                        <div className="w-px h-5 bg-border mx-0.5 flex-shrink-0" />
                                        {/* Custom color picker */}
                                        <div className="relative w-6 h-6 rounded-full border-2 border-border overflow-hidden flex-shrink-0 cursor-pointer shadow-sm" title="Custom color">
                                            <input
                                                type="color"
                                                value={state.stampData.textColor}
                                                onChange={(e) => dispatch({ type: 'UPDATE_STAMP_DATA', payload: { textColor: e.target.value } })}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer scale-150"
                                            />
                                            <div className="w-full h-full rounded-full" style={{ backgroundColor: state.stampData.textColor }} />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono uppercase leading-none">{state.stampData.textColor}</span>
                                    </div>
                                </div>

                                {/* Shape + Template Dropdowns — side by side */}
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Shape Dropdown */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{t('stamp.shape') || 'Shape'}</label>
                                        <div className="relative" ref={shapeDropdownRef}>
                                            <button
                                                type="button"
                                                onClick={() => { setShapeDropdownOpen(p => !p); setTemplateDropdownOpen(false); }}
                                                className="w-full flex items-center justify-between px-2.5 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-muted transition-colors gap-1"
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    {state.stampData.shape === 'circle' && <div className="w-3.5 h-3.5 rounded-full border-2 border-current flex-shrink-0" />}
                                                    {state.stampData.shape === 'oval' && <div className="w-4 h-2.5 rounded-[50%] border-2 border-current flex-shrink-0" />}
                                                    {state.stampData.shape === 'rectangle' && <div className="w-4 h-2.5 border-2 border-current rounded-sm flex-shrink-0" />}
                                                    {state.stampData.shape === 'square' && <div className="w-3 h-3 border-2 border-current rounded-sm flex-shrink-0" />}
                                                    <span className="capitalize truncate">{t(`stamp.shape.${state.stampData.shape}`) || state.stampData.shape}</span>
                                                </span>
                                                <ChevronDown size={12} className={cn("flex-shrink-0 transition-transform", shapeDropdownOpen && "rotate-180")} />
                                            </button>
                                            {shapeDropdownOpen && (
                                                <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 p-1 flex flex-col gap-0.5 select-none">
                                                    {(['circle', 'oval', 'rectangle', 'square'] as const).map((sh) => (
                                                        <button
                                                            key={sh}
                                                            type="button"
                                                            onClick={() => {
                                                                let w = 40, h = 40;
                                                                if (sh === 'oval') { w = 55; h = 35; }
                                                                else if (sh === 'rectangle') { w = 50; h = 25; }
                                                                dispatch({ type: 'UPDATE_STAMP_DATA', payload: { shape: sh, width: w, height: h } });
                                                                setShapeDropdownOpen(false);
                                                            }}
                                                            className={cn(
                                                                "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left",
                                                                state.stampData.shape === sh ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
                                                            )}
                                                        >
                                                            {sh === 'circle' && <div className="w-3.5 h-3.5 rounded-full border-2 border-current flex-shrink-0" />}
                                                            {sh === 'oval' && <div className="w-4 h-2.5 rounded-[50%] border-2 border-current flex-shrink-0" />}
                                                            {sh === 'rectangle' && <div className="w-4 h-2.5 border-2 border-current rounded-sm flex-shrink-0" />}
                                                            {sh === 'square' && <div className="w-3 h-3 border-2 border-current rounded-sm flex-shrink-0" />}
                                                            <span className="capitalize">{t(`stamp.shape.${sh}`) || sh}</span>
                                                            {state.stampData.shape === sh && <Check size={10} className="ml-auto flex-shrink-0" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Template Dropdown */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{state.language === 'ku' ? 'تێمپلەیت' : state.language === 'ar' ? 'قالب' : 'Template'}</label>
                                        <div className="relative" ref={templateDropdownRef}>
                                            <button
                                                type="button"
                                                onClick={openTemplateDropdown}
                                                className="w-full flex items-center justify-between px-2.5 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-muted transition-colors gap-1"
                                            >
                                                <span className="flex items-center gap-1.5 truncate">
                                                    <Stamp size={11} className="flex-shrink-0" />
                                                    <span className="truncate">{state.language === 'ku' ? 'هەڵبژێرە' : state.language === 'ar' ? 'اختر' : 'Select'}</span>
                                                </span>
                                                <ChevronDown size={12} className={cn("flex-shrink-0 transition-transform", templateDropdownOpen && "rotate-180")} />
                                            </button>
                                            {templateDropdownOpen && (
                                                <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 p-1 flex flex-col gap-0.5 select-none">
                                                    {/* Presets Section */}
                                                    <div className="px-2 py-1 border-b border-border/40 mb-1">
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                                            {state.language === 'ku' ? 'تێمپلەیتەکان' : state.language === 'ar' ? 'القوالب' : 'Templates'}
                                                        </span>
                                                    </div>
                                                    {getStampPresets(state.language).map((p) => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => {
                                                                const presetPayload: any = {
                                                                    shape: p.shape, width: p.width, height: p.height,
                                                                    outerText: p.outerText, innerText: p.innerText, centerText: p.centerText,
                                                                    textColor: p.textColor, borderWidth: p.borderWidth,
                                                                    fontFamily: p.fontFamily || 'Inter',
                                                                    outerFontFamily: p.outerFontFamily || 'Inter',
                                                                    innerFontFamily: p.innerFontFamily || 'Inter',
                                                                    centerFontFamily: p.centerFontFamily || 'Inter',
                                                                    fontSize: p.fontSize, outerFontSize: p.outerFontSize,
                                                                    innerFontSize: p.innerFontSize, centerFontSize: p.centerFontSize,
                                                                    outerRadiusOffset: p.outerRadiusOffset || 0,
                                                                    innerRadiusOffset: p.innerRadiusOffset || 0,
                                                                    hasInnerRing: p.hasInnerRing, hasDottedRing: p.hasDottedRing,
                                                                    hasStars: p.hasStars, starCount: p.starCount || 2,
                                                                    distressEffect: p.distressEffect || 0,
                                                                    letterSpacing: p.letterSpacing || 0,
                                                                    centerImage: (p as any).centerImage || null,
                                                                    layers: [], selectedLayerId: null,
                                                                    activeSavedDesignId: null // Reset active saved design since we loaded a preset
                                                                };
                                                                dispatch({ type: 'UPDATE_STAMP_DATA', payload: presetPayload });
                                                                setTemplateDropdownOpen(false);
                                                            }}
                                                            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left hover:bg-accent text-foreground"
                                                        >
                                                            <div
                                                                className={cn(
                                                                    "flex-shrink-0 border-2",
                                                                    p.shape === 'circle' ? "w-4 h-4 rounded-full" :
                                                                    p.shape === 'oval' ? "w-5 h-3 rounded-[50%]" :
                                                                    p.shape === 'square' ? "w-3.5 h-3.5 rounded-sm" :
                                                                    "w-5 h-3 rounded-sm"
                                                                )}
                                                                style={{ borderColor: p.textColor }}
                                                            />
                                                            <span className="truncate">{t(p.nameKey) || p.nameKey}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Stamp Size Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">
                                            {state.language === 'ku' ? 'پانی' : state.language === 'ar' ? 'العرض' : 'Width'} (mm)
                                        </label>
                                        <div className="flex items-center gap-2 bg-muted px-2 py-1.5 rounded-md border border-border">
                                            <input 
                                                type="number" 
                                                min={15} 
                                                max={120} 
                                                value={state.stampData.width}
                                                onChange={(e) => dispatch({ type: 'UPDATE_STAMP_DATA', payload: { width: Math.max(15, parseInt(e.target.value) || 15) } })}
                                                className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none"
                                            />
                                            <span className="text-[10px] text-muted-foreground font-mono">mm</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground text-opacity-80">
                                            {state.language === 'ku' ? 'بەرزی' : state.language === 'ar' ? 'الارتفاع' : 'Height'} (mm)
                                        </label>
                                        <div className="flex items-center gap-2 bg-muted px-2 py-1.5 rounded-md border border-border">
                                            <input 
                                                type="number" 
                                                min={15} 
                                                max={120} 
                                                value={state.stampData.height}
                                                disabled={state.stampData.shape === 'circle' || state.stampData.shape === 'square'}
                                                onChange={(e) => dispatch({ type: 'UPDATE_STAMP_DATA', payload: { height: Math.max(15, parseInt(e.target.value) || 15) } })}
                                                className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none disabled:opacity-50"
                                            />
                                            <span className="text-[10px] text-muted-foreground font-mono">mm</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Border width — slider */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-medium text-foreground">
                                        <span>{t('stamp.borderWidth') || 'Border Thickness'}</span>
                                        <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded border border-border/50">{state.stampData.borderWidth}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={15}
                                        step={0.5}
                                        value={state.stampData.borderWidth}
                                        onChange={(e) => dispatch({ type: 'UPDATE_STAMP_DATA', payload: { borderWidth: parseFloat(e.target.value) } })}
                                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>

                                {/* Ring & Stars Toggles */}
                                <div className="space-y-2 pt-2 border-t border-border/50">
                                    {/* Inner Ring Toggle */}
                                    <div className="flex items-center justify-between bg-muted/20 p-2 rounded-md border border-border/50">
                                        <span className="text-xs text-foreground font-medium select-none">{t('stamp.hasInnerRing') || 'Inner Ring'}</span>
                                        <button
                                            type="button"
                                            onClick={() => dispatch({ type: 'UPDATE_STAMP_DATA', payload: { hasInnerRing: !state.stampData.hasInnerRing } })}
                                            className={cn(
                                                "w-8 h-4 rounded-full transition-colors relative focus:outline-none border border-border",
                                                state.stampData.hasInnerRing ? "bg-primary" : "bg-muted"
                                            )}
                                        >
                                            <div className={cn("w-3 h-3 bg-background rounded-full absolute top-[1px] transition-transform shadow-sm", state.stampData.hasInnerRing ? "right-[1px]" : "left-[1px]")} />
                                        </button>
                                    </div>

                                    {state.stampData.shape === 'circle' && (
                                        <>
                                            {/* Dotted Ring Toggle */}
                                            <div className="flex items-center justify-between bg-muted/20 p-2 rounded-md border border-border/50">
                                                <span className="text-xs text-foreground font-medium select-none">{t('stamp.hasDottedRing') || 'Dotted Ring'}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => dispatch({ type: 'UPDATE_STAMP_DATA', payload: { hasDottedRing: !state.stampData.hasDottedRing } })}
                                                    className={cn(
                                                        "w-8 h-4 rounded-full transition-colors relative focus:outline-none border border-border",
                                                        state.stampData.hasDottedRing ? "bg-primary" : "bg-muted"
                                                    )}
                                                >
                                                    <div className={cn("w-3 h-3 bg-background rounded-full absolute top-[1px] transition-transform shadow-sm", state.stampData.hasDottedRing ? "right-[1px]" : "left-[1px]")} />
                                                </button>
                                            </div>

                                            {/* Stars Toggle */}
                                            <div className="flex items-center justify-between bg-muted/20 p-2 rounded-md border border-border/50">
                                                <span className="text-xs text-foreground font-medium select-none">{t('stamp.hasStars') || 'Separator Stars'}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => dispatch({ type: 'UPDATE_STAMP_DATA', payload: { hasStars: !state.stampData.hasStars, starCount: !state.stampData.hasStars ? 2 : 0 } })}
                                                    className={cn(
                                                        "w-8 h-4 rounded-full transition-colors relative focus:outline-none border border-border",
                                                        state.stampData.hasStars ? "bg-primary" : "bg-muted"
                                                    )}
                                                >
                                                    <div className={cn("w-3 h-3 bg-background rounded-full absolute top-[1px] transition-transform shadow-sm", state.stampData.hasStars ? "right-[1px]" : "left-[1px]")} />
                                                </button>
                                            </div>

                                            {state.stampData.hasStars && (
                                                <div className="flex items-center justify-between pl-4 py-1.5 bg-muted/10 rounded-md border border-dashed border-border">
                                                    <span className="text-[11px] text-muted-foreground font-medium select-none">{t('stamp.starCount') || 'Star Count'}</span>
                                                    <div className="flex items-center gap-1.5 pr-2">
                                                        {[1, 2, 4].map(num => (
                                                            <button
                                                                key={num}
                                                                type="button"
                                                                onClick={() => dispatch({ type: 'UPDATE_STAMP_DATA', payload: { starCount: num } })}
                                                                className={cn(
                                                                    "px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors",
                                                                    state.stampData.starCount === num 
                                                                        ? "bg-primary text-white border-primary" 
                                                                        : "bg-background text-foreground border-border hover:bg-muted"
                                                                )}
                                                            >
                                                                {num}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </Section>

                        {/* Text Creator Section */}
                        <Section title={t('prop.content') || 'Text Layers'} icon={Type}>
                            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 select-none">
                                    <Type size={14} className="text-primary" />
                                    {t('stamp.addText') || 'Add Text Layer'}
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newText}
                                        onChange={(e) => setNewText(e.target.value)}
                                        placeholder={t('stamp.textPlaceholder') || 'Enter text...'}
                                        className="text-xs bg-background border-border text-foreground flex-1"
                                    />
                                    <Button
                                        onClick={() => {
                                            if (!newText.trim()) return;
                                            const id = `text-${generateId()}`;
                                            const newLayer = {
                                                id,
                                                type: 'text' as const,
                                                textType: newTextType,
                                                text: newText,
                                                fontFamily: state.stampData.fontFamily || 'Inter',
                                                fontSize: newTextType === 'straight' ? 42 : 38,
                                                radiusOffset: newTextType === 'curve-up' ? -20 : newTextType === 'curve-down' ? -50 : 0,
                                                offsetX: 0,
                                                offsetY: 0,
                                            };
                                            const updatedLayers = [...(state.stampData.layers || []), newLayer];
                                            
                                            // Only push to layers — do NOT also set legacy outerText/innerText/centerText
                                            // because the sync useEffect in StampTab would then add a SECOND layer with id 'outerText'/'centerText'
                                            dispatch({
                                                type: 'UPDATE_STAMP_DATA',
                                                payload: { layers: updatedLayers, selectedLayerId: id }
                                            });
                                            setNewText('');
                                        }}
                                        className="text-xs shrink-0"
                                        size="sm"
                                    >
                                        <Plus size={14} className="mr-1" />
                                        {t('action.add') || 'Add'}
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between gap-2 pt-1">
                                    <span className="text-[10px] text-muted-foreground font-medium select-none">{t('stamp.textType') || 'Text Type'}:</span>
                                    <div className="flex gap-1 bg-muted p-0.5 rounded-md border border-border">
                                        {(['curve-up', 'straight', 'curve-down'] as const).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setNewTextType(type)}
                                                className={cn(
                                                    "p-1.5 rounded transition-all flex items-center justify-center",
                                                    newTextType === type 
                                                        ? "bg-background text-primary shadow-sm border border-border/50" 
                                                        : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                                                )}
                                                title={type === 'curve-up' ? t('stamp.textType.curveUp') : type === 'curve-down' ? t('stamp.textType.curveDown') : t('stamp.textType.straight')}
                                            >
                                                {type === 'curve-up' && (
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5"><path d="M4 17C4 17 8 9 12 9C16 9 20 17 20 17"/></svg>
                                                )}
                                                {type === 'straight' && (
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5"><path d="M4 12H20"/></svg>
                                                )}
                                                {type === 'curve-down' && (
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5"><path d="M4 7C4 7 8 15 12 15C16 15 20 7 20 7"/></svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* Logo Upload & Editor Section */}
                        <Section title={t('stamp.centerImage') || 'Logo/Signature'} icon={Upload}>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        ref={stampFileInputRef}
                                        onChange={handleStampImageUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <Button
                                        onClick={() => stampFileInputRef.current?.click()}
                                        className="w-full text-xs font-semibold"
                                        disabled={isProcessingStampImg}
                                    >
                                        {isProcessingStampImg ? (
                                            <>
                                                <Loader2 className="animate-spin mr-2 h-3.5 w-3.5" />
                                                {t('label.loading') || 'Loading...'}
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-1.5" size={14} />
                                                {t('stamp.uploadLogo') || 'Upload Logo'}
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        onClick={() => setShowTransferModal(true)}
                                        variant="outline"
                                        className="w-full text-xs font-semibold"
                                        title={t('tooltip.receiveFromPhone') || 'Receive from Phone'}
                                    >
                                        <Smartphone className="mr-1.5" size={14} />
                                        {t('transfer.fromPhone') || 'From Phone'}
                                    </Button>
                                </div>
                            </div>
                        </Section>
                    </>
                )}
            </div>

            <div className="p-3 border-t border-border">
                <div className="text-[10px] text-muted-foreground text-center">v{appVersion}</div>
            </div>
            
            {/* Clear Resume Confirm Modal */}
            {showClearResumeConfirm && ReactDOM.createPortal(
                <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in ${state.language === 'ku' ? 'font-kufi' : ''}`} dir={state.language === 'ku' ? 'rtl' : 'ltr'}>
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowClearResumeConfirm(false)} />
                    <Card className="relative w-full max-w-sm animate-slide-up">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{t('confirm.clearResumeTitle')}</CardTitle>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowClearResumeConfirm(false)}><X size={16} /></Button>
                            </div>
                            <CardDescription>{t('confirm.clearResumeDesc')}</CardDescription>
                        </CardHeader>
                        <CardFooter className="gap-2 pt-4">
                            <Button variant="outline" className="flex-1" onClick={() => setShowClearResumeConfirm(false)}>{t('action.cancel')}</Button>
                            <Button variant="destructive" className="flex-1" onClick={() => { 
                                dispatch({ type: 'CLEAR_RESUME_DATA' }); 
                                setShowClearResumeConfirm(false); 
                            }}>{t('action.clear')}</Button>
                        </CardFooter>
                    </Card>
                </div>
            , document.body)}

            {/* Resume Export Format Dialog */}
            <ExportFormatDialog
                open={showResumeExportDialog}
                onOpenChange={setShowResumeExportDialog}
                onExport={handleResumeExport}
                title={state.language === 'ku' ? 'هەڵبژاردنی فۆرماتی داگرتن' : state.language === 'ar' ? 'اختر صيغة التصدير' : 'Choose Export Format'}
                description={state.language === 'ku' ? 'فۆرماتێک هەڵبژێرە بۆ داگرتنی سیڤیەکەت' : state.language === 'ar' ? 'اختر صيغة لتصدير سيرتك الذاتية' : 'Select a format to export your resume'}
                language={state.language}
            />

            <WirelessTransferModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} />
            <canvas ref={stampCanvasRef} className="hidden" />
        </aside>
    );
};

export default Sidebar;
