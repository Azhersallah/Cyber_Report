import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  isDestructive = true
}) => {
  const { state } = useApp();
  if (!isOpen) return null;

  const isKurdish = state.language === 'ku';

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in ${isKurdish ? 'font-kufi' : ''}`} 
      dir={isKurdish ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <Card className="relative w-full max-w-sm animate-slide-up">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-md ${isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`}>
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="mt-1">{message}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </CardHeader>

        <CardFooter className="gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={isDestructive ? "destructive" : "default"} className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ConfirmModal;
