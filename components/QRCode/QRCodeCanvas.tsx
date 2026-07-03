import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../../store/AppContext';
import { cn } from '../../lib/utils';
import { getTranslation } from '../../utils/translations';
import { Download, Printer } from 'lucide-react';
import { Button } from '../ui/button';

export const QRCodeCanvas: React.FC = () => {
  const { state } = useApp();
  const qrRef = useRef<HTMLDivElement>(null);
  const t = (key: string) => getTranslation(key, state.language);

  const qrData = state.qrCodeData;
  if (!qrData) return null;

  // Generate QR content based on type
  const generateQRContent = (): string => {
    switch (qrData.type) {
      case 'url':
        return qrData.content.startsWith('http') ? qrData.content : `https://${qrData.content}`;
      case 'email':
        return `mailto:${qrData.content}`;
      case 'phone':
        return `tel:${qrData.content}`;
      case 'sms':
        return `sms:${qrData.content}`;
      case 'wifi':
        return `WIFI:T:${qrData.wifiSecurity};S:${qrData.wifiSSID};P:${qrData.wifiPassword};H:${qrData.wifiHidden};;`;
      case 'location':
        return `geo:${qrData.latitude},${qrData.longitude}`;
      case 'text':
      default:
        return qrData.content;
    }
  };

  const actualQRContent = generateQRContent();

  const handleDownload = async () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scaleFactor = 4;
      canvas.width = qrData.size * scaleFactor;
      canvas.height = qrData.size * scaleFactor;

      ctx.fillStyle = qrData.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = async () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        if (qrData.logoImage) {
          const logoImg = new Image();
          logoImg.onload = () => {
            const logoPixelSize = (canvas.width * qrData.logoSize) / 100;
            const x = (canvas.width - logoPixelSize) / 2;
            const y = (canvas.height - logoPixelSize) / 2;

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x - 10, y - 10, logoPixelSize + 20, logoPixelSize + 20);

            ctx.drawImage(logoImg, x, y, logoPixelSize, logoPixelSize);

            canvas.toBlob((blob) => {
              if (blob) {
                const link = document.createElement('a');
                link.download = `qrcode-${Date.now()}.png`;
                link.href = URL.createObjectURL(blob);
                link.click();
              }
            });
          };
          logoImg.src = qrData.logoImage;
        } else {
          canvas.toBlob((blob) => {
            if (blob) {
              const link = document.createElement('a');
              link.download = `qrcode-${Date.now()}.png`;
              link.href = URL.createObjectURL(blob);
              link.click();
            }
          });
        }
      };

      img.src = url;
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handlePrint = () => {
    // Hide non-printable elements
    document.body.classList.add('printing-qr');
    
    // Add print styles
    const style = document.createElement('style');
    style.id = 'qr-print-styles';
    style.textContent = `
      @media print {
        body.printing-qr * {
          visibility: hidden;
        }
        body.printing-qr #qr-print-area,
        body.printing-qr #qr-print-area * {
          visibility: visible;
        }
        body.printing-qr #qr-print-area {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }
        @page {
          size: A4;
          margin: 20mm;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Mark the QR area for printing
    if (qrRef.current) {
      qrRef.current.id = 'qr-print-area';
    }
    
    // Print
    window.print();
    
    // Cleanup
    setTimeout(() => {
      document.body.classList.remove('printing-qr');
      const styleEl = document.getElementById('qr-print-styles');
      if (styleEl) styleEl.remove();
      if (qrRef.current) {
        qrRef.current.id = '';
      }
    }, 100);
  };

  const isKurdish = state.language === 'ku';

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/30 flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl w-full space-y-6 animate-fade-in">
        {/* QR Code Preview Card */}
        <div className="bg-background rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="p-12 flex flex-col items-center justify-center min-h-[500px]">
            <div
              ref={qrRef}
              className="relative inline-block p-6 rounded-xl shadow-lg"
              style={{ backgroundColor: qrData.bgColor }}
            >
              <QRCodeSVG
                value={actualQRContent || 'https://example.com'}
                size={qrData.size}
                level={qrData.errorLevel}
                fgColor={qrData.fgColor}
                bgColor={qrData.bgColor}
                includeMargin={qrData.includeMargin}
                imageSettings={qrData.logoImage ? {
                  src: qrData.logoImage,
                  height: (qrData.size * qrData.logoSize) / 100,
                  width: (qrData.size * qrData.logoSize) / 100,
                  excavate: true,
                } : undefined}
              />
            </div>
            
            {actualQRContent && (
              <div className="mt-6 text-center px-8">
                <p className="text-xs text-muted-foreground break-all max-w-xl leading-relaxed font-mono bg-muted/50 px-4 py-2 rounded-md" dir="ltr">
                  {actualQRContent.length > 100 
                    ? `${actualQRContent.substring(0, 100)}...` 
                    : actualQRContent}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={cn(
          "grid grid-cols-2 gap-4",
          isKurdish ? 'font-kufi' : 'font-sans'
        )} dir={isKurdish ? 'rtl' : 'ltr'}>
          <Button
            onClick={handleDownload}
            disabled={!actualQRContent}
            size="lg"
            className="w-full h-12 text-base shadow-sm"
          >
            <Download size={20} />
            <span>{isKurdish ? 'دابەزاندنی PNG' : 'Download PNG'}</span>
          </Button>
          
          <Button
            onClick={handlePrint}
            disabled={!actualQRContent}
            variant="outline"
            size="lg"
            className="w-full h-12 text-base shadow-sm"
          >
            <Printer size={20} />
            <span>{isKurdish ? 'چاپکردن' : 'Print'}</span>
          </Button>
        </div>

        {/* Helper Text */}
        {!actualQRContent && (
          <div className="text-center text-muted-foreground py-8">
            <p className={cn("text-sm", isKurdish ? 'font-kufi' : 'font-sans')} dir={isKurdish ? 'rtl' : 'ltr'}>
              {isKurdish 
                ? 'ناوەڕۆک زیاد بکە لە لای چەپەوە بۆ دروستکردنی QR کۆد'
                : 'Add content from the left panel to generate QR code'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
};
