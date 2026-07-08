import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useApp } from '../../store/AppContext';
import { getTranslation } from '../../utils/translations';
import { generateId } from '../../utils/helpers';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, WifiOff, Smartphone, X, ImagePlus, CheckCircle, Folder, Loader2, Network } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Photo } from '../../types';

interface WirelessTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoReceived?: (photo: Photo) => void;
}

export const WirelessTransferModal: React.FC<WirelessTransferModalProps> = ({ isOpen, onClose, onPhotoReceived }) => {
  const { state, dispatch } = useApp();
  const t = (key: string) => getTranslation(key, state.language);
  const [activeTab, setActiveTab] = useState<'app' | 'folder'>('app');
  const [savePath, setSavePath] = useState('');
  
  // New Network Mode Selection
  const [networkMode, setNetworkMode] = useState<'standard' | 'hotspot' | null>(null);
  
  const [serverRunning, setServerRunning] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [serverIP, setServerIP] = useState('');
  const [serverPort, setServerPort] = useState(0);
  const [hotspotSSID, setHotspotSSID] = useState('');
  const [hotspotPASS, setHotspotPASS] = useState('');
  
  const [receivedCount, setReceivedCount] = useState(0);
  const [error, setError] = useState('');
  const [lastReceivedName, setLastReceivedName] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const listenerRef = useRef<any>(null);

  const isElectron = typeof window !== 'undefined' && (window as any).process?.type === 'renderer';
  const isKurdish = state.language === 'ku' || state.language === 'ar';

  const cleanup = useCallback(() => {
    if (listenerRef.current && isElectron) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.removeListener('wireless-photo-received', listenerRef.current);
      } catch (e) {}
      listenerRef.current = null;
    }
  }, [isElectron]);

  const startServer = useCallback(async (mode: 'standard' | 'hotspot') => {
    if (!isElectron) return;
    setIsStarting(true);
    setError('');
    setNetworkMode(mode);
    setHotspotSSID('');
    setHotspotPASS('');
    
    try {
      const { ipcRenderer } = (window as any).require('electron');
      
      let targetIP = '';
      if (mode === 'hotspot') {
        const hotspotResult = await ipcRenderer.invoke('start-hotspot');
        if (!hotspotResult.success) {
          throw new Error(hotspotResult.error || "Failed to start hotspot");
        }
        setHotspotSSID(hotspotResult.ssid || '');
        setHotspotPASS(hotspotResult.passphrase || '');
        targetIP = hotspotResult.ip || '';
      }

      const result = await ipcRenderer.invoke('start-transfer-server', { mode: activeTab, savePath });
      if (result.success) {
        setServerRunning(true);
        const finalIP = targetIP || result.ip;
        setServerIP(finalIP);
        setServerPort(result.port);
        setServerUrl(`http://${finalIP}:${result.port}`);

        // Listen for incoming photos
        cleanup();
        const handler = (_event: any, data: { src: string; name: string; folder: boolean }) => {
          if (!data.folder) {
            const newPhoto: Photo = {
              id: generateId(),
              name: data.name,
              src: data.src,
              rotation: 0,
              annotations: []
            };
            if (onPhotoReceived) {
              onPhotoReceived(newPhoto);
            } else {
              dispatch({ type: 'ADD_PHOTOS', payload: [newPhoto] });
            }
          }
          setReceivedCount(prev => prev + 1);
          setLastReceivedName(data.name);
        };
        listenerRef.current = handler;
        ipcRenderer.on('wireless-photo-received', handler);
      } else {
        throw new Error(result.error || t('transfer.error'));
      }
    } catch (err: any) {
      setError(err.message || t('transfer.error'));
      // Attempt cleanup if hotspot failed
      if (mode === 'hotspot') {
        try {
          const { ipcRenderer } = (window as any).require('electron');
          await ipcRenderer.invoke('stop-hotspot');
        } catch (e) {}
      }
    } finally {
      setIsStarting(false);
    }
  }, [isElectron, dispatch, t, cleanup, activeTab, savePath]);

  const stopServer = useCallback(async () => {
    if (!isElectron) return;
    try {
      const { ipcRenderer } = (window as any).require('electron');
      await ipcRenderer.invoke('stop-transfer-server');
      if (networkMode === 'hotspot') {
        await ipcRenderer.invoke('stop-hotspot');
      }
    } catch (e) {}
    cleanup();
    setServerRunning(false);
    setServerUrl('');
    setServerIP('');
    setServerPort(0);
    setNetworkMode(null);
  }, [isElectron, cleanup, networkMode]);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleClose = () => {
    stopServer();
    setReceivedCount(0);
    setLastReceivedName('');
    setError('');
    onClose();
  };

  const handleSelectFolder = async () => {
    if (!isElectron) return;
    try {
      const { ipcRenderer } = (window as any).require('electron');
      const path = await ipcRenderer.invoke('select-folder');
      if (path) setSavePath(path);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTabChange = async (tab: 'app' | 'folder') => {
    if (activeTab === tab) return;
    if (serverRunning) {
      await stopServer();
      setReceivedCount(0);
      setLastReceivedName('');
    }
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  const canStart = activeTab === 'app' || (activeTab === 'folder' && savePath);

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in ${isKurdish ? 'font-kufi' : ''}`}
      dir={isKurdish ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      
      <Card className="relative w-full max-w-lg animate-slide-up">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{t('transfer.title')}</CardTitle>
                <CardDescription>
                  {t('transfer.description')}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2" onClick={handleClose}>
              <X size={16} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-3 space-y-4">
          {!serverRunning && !error && !isStarting && (
            <>
              {/* Custom Tabs */}
              <div className="space-y-2 mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  {isKurdish ? 'شوێنی هەڵگرتن' : 'Save Destination'}
                </p>
                <div className="flex bg-muted/80 p-1.5 rounded-lg border border-border/50">
                  <button
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                      activeTab === 'app'
                        ? 'bg-background text-primary shadow-sm ring-1 ring-border/50'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => handleTabChange('app')}
                  >
                    <ImagePlus size={16} />
                    {t('transfer.tab.app')}
                  </button>
                  <button
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                      activeTab === 'folder'
                        ? 'bg-background text-primary shadow-sm ring-1 ring-border/50'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => handleTabChange('folder')}
                  >
                    <Folder size={16} />
                    {t('transfer.tab.folder')}
                  </button>
                </div>
              </div>

              {activeTab === 'folder' && (
                <div className="p-3 border rounded-md border-dashed border-border bg-muted/30 text-center space-y-2 mb-6">
                  <Button onClick={handleSelectFolder} variant={savePath ? "outline" : "default"} size="sm" className="w-full">
                    {savePath ? t('transfer.folderSelected') : t('transfer.selectFolder')}
                  </Button>
                  {savePath && (
                    <p className="text-xs font-mono text-muted-foreground truncate px-1" title={savePath}>
                      {savePath}
                    </p>
                  )}
                </div>
              )}
              
              {/* Network Selection */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  {isKurdish ? 'شێوازی پەیوەندی' : 'Connection Method'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => startServer('standard')} 
                  disabled={!canStart}
                  variant="outline" 
                  className="h-auto flex-col py-4 gap-3 hover:bg-primary/5 hover:border-primary/50"
                >
                  <div className="p-3 bg-muted rounded-full">
                    <Wifi size={24} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm mb-1">{isKurdish ? 'وایەرلێس (ئاسایی)' : 'Wireless (Standard)'}</p>
                    <p className="text-xs text-muted-foreground whitespace-normal">{isKurdish ? 'بەکارھێنانی وایفای ماڵەوە یان ئۆفیس' : 'Use existing Wi-Fi network'}</p>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => startServer('hotspot')} 
                  disabled={!canStart}
                  variant="outline" 
                  className="h-auto flex-col py-4 gap-3 hover:bg-primary/5 hover:border-primary/50"
                >
                  <div className="p-3 bg-muted rounded-full">
                    <Network size={24} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm mb-1">{isKurdish ? 'دروستکردنی هۆتسپۆت' : 'Create Hotspot'}</p>
                    <p className="text-xs text-muted-foreground whitespace-normal">{isKurdish ? 'بەکارھێنان بێ بوونی ئینتەرنێت یان ڕاوتەر' : 'Use without internet or router'}</p>
                  </div>
                </Button>
                </div>
              </div>
            </>
          )}

          {error ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                <WifiOff size={24} className="text-destructive" />
              </div>
              <p className="text-sm text-destructive mb-4 text-start leading-relaxed">{error}</p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => { setError(''); startServer('standard'); }} variant="default" className="w-full">
                  <Wifi size={15} className="mr-2" />
                  {isKurdish ? 'بەکارهێنانی وایەرلێسی ئاسایی' : 'Use Standard Wi-Fi Instead'}
                </Button>
                <Button onClick={() => setError('')} variant="outline" className="w-full">
                  {isKurdish ? 'گەڕانەوە' : 'Go Back'}
                </Button>
              </div>
            </div>
          ) : !serverRunning || isStarting ? (
            isStarting && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Loader2 size={24} className="text-primary animate-spin" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {networkMode === 'hotspot' 
                    ? (isKurdish ? 'ئامادەکردنی هۆتسپۆت...' : 'Starting Hotspot...')
                    : (isKurdish ? 'پێکردنی سێرڤەر...' : 'Starting Server...')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isKurdish ? 'تکایە چاوەڕوان بە، ئەمە چەند چرکەیەک دەخایەنێت' : 'Please wait, this may take a few seconds'}
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center animate-in fade-in duration-300 space-y-4 pt-2">
              
              {networkMode === 'hotspot' ? (
                <div className="w-full flex gap-4">
                  <div className="flex-1 flex flex-col items-center">
                    <div className="bg-white p-2 rounded-xl shadow-sm ring-1 ring-border mb-2">
                      <QRCodeSVG
                        value={`WIFI:T:WPA;S:${hotspotSSID};P:${hotspotPASS};;`}
                        size={130}
                        level="M"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                    <p className="text-xs font-bold mb-1">{isKurdish ? '١. پەیوەستبوون بە وایفای' : '1. Connect to Wi-Fi'}</p>
                    <p className="text-[10px] text-muted-foreground text-center">SSID: {hotspotSSID}<br/>Pass: {hotspotPASS}</p>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center">
                    <div className="bg-white p-2 rounded-xl shadow-sm ring-1 ring-border mb-2">
                      <QRCodeSVG
                        value={serverUrl}
                        size={130}
                        level="M"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                    <p className="text-xs font-bold mb-1">{isKurdish ? '٢. ناردنی فایل' : '2. Send Files'}</p>
                    <p className="text-[10px] text-muted-foreground text-center break-all">{serverUrl}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white p-3 rounded-xl shadow-sm ring-1 ring-border">
                    <QRCodeSVG
                      value={serverUrl}
                      size={160}
                      level="M"
                      includeMargin={false}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground mb-1">
                      {t('transfer.scanning')}
                    </p>
                    <p className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded-md inline-block">
                      {serverUrl}
                    </p>
                  </div>
                </>
              )}

              <div className={`w-full flex items-center gap-3 p-3 rounded-lg border ${
                receivedCount > 0 
                  ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' 
                  : 'bg-muted border-border text-foreground'
              }`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  receivedCount > 0 ? 'bg-green-500' : 'bg-primary'
                }`} />
                <span className="text-sm font-medium flex-1">
                  {receivedCount > 0
                    ? activeTab === 'folder'
                      ? (isKurdish ? `${receivedCount} فایل وەرگیرا` : `${receivedCount} file${receivedCount !== 1 ? 's' : ''} received`)
                      : t('transfer.photosReceived').replace('{count}', String(receivedCount))
                    : t('transfer.waiting')
                  }
                </span>
                {receivedCount > 0 && <CheckCircle size={16} />}
              </div>

              {lastReceivedName && (
                <div className="w-full flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground">
                  <ImagePlus size={14} className="flex-shrink-0" />
                  <span className="truncate flex-1">{lastReceivedName}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>

        {(serverRunning) && (
          <CardFooter className="pt-0">
            <Button onClick={handleClose} variant="outline" className="w-full">
              {t('transfer.stop')}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
