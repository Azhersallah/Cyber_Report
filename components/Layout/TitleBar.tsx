import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(true);

  // Check if running in Electron
  const isElectron = typeof window !== 'undefined' &&
    (window as any).process?.type === 'renderer';

  useEffect(() => {
    if (!isElectron) return;

    const checkMaximized = async () => {
      const { ipcRenderer } = (window as any).require('electron');
      const maximized = await ipcRenderer.invoke('window-is-maximized');
      setIsMaximized(maximized);
    };

    checkMaximized();

    // Listen for window state changes
    const interval = setInterval(checkMaximized, 500);
    return () => clearInterval(interval);
  }, [isElectron]);

  const handleMinimize = () => {
    if (!isElectron) return;
    const { ipcRenderer } = (window as any).require('electron');
    ipcRenderer.send('window-minimize');
  };

  const handleMaximize = () => {
    if (!isElectron) return;
    const { ipcRenderer } = (window as any).require('electron');
    ipcRenderer.send('window-maximize');
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    if (!isElectron) return;
    const { ipcRenderer } = (window as any).require('electron');
    ipcRenderer.send('window-close');
  };

  // Don't render in browser
  if (!isElectron) return null;

  return (
    <div
      className="h-8 bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-end px-2 select-none no-print"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Window Controls */}
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="w-10 h-7 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded"
          title="Minimize"
        >
          <Minus size={14} className="text-gray-600 dark:text-gray-400" />
        </button>

        {/* Maximize/Restore */}
        <button
          onClick={handleMaximize}
          className="w-10 h-7 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <Square size={12} className="text-gray-600 dark:text-gray-400" />
          ) : (
            <Maximize2 size={14} className="text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="w-10 h-7 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors rounded group"
          title="Close"
        >
          <X size={16} className="text-gray-600 dark:text-gray-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
