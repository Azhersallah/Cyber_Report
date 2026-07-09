import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { 
  Printer, Settings, Sun, Moon, User, Type, 
  Image as ImageIcon, Save, FolderOpen, SaveAll,
  Languages, Palette, Eye, Check, Timer, Search, Replace,
  Laptop, Layers, Scaling, X, Eraser, Trash2, Download, Sparkles, Calendar, ArrowLeftRight, MessageSquare,
  Lock, Unlock, Plus, ChevronDown, CreditCard, FileText, Briefcase, QrCode, ClipboardList, Mail, Stamp, Shield
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { AppMode } from '../../types';
import { getTranslation } from '../../utils/translations';
import { readFileAsDataURL, getTotalPagesCount } from '../../utils/helpers';
import { encryptProjectData, decryptProjectData } from '../../utils/encryption';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { useToast } from '../ui/toast';
import FindReplaceModal from '../Modals/FindReplaceModal';
import UpdateModal from '../Modals/UpdateModal';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && (window as any).require;
const ipcRenderer = isElectron ? (window as any).require('electron').ipcRenderer : null;
// Force reload favicon - remove timestamp after testing
const faviconUrl = new URL('../../favicon.svg', import.meta.url).href;

interface HeaderProps {
  onPrintClick: () => void;
  isActivated?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onPrintClick, isActivated = true }) => {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const t = (key: string) => getTranslation(key, state.language);
  const [showSettings, setShowSettings] = useState(false);
  const [seenNewFeatures, setSeenNewFeatures] = useState<{
    tasks: boolean;
    stickers: boolean;
    qrcode: boolean;
    stamp: boolean;
  }>(() => {
    return {
      tasks: localStorage.getItem('seen_feature_tasks_v2') === 'true',
      stickers: localStorage.getItem('seen_feature_stickers_v2') === 'true',
      qrcode: localStorage.getItem('seen_feature_qrcode_v2') === 'true',
      stamp: localStorage.getItem('seen_feature_stamp_v2') === 'true',
    };
  });

  // Automatically mark active mode as seen
  useEffect(() => {
    if (['tasks', 'stickers', 'qrcode', 'stamp'].includes(state.mode)) {
      localStorage.setItem(`seen_feature_${state.mode}`, 'true');
      setSeenNewFeatures(prev => ({ ...prev, [state.mode]: true }));
    }
  }, [state.mode]);
  const [activeTab, setActiveTab] = useState<'general' | 'visibility' | 'branding'>('general');
  const settingsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Helper function to convert Kurdish/Arabic numerals to English numerals
  const normalizeNumber = (value: string): string => {
    const kurdishToEnglish: { [key: string]: string } = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    return value.split('').map(char => kurdishToEnglish[char] || char).join('');
  };

  // Helper function to calculate final margin (base + additional)
  const getMarginValue = (side: 'top' | 'right' | 'bottom' | 'left'): number => {
    const baseMargins = { top: 4, right: 3, bottom: 3, left: 3 };
    const additional = state.settings[`margin${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof typeof state.settings] as number || 0;
    return baseMargins[side] + additional;
  };

  // Reset margins to default (0 additional)
  const handleResetMargins = () => {
    dispatch({ 
      type: 'UPDATE_SETTINGS', 
      payload: { 
        marginTop: 0, 
        marginRight: 0, 
        marginBottom: 0, 
        marginLeft: 0 
      } 
    });
    showToast(state.language === 'ku' ? 'مارجنەکان گەڕانەوە بۆ بنەڕەت' : 'Margins reset to default', 'success');
  };
  
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showOpenConfirm, setShowOpenConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  
  // Find & Replace state
  const [showFindReplace, setShowFindReplace] = useState(false);
  
  // Update Modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateToastData, setUpdateToastData] = useState<{ version: string } | null>(null);

  // Save lock to prevent concurrent saves (fixes corruption)
  const isSavingRef = useRef(false);

  // Listen for open-update-modal event (from App.tsx notification)
  useEffect(() => {
    const handleOpenUpdateModal = () => {
      setShowUpdateModal(true);
    };
    
    window.addEventListener('open-update-modal', handleOpenUpdateModal);
    
    return () => {
      window.removeEventListener('open-update-modal', handleOpenUpdateModal);
    };
  }, []);

  // Listen for update available toast notification from main process
  useEffect(() => {
    if (isElectron && ipcRenderer) {
      console.log('[Header] Setting up update toast listener...');
      
      const handleUpdateToast = (_event: any, data: { version: string; message: string; messageEn: string }) => {
        console.log('[Header] Received update toast:', data);
        setUpdateToastData({ version: data.version });
        setUpdateAvailable(true);
      };

      ipcRenderer.on('update-available-toast', handleUpdateToast);
      
      return () => {
        ipcRenderer.removeListener('update-available-toast', handleUpdateToast);
      };
    } else {
      console.log('[Header] Not in Electron or ipcRenderer not available');
    }
  }, []);

  // Keyboard shortcut: Ctrl+F for Find & Replace (only in Photos mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F - Find & Replace (only in Photos mode)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        if (state.mode === 'photos') {
          e.preventDefault();
          setShowFindReplace(true);
        }
      }
      // Ctrl+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+Shift+S - Save As
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setShowSaveConfirm(true);
      }
      // Ctrl+O - Open
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        setShowOpenConfirm(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.mode]);

  // Block action if not activated
  const requireActivation = (action: () => void) => {
    if (!isActivated) {
      showToast('بەرنامە چالاک نەکراوە', 'error');
      return;
    }
    action();
  };

  // Listen for update status changes from main process
  useEffect(() => {
    if (isElectron && ipcRenderer) {
      const handleUpdateStatus = (_event: any, data: any) => {
        if (data.status === 'available') {
          setUpdateAvailable(true);
        } else if (data.status === 'downloaded' || data.status === 'not-available') {
          setUpdateAvailable(false);
        }
      };
      
      ipcRenderer.on('update-status', handleUpdateStatus);
      
      return () => {
        ipcRenderer.removeListener('update-status', handleUpdateStatus);
      };
    }
  }, []);

  // Sync current file path on mount
  // NOTE: Pending file opening is now handled in App.tsx with confirmation dialog
  useEffect(() => {
    if (isElectron && ipcRenderer) {
      const initializeFromFile = async () => {
        try {
          // Just sync the current path, don't load pending files (handled by App.tsx)
          const savedPath = await ipcRenderer.invoke('get-current-project-path');
          if (savedPath) {
            setCurrentFilePath(savedPath);
          }
        } catch (err) {
          console.log('Failed to initialize from file:', err);
        }
      };
      initializeFromFile();
    }
    
    // Listen for file path changes from App.tsx (when project is loaded via drag/drop or double-click)
    const handleFilePathChanged = (e: CustomEvent) => {
      const filePath = e.detail;
      console.log('[Header] Received project-file-path-changed event:', filePath);
      if (filePath) {
        setCurrentFilePath(filePath);
        console.log('[Header] currentFilePath updated to:', filePath);
      }
    };
    
    window.addEventListener('project-file-path-changed', handleFilePathChanged as EventListener);
    
    return () => {
      window.removeEventListener('project-file-path-changed', handleFilePathChanged as EventListener);
    };
  }, []);

  // Get file name from path
  const getFileName = (filePath: string | null): string => {
    if (!filePath) return t('app.untitled');
    const parts = filePath.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1].replace(/\.(pppro|ppfree|cyr)$/i, '');
  };

  // Update window title based on current file
  useEffect(() => {
    const fileName = getFileName(currentFilePath);
    document.title = `Cyber Report - ${fileName}`;
    
    // Also update Electron window title
    if (isElectron && ipcRenderer) {
      ipcRenderer.invoke('set-window-title', `Cyber Report - ${fileName}`);
    }
  }, [currentFilePath, state.language]);

  // Listen for file opened from Electron (double-click on .pppro file)
  // NOTE: This is now handled in App.tsx with confirmation dialog
  // useEffect removed to prevent duplicate dialogs

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);


  const getModeIcon = (modeId: AppMode) => {
    switch (modeId) {
      case 'photos': return Shield;
      case 'businesscard': return CreditCard;
      case 'invoice': return FileText;
      case 'idphoto': return User;
      case 'resume': return Briefcase;
      case 'qrcode': return QrCode;
      case 'stickers': return Sparkles;
      case 'stamp': return Stamp;
      case 'tasks': return ClipboardList;
      case 'envelope': return Mail;
      default: return ImageIcon;
    }
  };

  const getModeDescription = (modeId: AppMode, lang: 'en' | 'ku' | 'ar') => {
    const descriptions: Record<string, Record<'en' | 'ku' | 'ar', string>> = {
      photos: {
        en: 'Arrange and organize photos and report documents',
        ku: 'ڕێکخستن و ڕێکخستنەوەی وێنەکان و بەڵگەنامەکانی ڕاپۆرت',
        ar: 'ترتيب وتنظيم الصور ومستندات التقارير'
      },
      businesscard: {
        en: 'Design professional business cards',
        ku: 'دیزاینکردنی کارتی بازرگانی پیشەیی',
        ar: 'تصميم بطاقات العمل المهنية'
      },
      invoice: {
        en: 'Create sales invoices',
        ku: 'دروستکردنی پسوڵەی فرۆشتن',
        ar: 'إنشاء فواتير المبيعات'
      },
      idphoto: {
        en: 'Prepare photos for passports and ID cards',
        ku: 'ئامادەکردنی وێنە بۆ پاسپۆرت و ناسنامە',
        ar: 'تجهيز الصور للمعاملات والجوازات'
      },
      resume: {
        en: 'Create modern professional resumes / CVs',
        ku: 'دروستکردنی سیڤی بە شێوازی مۆدێرن',
        ar: 'إنشاء السيرة الذاتية بشكل احترافي'
      },
      qrcode: {
        en: 'Generate custom QR codes',
        ku: 'دروستکردنی QR کۆدی جۆراوجۆر',
        ar: 'توليد رموز الاستجابة السريعة المخصصة'
      },
      stickers: {
        en: 'Design stickers and barcode labels',
        ku: 'دیزاینکردنی ستیکەر بۆ شتومەک و لایبڵ',
        ar: 'تصميم الملصقات وبطاقات الباركود'
      },
      stamp: {
        en: 'Design and customize official company stamps',
        ku: 'دیزاین و دروستکردنی مۆری فەرمی کۆمپانیاکان',
        ar: 'تصميم وتخصيص الأختام الرسمية للشركات'
      },
      tasks: {
        en: 'Organize daily tasks and personal notes',
        ku: 'ڕێکخستنی ئەرکەکان و تێبینییەکان',
        ar: 'تنظيم المهام اليومية والملاحظات الشخصية'
      },
      envelope: {
        en: 'Design mailing envelopes (Coming Soon)',
        ku: 'دیزاینی زەرفی نامە (بەمنزیکانە)',
        ar: 'تصميم أظرف الرسائل (قريباً)'
      }
    };
    return descriptions[modeId]?.[lang] || '';
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const src = await readFileAsDataURL(file);
            dispatch({ type: 'UPDATE_SETTINGS', payload: { logo: src } });
        } catch (error) {
            console.error("Failed to load logo", error);
        }
    }
  };

  // Save to current file (or Save As if no file)
  const handleSave = async () => {
    console.log('=== SAVE STARTED ===');
    
    // Prevent concurrent saves (fixes corruption)
    if (isSavingRef.current) {
      console.log('Save blocked: already saving');
      showToast('پاشەکەوتکردن لە کاردایە، تکایە چاوەڕوانبە', 'warning');
      return;
    }
    
    if (!isActivated) {
      console.log('Save blocked: not activated');
      showToast('بەرنامە چالاک نەکراوە', 'error');
      return;
    }
    
    isSavingRef.current = true;
    
    try {
      const { settings, ...projectDataToSave } = state;
      console.log('Photos count:', projectDataToSave.photos?.length || 0);
      console.log('CardPhotos count:', projectDataToSave.cardPhotos?.length || 0);
      
      console.log('Creating JSON...');
      const projectJson = JSON.stringify(projectDataToSave);
      console.log('JSON size:', (projectJson.length / 1024 / 1024).toFixed(2), 'MB');
      
      console.log('Encrypting...');
      const encryptedContent = await encryptProjectData(projectJson);
      console.log('Encrypted size:', (encryptedContent.length / 1024 / 1024).toFixed(2), 'MB');
      
      if (isElectron && ipcRenderer) {
        const savedPath = currentFilePath || await ipcRenderer.invoke('get-current-project-path');
        console.log('Save path:', savedPath);
        
        if (savedPath) {
          console.log('Saving to file...');
          const result = await ipcRenderer.invoke('save-project', { 
            content: encryptedContent, 
            filePath: savedPath 
          });
          console.log('Save result:', result);
          
          if (result.success) {
            setCurrentFilePath(result.filePath);
            showToast(t('toast.saved'), 'success');
            
            // If autoExportWord is enabled, in Photos mode, and has photos, also export to Word
            if (state.settings.autoExportWord && state.mode === 'photos' && state.photos.length > 0) {
              try {
                const { exportPhotosToWord } = await import('../../utils/exportToWord');
                const wordBlob = await exportPhotosToWord(state);
                
                // Get the directory and base name from the saved file
                const ppproPath = result.filePath;
                const lastSlash = Math.max(ppproPath.lastIndexOf('/'), ppproPath.lastIndexOf('\\'));
                const directory = ppproPath.substring(0, lastSlash);
                const fileName = ppproPath.substring(lastSlash + 1).replace(/\.(pppro|ppfree|cyr)$/i, '');
                const wordPath = `${directory}\\${fileName}.docx`;
                
                // Convert blob to buffer and save
                const arrayBuffer = await wordBlob.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                
                const fs = (window as any).require('fs');
                fs.writeFileSync(wordPath, buffer);
                
                const dotIndex = ppproPath.lastIndexOf('.');
                const ext = dotIndex !== -1 ? ppproPath.substring(dotIndex) : '.cyr';
                showToast(
                  state.language === 'ku' 
                    ? `هەردوو فایلەکە سەیڤ کران (${ext} و .docx)`
                    : `Both files saved (${ext} and .docx)`,
                  'success'
                );
              } catch (wordErr) {
                console.error('Word export failed:', wordErr);
                // Don't show error, the main .pppro file was saved successfully
              }
            }
          } else {
            console.error('Save failed:', result.error);
            showToast(t('toast.saveFailed') + ': ' + (result.error || 'Unknown error'), 'error');
          }
        } else {
          console.log('No path, doing Save As...');
          await handleSaveAs();
        }
      } else {
        await handleSaveAs();
      }
    } catch (err) {
      console.error('Save error:', err);
      showToast(t('toast.saveFailed') + ': ' + (err as Error).message, 'error');
    } finally {
      isSavingRef.current = false;
    }
    
    console.log('=== SAVE ENDED ===');
  };

  // Save As (always show dialog)
  const handleSaveAs = async () => {
      if (!isActivated) {
        showToast('بەرنامە چالاک نەکراوە', 'error');
        return;
      }
      
      const { settings, ...projectDataToSave } = state;
      const projectJson = JSON.stringify(projectDataToSave);
      try {
          const encryptedContent = await encryptProjectData(projectJson);
          
          if (isElectron && ipcRenderer) {
             // Electron: use native save dialog
             const date = new Date().toISOString().split('T')[0];
             const result = await ipcRenderer.invoke('save-project-as', { 
               content: encryptedContent, 
               defaultName: `project-${date}.cyr` 
             });
             if (result.success) {
               setCurrentFilePath(result.filePath);
               showToast(t('toast.saved'), 'success');
               
               // If autoExportWord is enabled, in Photos mode, and has photos, also export to Word
               if (state.settings.autoExportWord && state.mode === 'photos' && state.photos.length > 0) {
                 try {
                   const { exportPhotosToWord } = await import('../../utils/exportToWord');
                   const wordBlob = await exportPhotosToWord(state);
                   
                   // Get the directory and base name from the saved file
                   const ppproPath = result.filePath;
                   const lastSlash = Math.max(ppproPath.lastIndexOf('/'), ppproPath.lastIndexOf('\\'));
                   const directory = ppproPath.substring(0, lastSlash);
                   const fileName = ppproPath.substring(lastSlash + 1).replace(/\.(pppro|ppfree|cyr)$/i, '');
                   const wordPath = `${directory}\\${fileName}.docx`;
                   
                   // Convert blob to buffer and save
                   const arrayBuffer = await wordBlob.arrayBuffer();
                   const buffer = Buffer.from(arrayBuffer);
                   
                   const fs = (window as any).require('fs');
                   fs.writeFileSync(wordPath, buffer);
                   
                   const dotIndex = ppproPath.lastIndexOf('.');
                   const ext = dotIndex !== -1 ? ppproPath.substring(dotIndex) : '.cyr';
                   showToast(
                     state.language === 'ku' 
                       ? `هەردوو فایلەکە سەیڤ کران (${ext} و .docx)`
                       : `Both files saved (${ext} and .docx)`,
                     'success'
                   );
                 } catch (wordErr) {
                   console.error('Word export failed:', wordErr);
                   // Don't show error, the main file was saved successfully
                 }
               }
             } else if (!result.canceled) {
               showToast(t('toast.saveFailed'), 'error');
             }
          } else {
            // Browser: download file
             const blob = new Blob([encryptedContent], { type: 'application/octet-stream' });
             const url = URL.createObjectURL(blob);
             const link = document.createElement('a');
             const date = new Date().toISOString().split('T')[0];
             link.href = url;
             link.download = `project-${date}.cyr`;
             link.click();
             URL.revokeObjectURL(url);
             
             // If autoExportWord is enabled, in Photos mode, and has photos, also export to Word
             if (state.settings.autoExportWord && state.mode === 'photos' && state.photos.length > 0) {
               try {
                 const { exportPhotosToWord } = await import('../../utils/exportToWord');
                 const wordBlob = await exportPhotosToWord(state);
                 const wordUrl = URL.createObjectURL(wordBlob);
                 const wordLink = document.createElement('a');
                 wordLink.href = wordUrl;
                 wordLink.download = `project-${date}.docx`;
                 wordLink.click();
                 URL.revokeObjectURL(wordUrl);
                 
                 showToast(
                   state.language === 'ku' 
                     ? 'هەردوو فایلەکە دابەزێنران (.ppfree و .docx)'
                     : 'Both files downloaded (.ppfree and .docx)',
                   'success'
                 );
               } catch (wordErr) {
                 console.error('Word export failed:', wordErr);
                 showToast(t('toast.saved'), 'success');
               }
             } else {
               showToast(t('toast.saved'), 'success');
             }
          }
      } catch (err) {
          showToast(t('toast.saveFailed'), 'error');
      }
  };

  const handleOpenProject = async (e?: React.ChangeEvent<HTMLInputElement>) => {
      console.log('=== OPEN PROJECT STARTED ===');
      
      if (!isActivated) {
        showToast('بەرنامە چالاک نەکراوە', 'error');
        return;
      }
      
      if (isElectron && ipcRenderer) {
        try {
          const result = await ipcRenderer.invoke('open-project-dialog');
          console.log('Open dialog result:', result.success, 'Content length:', result.content?.length);
          
          if (result.success && result.content && result.filePath) {
            console.log('Decrypting...');
            const decryptedJson = await decryptProjectData(result.content);
            console.log('Decrypted length:', decryptedJson?.length);
            
            const parsed = JSON.parse(decryptedJson);
            console.log('Parsed photos:', parsed.photos?.length, 'cardPhotos:', parsed.cardPhotos?.length);
            
            if (parsed && typeof parsed === 'object') {
              dispatch({ type: 'LOAD_PROJECT', payload: parsed });
              setCurrentFilePath(result.filePath);
              ipcRenderer.invoke('set-current-project-path', result.filePath);
              showToast(t('toast.projectOpened'), 'success');
              console.log('Project loaded successfully');
            }
          }
        } catch (err) {
          console.error('Open project error:', err);
          showToast(t('toast.openFailed'), 'error');
        }
      } else {
        const file = e?.target?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const encryptedContent = event.target?.result as string;
                console.log('File content length:', encryptedContent?.length);
                const decryptedJson = await decryptProjectData(encryptedContent);
                console.log('Decrypted length:', decryptedJson?.length);
                const parsed = JSON.parse(decryptedJson);
                if (parsed && typeof parsed === 'object') {
                    dispatch({ type: 'LOAD_PROJECT', payload: parsed });
                    showToast(t('toast.projectOpened'), 'success');
                }
            } catch (err) {
                console.error('Open project error:', err);
                showToast(t('toast.openFailed'), 'error');
            }
        };
        reader.readAsText(file);
        if (e?.target) e.target.value = '';
      }
      
      console.log('=== OPEN PROJECT ENDED ===');
  };

  // Auto-save functionality
  const autoSaveRef = useRef<number | null>(null);
  
  const performAutoSave = useCallback(async () => {
    // Prevent concurrent saves with manual save (fixes corruption)
    if (isSavingRef.current) {
      console.log('Auto-save skipped: manual save in progress');
      return;
    }
    
    // Only auto-save if there's a current file path (project has been saved before)
    const savedPath = currentFilePath || (isElectron && ipcRenderer ? await ipcRenderer.invoke('get-current-project-path') : null);
    
    if (!savedPath) return; // Don't auto-save if no file exists yet
    
    isSavingRef.current = true;
    
    const { settings, ...projectDataToSave } = state;
    const projectJson = JSON.stringify(projectDataToSave);
    
    try {
      const encryptedContent = await encryptProjectData(projectJson);
      
      if (isElectron && ipcRenderer) {
        const result = await ipcRenderer.invoke('save-project', { 
          content: encryptedContent, 
          filePath: savedPath 
        });
        if (result.success) {
          showToast(t('toast.autoSaved'), 'info');
        } else {
          console.error('Auto-save failed:', result.error);
        }
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      isSavingRef.current = false;
    }
  }, [state, currentFilePath, showToast, t]);

  useEffect(() => {
    // Clear existing interval
    if (autoSaveRef.current !== null) {
      clearInterval(autoSaveRef.current);
      autoSaveRef.current = null;
    }
    
    // Set up new interval if auto-save is enabled
    if (state.settings.autoSaveEnabled && state.settings.autoSaveInterval > 0) {
      const intervalMs = state.settings.autoSaveInterval * 60 * 1000; // Convert minutes to ms
      autoSaveRef.current = window.setInterval(performAutoSave, intervalMs);
    }
    
    return () => {
      if (autoSaveRef.current !== null) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [state.settings.autoSaveEnabled, state.settings.autoSaveInterval, performAutoSave]);

  const getModeContextInfo = () => {
    const isKu = state.language === 'ku';
    const isAr = state.language === 'ar';
    
    switch (state.mode) {
      case 'photos': {
        const count = state.photos.filter(Boolean).length;
        const pages = state.manualPageCount;
        if (isKu) {
          return `${count} وێنە   |   ${pages} پەڕە`;
        } else if (isAr) {
          const pageWord = pages === 1 ? 'صفحة' : pages === 2 ? 'صفحتان' : pages <= 10 ? 'صفحات' : 'صفحة';
          return `${count} صورة   |   ${pages} ${pageWord}`;
        } else {
          return `${count} Photo${count !== 1 ? 's' : ''}   |   ${pages} Page${pages !== 1 ? 's' : ''}`;
        }
      }
      case 'idphoto': {
        const count = state.idPhotos.filter(Boolean).length;
        return isKu ? `${count} وێنە` : isAr ? `${count} صورة` : `${count} Photo${count !== 1 ? 's' : ''}`;
      }
      case 'invoice': {
        const count = state.invoicePhotos.filter(Boolean).length;
        const pages = Math.ceil(Math.max(0, ((state.settings.invoiceEndNumber ?? 100) - (state.settings.invoiceStartNumber ?? 1) + 1)) / 2);
        if (isKu) {
          return `${count} پسوڵە   |   ${pages} پەڕە`;
        } else if (isAr) {
          const pageWord = pages === 1 ? 'صفحة' : pages === 2 ? 'صفحتان' : pages <= 10 ? 'صفحات' : 'صفحة';
          return `${count} فاتورة   |   ${pages} ${pageWord}`;
        } else {
          return `${count} Invoice${count !== 1 ? 's' : ''}   |   ${pages} Page${pages !== 1 ? 's' : ''}`;
        }
      }
      case 'businesscard':
        return isKu ? 'کارت' : isAr ? 'بطاقة' : 'Card';
      case 'resume':
        return isKu ? 'سیڤی' : isAr ? 'سيرة ذاتية' : 'CV / Resume';
      case 'qrcode':
        return isKu ? 'کۆد' : isAr ? 'رمز' : 'QR Code';
      case 'stickers':
        return isKu ? 'ستیکەر' : isAr ? 'ملصق' : 'Stickers';
      case 'tasks':
        return isKu ? 'ئەرکەکان' : isAr ? 'مهام' : 'Tasks';
      default:
        return '';
    }
  };

  return (
    <header className="h-14 bg-background/95 backdrop-blur-md border-b border-border/80 flex items-center justify-between px-4 no-print sticky top-0 z-50 transition-colors duration-200" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      
      {/* Logo + Mode Switcher */}
      <div className="flex items-center gap-3 h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="w-9 h-9 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all hover:scale-105 duration-200">
          <img src={faviconUrl} alt="Logo" className="w-full h-full object-contain" />
        </div>
        
        <div className="w-px h-5 bg-border/80 mx-1" />
        
        {/* Active Mode Badge */}
        <div className="h-9 px-3.5 bg-zinc-100/90 dark:bg-zinc-800/80 text-foreground rounded-lg border border-border/80 flex items-center gap-2 font-bold text-xs select-none shadow-sm">
          {React.createElement(getModeIcon(state.mode), { size: 15, className: "text-foreground/80" })}
          <span>{t(`nav.${state.mode}`)}</span>
        </div>
      </div>

      {/* Center: Current Project Hub */}
      <div 
        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-background dark:bg-background/40 border border-border rounded-full text-[10px] select-none shadow-sm" 
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Project Name Capsule */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-secondary dark:bg-secondary/80 border border-border rounded-full font-bold text-foreground max-w-[140px] shadow-sm">
          <FileText size={11} className="text-muted-foreground shrink-0" />
          <span className="truncate" title={currentFilePath || undefined}>
            {getFileName(currentFilePath)}
          </span>
        </div>
        
        {/* Photos Mode Stats */}
        {state.mode === 'photos' && (
          <>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-secondary/50 dark:bg-secondary/30 border border-border/80 rounded-full font-bold text-muted-foreground">
              <ImageIcon size={11} className="shrink-0 text-muted-foreground" />
              <span>
                {state.photos.filter(Boolean).length} {state.language === 'ku' ? 'وێنە' : state.language === 'ar' ? 'صورة' : 'Photos'}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-secondary/50 dark:bg-secondary/30 border border-border/80 rounded-full font-bold text-muted-foreground">
              <Layers size={11} className="shrink-0 text-muted-foreground" />
              <span>
                {getTotalPagesCount(state)} {state.language === 'ku' ? 'پەڕە' : state.language === 'ar' ? 'صفحة' : 'Pages'}
              </span>
            </div>
          </>
        )}

        {/* Invoice Mode Stats */}
        {state.mode === 'invoice' && (
          <>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-secondary/50 dark:bg-secondary/30 border border-border/80 rounded-full font-bold text-muted-foreground">
              {React.createElement(getModeIcon('invoice'), { size: 11, className: "shrink-0 text-muted-foreground" })}
              <span>
                {state.invoicePhotos.filter(Boolean).length} {state.language === 'ku' ? 'پسوڵە' : state.language === 'ar' ? 'فاتورة' : 'Invoices'}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-secondary/50 dark:bg-secondary/30 border border-border/80 rounded-full font-bold text-muted-foreground">
              <Layers size={11} className="shrink-0 text-muted-foreground" />
              <span>
                {getTotalPagesCount(state)} {state.language === 'ku' ? 'پەڕە' : state.language === 'ar' ? 'صفحة' : 'Pages'}
              </span>
            </div>
          </>
        )}

        {/* Other Modes Stats */}
        {state.mode !== 'photos' && state.mode !== 'invoice' && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-secondary/50 dark:bg-secondary/30 border border-border/80 rounded-full font-bold text-muted-foreground">
            {React.createElement(getModeIcon(state.mode), { size: 11, className: "shrink-0 text-muted-foreground" })}
            <span>{getModeContextInfo()}</span>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center justify-center pl-1 rtl:pl-0 rtl:pr-1 shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" title={state.language === 'ku' ? 'پەیوەستکراو / سەیڤ کراوە' : 'Connected / Saved'}></span>
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>

        {/* File Operations Group */}
        <div className="flex items-center bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-0.5 shadow-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSave} 
            title={t('action.save')} 
            className="h-8 w-8 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-700/60 hover:text-foreground text-muted-foreground transition-all duration-200 focus:outline-none"
          >
            <Save size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowSaveConfirm(true)} 
            title={t('action.saveAs')} 
            className="h-8 w-8 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-700/60 hover:text-foreground text-muted-foreground transition-all duration-200 focus:outline-none"
          >
            <SaveAll size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowOpenConfirm(true)} 
            title={t('action.openProject')} 
            className="h-8 w-8 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-700/60 hover:text-foreground text-muted-foreground transition-all duration-200 relative focus:outline-none"
          >
            <FolderOpen size={16} />
             {!isElectron && <input type="file" ref={fileInputRef} className="hidden" accept=".cyr,.ppfree,.pppro" onChange={handleOpenProject} />}
          </Button>
        </div>

        {/* Utility Tools Group */}
        <div className="flex items-center bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-0.5 shadow-sm">
          {state.mode === 'photos' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowFindReplace(true)} 
              title={t('findReplace.title')} 
              className="h-8 w-8 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-700/60 hover:text-foreground text-muted-foreground transition-all duration-200 focus:outline-none"
            >
              <Search size={16} />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowClearConfirm(true)} 
            title={t('action.clear')} 
            className="h-8 w-8 rounded-lg hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-all duration-200 focus:outline-none"
          >
            <Eraser size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowUpdateModal(true)} 
            title={t('action.checkUpdates')} 
            className="h-8 w-8 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-700/60 hover:text-foreground text-muted-foreground transition-all duration-200 relative focus:outline-none"
          >
            <Download size={16} />
            {updateAvailable && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>
        </div>

        <div className="w-px h-5 bg-border/85 mx-0.5" />

        {/* Print Button */}
        <Button 
          variant="default" 
          size="sm" 
          onClick={onPrintClick} 
          title={t('action.print')} 
          className="h-9 gap-1.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none shrink-0"
        >
          <Printer size={16} />
          <span className="text-xs font-bold">{t('action.print')}</span>
        </Button>

        {/* Settings */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowSettings(!showSettings)} 
            className="h-9 w-9 bg-zinc-50/60 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 focus:outline-none shadow-sm"
          >
            <Settings size={16} className="hover:rotate-45 transition-transform duration-300" />
          </Button>
        </div>
      </div>

      {/* Settings Panel - Fixed position under header */}
      {showSettings && ReactDOM.createPortal(
        <div ref={settingsRef} className={`fixed top-16 z-[9999] w-[380px] bg-popover rounded-lg shadow-xl border border-border overflow-hidden flex flex-col max-h-[75vh] animate-fade-in ${state.language === 'ku' ? 'left-4 font-kufi' : 'right-4'}`} dir={state.language === 'ku' ? 'rtl' : 'ltr'}>
                    
                    {/* Settings Header */}
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Settings size={16} className="text-muted-foreground" />
                            <span className="font-medium text-sm">{t('nav.settings')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 p-0.5 bg-muted rounded-md">
                                <button onClick={() => dispatch({ type: 'TOGGLE_THEME' })} className={`p-1.5 rounded-sm transition-all ${state.theme === 'light' ? 'bg-background shadow-sm' : ''}`}>
                                    <Sun size={14} className={state.theme === 'light' ? 'text-foreground' : 'text-muted-foreground'} />
                                </button>
                                <button onClick={() => dispatch({ type: 'TOGGLE_THEME' })} className={`p-1.5 rounded-sm transition-all ${state.theme === 'dark' ? 'bg-background shadow-sm' : ''}`}>
                                    <Moon size={14} className={state.theme === 'dark' ? 'text-foreground' : 'text-muted-foreground'} />
                                </button>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="p-1 rounded hover:bg-accent transition-colors"><X size={14} /></button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-border">
                        {[
                            { id: 'general', label: t('settings.general'), icon: Laptop },
                            { id: 'visibility', label: t('settings.visibility'), icon: Eye },
                            { id: 'branding', label: t('settings.branding'), icon: Palette },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-all border-b-2 -mb-px ${
                                    activeTab === tab.id 
                                    ? 'border-foreground text-foreground' 
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        
                        {activeTab === 'general' && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Language */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Languages size={12} /> {t('settings.language')}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['en', 'ku'].map((lang) => (
                                            <button 
                                                key={lang}
                                                onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: lang as any })}
                                                className={`px-3 py-2 rounded-md border text-sm font-medium flex items-center justify-between transition-all ${state.language === lang ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/50'}`}
                                            >
                                                <span className={lang === 'ku' ? 'font-kufi' : ''}>{lang === 'en' ? 'English' : 'کوردی'}</span>
                                                {state.language === lang && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Typography */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Type size={12} /> {t('settings.typography')}
                                    </label>
                                    
                                    {/* Default Font Selection */}
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-muted-foreground">{t('settings.defaultFont')}</span>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'Inter', label: 'Inter', sample: 'Aa' },
                                                { id: 'Noto Kufi Arabic', label: 'کوفی', sample: 'ئا' },
                                                { id: 'Noto Naskh Arabic', label: 'نەسخ', sample: 'ئا' },
                                            ].map((font) => (
                                                <button
                                                    key={font.id}
                                                    onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { defaultFontFamily: font.id } })}
                                                    className={`px-2 py-2 rounded-md border text-sm font-medium flex flex-col items-center justify-center gap-1 transition-all ${state.settings.defaultFontFamily === font.id ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/50'}`}
                                                    style={{ fontFamily: font.id }}
                                                >
                                                    <span className="text-lg">{font.sample}</span>
                                                    <span className="text-[9px] text-muted-foreground">{font.label}</span>
                                                    {state.settings.defaultFontFamily === font.id && <Check size={12} className="absolute top-1 right-1" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-muted-foreground">{t('settings.titleFont')}</span>
                                            <Input type="number" value={state.settings.defaultTitleFontSize} onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { defaultTitleFontSize: parseInt(e.target.value) || 20 } })} />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-muted-foreground">{t('settings.textFont')}</span>
                                            <Input type="number" value={state.settings.defaultTextFontSize} onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { defaultTextFontSize: parseInt(e.target.value) || 16 } })} />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Section Size */}
                                <div className="p-3 rounded-md border border-border space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Layers size={12} /> {t('settings.sectionView')}
                                    </label>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-medium">{t('settings.pagesPerSection')}</span>
                                            <p className="text-[10px] text-muted-foreground">{t('settings.pagesPerSectionDesc')}</p>
                                        </div>
                                        <Input type="number" min={1} value={state.settings.sectionSize || 1} onChange={(e) => { dispatch({ type: 'UPDATE_SETTINGS', payload: { sectionSize: Math.max(1, parseInt(e.target.value) || 1) } }); dispatch({ type: 'SET_SECTION_INDEX', payload: 0 }); }} className="w-16 text-center" />
                                    </div>
                                </div>
                                
                                {/* Auto Save */}
                                <div className="p-3 rounded-md border border-border space-y-3">
                                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Timer size={12} /> {t('settings.autoSave')}
                                    </label>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-medium">{t('settings.autoSaveEnabled')}</span>
                                            <p className="text-[10px] text-muted-foreground">{t('settings.autoSaveDesc')}</p>
                                        </div>
                                        <button 
                                            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { autoSaveEnabled: !state.settings.autoSaveEnabled } })}
                                            className={`w-10 h-6 rounded-full transition-all ${state.settings.autoSaveEnabled ? 'bg-foreground' : 'bg-muted'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-background shadow-sm transition-transform mx-1 ${state.settings.autoSaveEnabled ? (state.language === 'ku' ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    {state.settings.autoSaveEnabled && (
                                        <div className="flex items-center justify-between pt-2 border-t border-border">
                                            <span className="text-sm">{t('settings.autoSaveInterval')}</span>
                                            <Input 
                                                type="number" 
                                                min={1} 
                                                max={60}
                                                value={state.settings.autoSaveInterval || 5} 
                                                onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { autoSaveInterval: Math.max(1, Math.min(60, parseInt(e.target.value) || 5)) } })} 
                                                className="w-16 text-center" 
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Auto Export to Word */}
                                <div className="p-3 rounded-md border border-border space-y-3">
                                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Download size={12} /> {state.language === 'ku' ? 'ئێکسپۆرتی خۆکار بۆ Word' : 'Auto Export to Word'}
                                    </label>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-medium">{state.language === 'ku' ? 'چالاککردنی ئێکسپۆرتی Word' : 'Enable Word Export'}</span>
                                            <p className="text-[10px] text-muted-foreground">{state.language === 'ku' ? 'لە کاتی سەیڤ کردن لە مۆدی فۆتۆ، فایلی Word دروست دەکات' : 'Auto-export to Word document when saving in Photos mode'}</p>
                                        </div>
                                        <button 
                                            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { autoExportWord: !state.settings.autoExportWord } })}
                                            className={`w-10 h-6 rounded-full transition-all ${state.settings.autoExportWord ? 'bg-foreground' : 'bg-muted'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-background shadow-sm transition-transform mx-1 ${state.settings.autoExportWord ? (state.language === 'ku' ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'visibility' && (
                            <div className="space-y-3 animate-fade-in">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Eye size={12} /> {t('settings.componentVisibility')}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: t('setting.showHeader'), key: 'showTitle' },
                                        { label: t('setting.showFooter'), key: 'showFooter' },
                                        { label: t('setting.showBadges'), key: 'showPhotoBadges' },
                                        { label: t('setting.showPageNum'), key: 'showPageNumber' },
                                        { label: t('setting.showDate'), key: 'showDateUser' },
                                        { label: t('setting.showLogo'), key: 'showLogo' },
                                    ].map((item) => (
                                        <button 
                                            key={item.key} 
                                            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { [item.key]: !state.settings[item.key as keyof typeof state.settings] } })}
                                            className={`p-2 rounded-md border transition-all flex items-center justify-between ${state.settings[item.key as keyof typeof state.settings] ? 'border-foreground bg-accent' : 'border-border hover:border-foreground/50'}`}
                                        >
                                            <span className="text-xs font-medium truncate">{item.label}</span>
                                            <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border shrink-0 ${state.settings[item.key as keyof typeof state.settings] ? 'bg-foreground border-foreground' : 'border-muted-foreground'}`}>
                                                {state.settings[item.key as keyof typeof state.settings] && <Check size={10} className="text-background" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Start Page Number */}
                                {state.settings.showPageNumber && (
                                    <div className="p-2.5 rounded-md border border-border">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-medium">{t('setting.startPageNum')}</span>
                                            <Input 
                                                type="number" 
                                                min={1} 
                                                value={state.settings.startPageNumber || 1} 
                                                onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { startPageNumber: Math.max(1, parseInt(e.target.value) || 1) } })} 
                                                className="w-16 text-center text-sm h-7" 
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Page Margins */}
                                <div className="p-3 rounded-md border border-border space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">{state.language === 'ku' ? 'مارجینی پەڕە (mm)' : 'Page Margins (mm)'}</label>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={handleResetMargins}
                                            className="h-7 px-2 text-xs"
                                        >
                                            <ArrowLeftRight size={12} className="mr-1" />
                                            {state.language === 'ku' ? 'ڕیسێت' : 'Reset'}
                                        </Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        {['top', 'right', 'bottom', 'left'].map((side) => (
                                            <div key={side} className="space-y-1">
                                                <span className="text-xs text-muted-foreground">
                                                    {state.language === 'ku' 
                                                        ? { top: 'سەرەوە', right: 'ڕاست', bottom: 'خوارەوە', left: 'چەپ' }[side]
                                                        : { top: 'Top', right: 'Right', bottom: 'Bottom', left: 'Left' }[side]
                                                    }
                                                </span>
                                                <Input 
                                                    type="text" 
                                                    inputMode="numeric"
                                                    value={(state.settings[`margin${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof typeof state.settings] as any) ?? 0} 
                                                    onChange={(e) => {
                                                        const normalized = normalizeNumber(e.target.value);
                                                        const num = parseInt(normalized) || 0;
                                                        dispatch({ 
                                                            type: 'UPDATE_SETTINGS', 
                                                            payload: { [`margin${side.charAt(0).toUpperCase() + side.slice(1)}`]: Math.max(0, Math.min(50, num)) } 
                                                        });
                                                    }}
                                                    className="w-full text-center text-sm h-8" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="text-[10px] text-muted-foreground text-center pt-1 border-t border-border">
                                        {state.language === 'ku' ? 'بنەڕەت: سەرەوە=4، هەموو لایەکانی تر=3' : 'Base: Top=4, All others=3'}
                                    </div>
                                </div>

                            </div>
                        )}

                        {activeTab === 'branding' && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Brand Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <User size={12} /> {t('settings.identity')}
                                    </label>
                                    <Input value={state.settings.userName} onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { userName: e.target.value } })} placeholder={t('settings.brandName')} />
                                </div>
                                
                                {/* Footer Date */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground block">
                                        {t('settings.footerDate')}
                                    </label>
                                    <div className="relative">
                                        <Input 
                                            type="date" 
                                            value={(() => {
                                                const [day, month, year] = state.settings.footerDate.split('/');
                                                return `${year}-${month}-${day}`;
                                            })()}
                                            onChange={(e) => {
                                                const dateValue = e.target.value;
                                                if (dateValue) {
                                                    const [year, month, day] = dateValue.split('-');
                                                    const formattedDate = `${day}/${month}/${year}`;
                                                    dispatch({ type: 'UPDATE_SETTINGS', payload: { footerDate: formattedDate } });
                                                }
                                            }}
                                            className="footer-date-input text-sm w-full pr-9"
                                        />
                                        <Calendar size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground shrink-0" />
                                    </div>
                                </div>
                                
                                {/* Accent Color */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">{t('settings.accentColor')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['#18181b', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                                            <button key={color} onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { badgeColor: color } })} className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-105 flex items-center justify-center ${state.settings.badgeColor === color ? 'border-foreground ring-2 ring-foreground/20' : 'border-transparent'}`} style={{ backgroundColor: color }}>
                                                {state.settings.badgeColor === color && <Check size={14} className="text-white" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Logo */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-muted-foreground">{t('settings.logoAsset')}</label>
                                        <label className="cursor-pointer">
                                            <Button variant="outline" size="sm" asChild><span><ImageIcon size={14} /> {state.settings.logo ? t('btn.change') : t('btn.upload')}</span></Button>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                        </label>
                                    </div>
                                    {state.settings.logo && (
                                        <div className="p-3 rounded-md border border-border space-y-3">
                                            <img src={state.settings.logo} alt="Logo" className="max-h-16 object-contain mx-auto" style={{ transform: `scale(${state.settings.logoScale || 1})` }} />
                                            <div className="flex items-center gap-2">
                                                <Scaling size={12} className="text-muted-foreground" />
                                                <input type="range" min="0.5" max="2" step="0.1" value={state.settings.logoScale || 1} onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { logoScale: parseFloat(e.target.value) } })} className="flex-1" />
                                                <span className="text-xs text-muted-foreground w-10">{Math.round((state.settings.logoScale || 1) * 100)}%</span>
                                            </div>
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { logo: null } })}><Trash2 size={14} /> {t('btn.remove')}</Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
      , document.body)}

      {/* Save As Confirm Modal */}
      {showSaveConfirm && ReactDOM.createPortal(
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in ${state.language === 'ku' ? 'font-kufi' : ''}`} dir={state.language === 'ku' ? 'rtl' : 'ltr'}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowSaveConfirm(false)} />
          <Card className="relative w-full max-w-sm animate-slide-up">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('confirm.saveAsTitle')}</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSaveConfirm(false)}><X size={16} /></Button>
              </div>
              <CardDescription>{t('confirm.saveAsDesc')}</CardDescription>
            </CardHeader>
            <CardFooter className="gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowSaveConfirm(false)}>{t('action.cancel')}</Button>
              <Button className="flex-1" onClick={() => { handleSaveAs(); setShowSaveConfirm(false); }}>{t('action.save')}</Button>
            </CardFooter>
          </Card>
        </div>
      , document.body)}

      {/* Open Confirm Modal */}
      {showOpenConfirm && ReactDOM.createPortal(
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in ${state.language === 'ku' ? 'font-kufi' : ''}`} dir={state.language === 'ku' ? 'rtl' : 'ltr'}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowOpenConfirm(false)} />
          <Card className="relative w-full max-w-sm animate-slide-up">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('confirm.openTitle')}</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowOpenConfirm(false)}><X size={16} /></Button>
              </div>
              <CardDescription>{t('confirm.openDesc')}</CardDescription>
            </CardHeader>
            <CardFooter className="gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowOpenConfirm(false)}>{t('action.cancel')}</Button>
              <Button variant="secondary" className="flex-1" onClick={async () => { 
                await handleSave();
                if (isElectron) {
                  handleOpenProject(); 
                } else {
                  fileInputRef.current?.click();
                }
                setShowOpenConfirm(false); 
              }}>{state.language === 'ku' ? 'سەیڤ و کردنەوە' : 'Save & Open'}</Button>
              <Button className="flex-1" onClick={() => { 
                if (isElectron) {
                  handleOpenProject(); 
                } else {
                  fileInputRef.current?.click();
                }
                setShowOpenConfirm(false); 
              }}>{t('confirm.open')}</Button>
            </CardFooter>
          </Card>
        </div>
      , document.body)}

      {/* Clear Confirm Modal */}
      {showClearConfirm && ReactDOM.createPortal(
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in ${state.language === 'ku' ? 'font-kufi' : ''}`} dir={state.language === 'ku' ? 'rtl' : 'ltr'}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowClearConfirm(false)} />
          <Card className="relative w-full max-w-sm animate-slide-up">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('confirm.clearTitle')}</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowClearConfirm(false)}><X size={16} /></Button>
              </div>
              <CardDescription>{t('confirm.clearDesc')}</CardDescription>
            </CardHeader>
            <CardFooter className="gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowClearConfirm(false)}>{t('action.cancel')}</Button>
              <Button variant="destructive" className="flex-1" onClick={() => { 
                dispatch({ type: 'CLEAR_ALL' }); 
                // Reset file path - this is a new project now
                setCurrentFilePath(null);
                if (isElectron && ipcRenderer) {
                  ipcRenderer.invoke('set-current-project-path', null);
                }
                showToast(t('toast.cleared'), 'success');
                setShowClearConfirm(false); 
              }}>{t('action.clear')}</Button>
            </CardFooter>
          </Card>
        </div>
      , document.body)}

      {/* Find & Replace Modal */}
      <FindReplaceModal isOpen={showFindReplace} onClose={() => setShowFindReplace(false)} />

      {/* Update Modal */}
      <UpdateModal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} language={state.language === 'ku' ? 'ku' : 'en'} />

      {/* Custom Update Toast Notification - Shadcn Style (Black & White) */}
      {updateToastData && (
        <div 
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down"
          dir={state.language === 'ku' ? 'rtl' : 'ltr'}
        >
          <div className={`bg-background border border-border rounded-lg shadow-lg flex items-start gap-3 p-4 min-w-[400px] max-w-[90vw] backdrop-blur-sm ${state.language === 'ku' ? 'font-kufi' : ''}`}>
            {/* Icon */}
            <div className="flex-shrink-0 w-9 h-9 bg-foreground/10 rounded-full flex items-center justify-center mt-0.5">
              <Download size={18} className="text-foreground" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="font-semibold text-sm text-foreground mb-1">
                {state.language === 'ku' ? 'نوێکردنەوەی نوێ بەردەستە' : 'New Update Available'}
              </div>
              <div className="text-sm text-muted-foreground">
                {state.language === 'ku' 
                  ? `وەشانی ${updateToastData.version} ئامادەیە بۆ دابەزاندن`
                  : `Version ${updateToastData.version} is ready to download`
                }
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setUpdateToastData(null);
                  setShowUpdateModal(true);
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-foreground text-background hover:bg-foreground/90 h-9 px-4 transition-colors"
              >
                {state.language === 'ku' ? 'باشە' : 'OK'}
              </button>
              <button
                onClick={() => setUpdateToastData(null)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-9 w-9 transition-colors"
                title={state.language === 'ku' ? 'داخستن' : 'Close'}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
