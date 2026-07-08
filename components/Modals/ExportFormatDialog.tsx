import React from 'react';
import { FileImage, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { cn } from '../../lib/utils';

interface ExportFormatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: 'png' | 'jpeg' | 'pdf') => void;
  title: string;
  description: string;
  language: 'en' | 'ku' | 'ar';
}

const ExportFormatDialog: React.FC<ExportFormatDialogProps> = ({
  open,
  onOpenChange,
  onExport,
  title,
  description,
  language
}) => {
  const isRTL = language === 'ku' || language === 'ar';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button
            onClick={() => {
              onExport('png');
              onOpenChange(false);
            }}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
              <FileImage size={20} className="text-primary" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">PNG</span>
              <span className="text-xs text-muted-foreground">
                {language === 'ku' ? 'کوالیتی بەرز، پاشبنەی شەفاف' : language === 'ar' ? 'جودة عالية، خلفية شفافة' : 'High quality, transparent background'}
              </span>
            </div>
          </Button>
          
          <Button
            onClick={() => {
              onExport('jpeg');
              onOpenChange(false);
            }}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
              <FileImage size={20} className="text-primary" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">JPEG</span>
              <span className="text-xs text-muted-foreground">
                {language === 'ku' ? 'قەبارەی کەمتر، پاشبنەی سپی' : language === 'ar' ? 'حجم أصغر، خلفية بيضاء' : 'Smaller size, white background'}
              </span>
            </div>
          </Button>
          
          <Button
            onClick={() => {
              onExport('pdf');
              onOpenChange(false);
            }}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
              <FileText size={20} className="text-primary" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">PDF</span>
              <span className="text-xs text-muted-foreground">
                {language === 'ku' ? 'بۆ هەناردەکردن و هاوبەشکردن' : language === 'ar' ? 'للتصدير والمشاركة' : 'For exporting and sharing'}
              </span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportFormatDialog;
