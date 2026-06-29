import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, Download, RefreshCw, CheckCircle, AlertCircle, Loader2, Rocket } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';

interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  message?: string;
  messageEn?: string;
  version?: string;
  percent?: number;
  error?: string;
  speed?: string;
  transferred?: string;
  total?: string;
}

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'ku' | 'en';
}

const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose, language = 'ku' }) => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ status: 'idle' });
  const [appVersion, setAppVersion] = useState<string>('');
  const isKurdish = language === 'ku';

  const t = {
    title: isKurdish ? 'نوێکردنەوەی بەرنامە' : 'App Updates',
    currentVersion: isKurdish ? 'وەشانی ئێستا' : 'Current Version',
    checkForUpdates: isKurdish ? 'گەڕان بۆ نوێکردنەوە' : 'Check for Updates',
    download: isKurdish ? 'داگرتن' : 'Download Update',
    downloading: isKurdish ? 'داگرتن...' : 'Downloading...',
    installAndRestart: isKurdish ? 'دامەزراندن' : 'Install & Restart',
    upToDate: isKurdish ? 'بەرنامەکەت نوێترینە' : 'You\'re up to date!',
    updateAvailable: isKurdish ? 'نوێکردنەوەی نوێ بەردەستە' : 'New update available',
    clickToCheck: isKurdish ? 'کلیک بکە بۆ گەڕان بۆ نوێکردنەوە' : 'Click to check for updates',
    checking: isKurdish ? 'گەڕان...' : 'Checking...',
    readyToInstall: isKurdish ? 'ئامادەیە بۆ دامەزراندن' : 'Ready to install',
    error: isKurdish ? 'هەڵەیەک ڕوویدا' : 'An error occurred',
  };

  useEffect(() => {
    const getVersion = async () => {
      try {
        if (window && (window as any).process?.type === 'renderer') {
          const { ipcRenderer } = (window as any).require('electron');
          const version = await ipcRenderer.invoke('get-app-version');
          setAppVersion(version);
        }
      } catch (err) {
        console.error('Failed to get app version:', err);
        setAppVersion('N/A');
      }
    };
    getVersion();
  }, []);

  useEffect(() => {
    if (window && (window as any).process?.type === 'renderer') {
      const { ipcRenderer } = (window as any).require('electron');
      
      const handleUpdateStatus = (_event: any, status: UpdateStatus) => {
        setUpdateStatus(status);
      };

      ipcRenderer.on('update-status', handleUpdateStatus);
      return () => {
        ipcRenderer.removeListener('update-status', handleUpdateStatus);
      };
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    try {
      if (window && (window as any).process?.type === 'renderer') {
        const { ipcRenderer } = (window as any).require('electron');
        setUpdateStatus({ status: 'checking' });
        await ipcRenderer.invoke('check-for-updates');
      }
    } catch (err) {
      console.error('Check for updates failed:', err);
      setUpdateStatus({ 
        status: 'error', 
        message: 'هەڵەیەک ڕوویدا',
        messageEn: 'An error occurred'
      });
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    try {
      if (window && (window as any).process?.type === 'renderer') {
        const { ipcRenderer } = (window as any).require('electron');
        setUpdateStatus({ ...updateStatus, status: 'downloading', percent: 0 });
        await ipcRenderer.invoke('download-update');
      }
    } catch (err) {
      console.error('Download update failed:', err);
    }
  }, [updateStatus]);

  const installUpdate = useCallback(async () => {
    try {
      if (window && (window as any).process?.type === 'renderer') {
        const { ipcRenderer } = (window as any).require('electron');
        await ipcRenderer.invoke('install-update');
      }
    } catch (err) {
      console.error('Install update failed:', err);
    }
  }, []);

  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (updateStatus.status) {
      case 'checking':
        return <Loader2 className="w-6 h-6 text-primary animate-spin" />;
      case 'available':
        return <Download className="w-6 h-6 text-green-500" />;
      case 'downloading':
        return <Loader2 className="w-6 h-6 text-primary animate-spin" />;
      case 'downloaded':
        return <Rocket className="w-6 h-6 text-green-500" />;
      case 'not-available':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-destructive" />;
      default:
        return <RefreshCw className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    switch (updateStatus.status) {
      case 'idle':
        return t.clickToCheck;
      case 'checking':
        return t.checking;
      case 'available':
        return t.updateAvailable;
      case 'downloading':
        return `${t.downloading} ${updateStatus.percent || 0}%`;
      case 'downloaded':
        return t.readyToInstall;
      case 'not-available':
        return t.upToDate;
      case 'error':
        return updateStatus.error || t.error;
      default:
        return '';
    }
  };

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in ${isKurdish ? 'font-kufi' : ''}`}
      dir={isKurdish ? 'rtl' : 'ltr'}
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <Card className="relative w-full max-w-sm animate-slide-up">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                {getStatusIcon()}
              </div>
              <div>
                <CardTitle className="text-base">{t.title}</CardTitle>
                <CardDescription>
                  {t.currentVersion}: <span className="font-mono font-medium text-foreground">{appVersion}</span>
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="text-center py-2">
            <p className={`text-sm ${updateStatus.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
              {getStatusMessage()}
            </p>
            
            {updateStatus.version && (updateStatus.status === 'available' || updateStatus.status === 'downloading' || updateStatus.status === 'downloaded') && (
              <span className="inline-block mt-2 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                v{updateStatus.version}
              </span>
            )}
          </div>

          {/* Progress Bar - Only show during download */}
          {updateStatus.status === 'downloading' && (
            <div className="mt-4 space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${updateStatus.percent || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{updateStatus.percent || 0}%</span>
                {updateStatus.speed && (
                  <span className="font-mono">{updateStatus.speed}</span>
                )}
              </div>
              {updateStatus.transferred && updateStatus.total && (
                <p className="text-xs text-muted-foreground text-center">
                  {updateStatus.transferred} / {updateStatus.total}
                </p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          {/* Download Button - Only show when update is available */}
          {updateStatus.status === 'available' && (
            <Button onClick={downloadUpdate} className="w-full bg-green-600 hover:bg-green-700 text-white">
              <Download size={16} className={isKurdish ? 'ml-2' : 'mr-2'} />
              {t.download}
            </Button>
          )}

          {/* Install Button - Only show when downloaded */}
          {updateStatus.status === 'downloaded' && (
            <Button onClick={installUpdate} className="w-full">
              <Rocket size={16} className={isKurdish ? 'ml-2' : 'mr-2'} />
              {t.installAndRestart}
            </Button>
          )}

          {/* Check for Updates Button */}
          {(updateStatus.status === 'idle' || updateStatus.status === 'not-available' || updateStatus.status === 'error') && (
            <Button onClick={checkForUpdates} className="w-full">
              <RefreshCw size={16} className={isKurdish ? 'ml-2' : 'mr-2'} />
              {t.checkForUpdates}
            </Button>
          )}

          {/* Loading state */}
          {(updateStatus.status === 'checking' || updateStatus.status === 'downloading') && (
            <Button disabled className="w-full">
              <Loader2 size={16} className={`animate-spin ${isKurdish ? 'ml-2' : 'mr-2'}`} />
              {updateStatus.status === 'checking' ? t.checking : t.downloading}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default UpdateModal;
