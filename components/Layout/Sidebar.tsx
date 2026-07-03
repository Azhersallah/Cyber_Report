import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useApp } from '../../store/AppContext';
import {
    Layout, Grid, FileText, Check, X, ArrowLeftRight, Hash,
    Move, ArrowUp, Scaling, ChevronLeft, ChevronRight,
    Layers, ImagePlus, User, Briefcase, GraduationCap, Award, Camera, Languages, Trash2, Palette,
    Phone, Image, PenTool, Building2, Download, Smartphone, Plus
} from 'lucide-react';
import { LAYOUTS } from '../../constants';
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
import type { ResumeSection } from '../Resume/ResumeEditor';
import type { BusinessCardSection } from '../BusinessCard/BusinessCardEditor';

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
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground px-1">
            <Icon size={12} />
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
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                <FileText size={12} /> {t('input.projectTitle')}
            </label>
            <div className="space-y-2">
                <textarea ref={textareaRef} value={value} onChange={(e) => { setValue(e.target.value); setHasChanges(e.target.value !== htmlToText(initialValue)); }} rows={2} className="w-full text-base font-medium bg-transparent border border-border focus:border-foreground rounded-md p-2 outline-none text-foreground transition-colors resize-none overflow-hidden" placeholder={t('placeholder.projectTitle')} dir="auto" />
                {hasChanges && (
                    <div className="flex gap-2">
                        <Button onClick={() => { onSave(textToHtml(value)); setHasChanges(false); }} size="sm" className="flex-1"><Check size={14} /> {t('action.apply')}</Button>
                        <Button onClick={() => { setValue(htmlToText(initialValue)); setHasChanges(false); }} variant="outline" size="sm" className="flex-1"><X size={14} /> {t('action.cancel')}</Button>
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
        if (id === '2') dispatch({ type: 'SET_LAYOUT', payload: state.globalLayout === '2' ? '2col' : '2' });
        else if (id === '1text') dispatch({ type: 'SET_LAYOUT', payload: state.globalLayout === '1text' ? '1text-side' : '1text' });
        else dispatch({ type: 'SET_LAYOUT', payload: id as any });
    };

    const getLayoutButtonData = (layout: typeof LAYOUTS[0]) => {
        if (layout.id === '2') return { isActive: state.globalLayout === '2' || state.globalLayout === '2col', previewType: state.globalLayout === '2col' ? '2col' : '2', label: state.globalLayout === '2col' ? 'layout.2col' : 'layout.2', isToggle: true };
        if (layout.id === '1text') return { isActive: state.globalLayout === '1text' || state.globalLayout === '1text-side', previewType: state.globalLayout === '1text-side' ? '1text-side' : '1text', label: state.globalLayout === '1text-side' ? 'layout.1text-side' : 'layout.1text', isToggle: true };
        return { isActive: state.globalLayout === layout.id, previewType: layout.id, label: layout.label, isToggle: false };
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
            "bg-background border-r border-border flex-shrink-0 flex flex-col h-[calc(100vh-56px)] no-print",
            state.mode === 'resume' ? 'w-56' : 'w-72'
        )}>
            {/* Photos mode - Upload button at very top */}
            {state.mode === 'photos' && (
                <div className="p-4 border-b border-border space-y-2">
                    <input type="file" ref={photosInputRef} className="hidden" accept="image/*,.heic,.heif" multiple onChange={handlePhotosUpload} />
                    <Button onClick={() => photosInputRef.current?.click()} className="w-full">
                        <ImagePlus size={16} /> {t('upload.image')}
                    </Button>
                    <Button onClick={() => setShowTransferModal(true)} variant="outline" className="w-full" size="sm">
                        <Smartphone size={14} /> {t('transfer.startShort')}
                    </Button>
                    <p className="text-[9px] text-muted-foreground text-center">
                        {t('upload.hint')}
                    </p>
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
                            <ImagePlus size={16} /> {t('upload.image')}
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
                    <Section title={t('section.grid')} icon={Grid}>
                        <div className="grid grid-cols-3 gap-2">
                            {LAYOUTS.filter(l => !['2col', '1text-side', 'invoice', 'invoice-1', 'invoice-4', 'businesscard', 'businesscard-form', 'businesscard-form-reverse', 'idphoto', 'idphoto-1', 'idphoto-2', 'idphoto-4'].includes(l.id)).map((layout) => {
                                const { isActive, previewType, label, isToggle } = getLayoutButtonData(layout);
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
                        <div className="flex gap-2">
                            {(() => {
                                const targetPageIndex = state.selectedPageIndex !== null ? state.selectedPageIndex : 0;
                                const activePageLayout = state.pageLayouts[targetPageIndex] || state.globalLayout;
                                
                                const handleSetLayout = (layout: LayoutType) => {
                                    dispatch({ type: 'SET_LAYOUT', payload: layout });
                                    if (state.selectedPageIndex !== null) {
                                        dispatch({ type: 'SET_PAGE_LAYOUT', payload: { pageIndex: state.selectedPageIndex, layout } });
                                    }
                                };

                                return (
                                    <>
                                        <Button 
                                            onClick={() => handleSetLayout('businesscard')}
                                            variant={activePageLayout === 'businesscard' ? 'default' : 'outline'}
                                            size="sm" 
                                            className="flex-1"
                                        >
                                            <Grid size={14} /> {t('card.gridLayout')}
                                        </Button>
                                        <Button 
                                            onClick={() => handleSetLayout('businesscard-form')}
                                            variant={activePageLayout === 'businesscard-form' || activePageLayout === 'businesscard-form-reverse' ? 'default' : 'outline'}
                                            size="sm" 
                                            className="flex-1"
                                        >
                                            <FileText size={14} /> {t('card.formLayout')}
                                        </Button>
                                    </>
                                );
                            })()}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <input type="file" ref={frontInputRef} className="hidden" accept="image/*,.heic,.heif" onChange={(e) => handleFill(e, 'right')} />
                            <Button onClick={() => frontInputRef.current?.click()} variant="outline" size="sm" className="w-full">
                                <Scaling size={14} /> {(() => {
                                    const targetPageIndex = state.selectedPageIndex !== null ? state.selectedPageIndex : 0;
                                    const activePageLayout = state.pageLayouts[targetPageIndex] || state.globalLayout;
                                    return (activePageLayout === 'businesscard-form' || activePageLayout === 'businesscard-form-reverse') ? t('card.fillSmall') : t('card.fillFront');
                                })()}
                            </Button>
                            <input type="file" ref={backInputRef} className="hidden" accept="image/*,.heic,.heif" onChange={(e) => handleFill(e, 'left')} />
                            <Button onClick={() => backInputRef.current?.click()} variant="outline" size="sm" className="w-full">
                                <Scaling size={14} /> {(() => {
                                    const targetPageIndex = state.selectedPageIndex !== null ? state.selectedPageIndex : 0;
                                    const activePageLayout = state.pageLayouts[targetPageIndex] || state.globalLayout;
                                    return (activePageLayout === 'businesscard-form' || activePageLayout === 'businesscard-form-reverse') ? t('card.fillForm') : t('card.fillBack');
                                })()}
                            </Button>
                        </div>

                        {(() => {
                            if (state.selectedBusinessCardIndex === null) return null;
                            const index = state.selectedBusinessCardIndex;

                            // Helper to dynamically calculate page layout and start index of card index
                            const getPageInfoForCardIndex = (cardIndex: number) => {
                                let currentPhotoIndex = 0;
                                for (let p = 0; p < state.manualPageCount; p++) {
                                    const layoutId = state.pageLayouts[p] || state.globalLayout;
                                    const layoutDef = LAYOUTS.find(l => l.id === layoutId) || LAYOUTS[0];
                                    if (cardIndex >= currentPhotoIndex && cardIndex < currentPhotoIndex + layoutDef.capacity) {
                                        return { pageIndex: p, startIndex: currentPhotoIndex, layoutId };
                                    }
                                    currentPhotoIndex += layoutDef.capacity;
                                }
                                return { pageIndex: 0, startIndex: 0, layoutId: state.globalLayout };
                            };

                            const { startIndex, layoutId } = getPageInfoForCardIndex(index);
                            if (layoutId !== 'businesscard-form' && layoutId !== 'businesscard-form-reverse') return null;

                            const isForm = index === startIndex;
                            const cardSize = state.businessCardSizes?.[index] || { width: 101.5, height: isForm ? 290 : 58, hidden: false };
                            const isKurdish = state.language === 'ku' || state.language === 'ar';

                            const handleHeightChange = (val: number) => {
                                let cappedVal = val;
                                if (isForm) {
                                    cappedVal = 290;
                                } else {
                                    let otherHeightSum = 0;
                                    for (let i = 1; i <= 5; i++) {
                                        const gIdx = startIndex + i;
                                        if (gIdx !== index) {
                                            if (!state.businessCardSizes?.[gIdx]?.hidden) {
                                                otherHeightSum += state.businessCardSizes?.[gIdx]?.height || 58;
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
                                                 disabled={true}
                                                 className="h-8 text-xs bg-muted"
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
                            if (currentLayout !== 'businesscard-form' && currentLayout !== 'businesscard-form-reverse') return null;

                            const isKurdish = state.language === 'ku' || state.language === 'ar';
                            
                            // Helper to calculate start index of page
                            const getPageStartIndex = (pageIndex: number) => {
                                let currentPhotoIndex = 0;
                                for (let p = 0; p < pageIndex; p++) {
                                    let layoutId = state.pageLayouts[p] || state.globalLayout;
                                    const layoutDef = LAYOUTS.find(l => l.id === layoutId) || LAYOUTS[0];
                                    currentPhotoIndex += layoutDef.capacity;
                                }
                                return currentPhotoIndex;
                            };
                            
                            const startIndex = getPageStartIndex(targetPageIndex);
                            const hiddenCards = [];
                            for (let i = 1; i <= 5; i++) {
                                const gIdx = startIndex + i;
                                if (state.businessCardSizes?.[gIdx]?.hidden) {
                                    hiddenCards.push(gIdx);
                                }
                            }
                            if (state.businessCardSizes?.[startIndex]?.hidden) {
                                hiddenCards.unshift(startIndex);
                            }

                            if (hiddenCards.length === 0) return null;

                            return (
                                <div className="p-3 border border-border rounded-md bg-muted/40 space-y-2 mt-2">
                                    <p className="text-xs font-semibold text-foreground/80">
                                        {isKurdish ? 'کارتە سڕاوەکان:' : 'Deleted Cards/Slots:'}
                                    </p>
                                    <div className="flex flex-col gap-1.5">
                                        {hiddenCards.map((gIdx) => {
                                            const isForm = gIdx === startIndex;
                                            const label = isForm 
                                                ? (isKurdish ? 'فۆرمی سەرەکی' : 'Main Form') 
                                                : (isKurdish ? `کارت ${gIdx - startIndex}` : `Card #${gIdx - startIndex}`);
                                                
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
        </aside>
    );
};

export default Sidebar;
