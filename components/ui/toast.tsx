import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const icons = {
    success: <Check size={18} strokeWidth={2.5} />,
    error: <X size={18} strokeWidth={2.5} />,
    warning: <AlertCircle size={18} strokeWidth={2.5} />,
    info: <Info size={18} strokeWidth={2.5} />,
  };

  const styles = {
    success: 'bg-background border-border text-foreground',
    error: 'bg-background border-border text-foreground',
    warning: 'bg-background border-border text-foreground',
    info: 'bg-background border-border text-foreground',
  };

  const iconStyles = {
    success: 'text-foreground',
    error: 'text-foreground',
    warning: 'text-foreground',
    info: 'text-foreground',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm animate-slide-up min-w-[300px]',
        styles[toast.type]
      )}
    >
      <div className={cn('flex-shrink-0', iconStyles[toast.type])}>
        {icons[toast.type]}
      </div>
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration?: number) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container - Shadcn UI Style */}
      <div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
