import React, { useRef, useState } from 'react';
import { Upload, X, User, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';
import { processUploadedPhoto } from '../../utils/photoProcessing';

interface PhotoUploaderProps {
  currentPhoto: string | null;
  onPhotoChange: (photo: string) => void;
  onPhotoRemove: () => void;
  onPhotoEdit?: () => void;
  language?: 'en' | 'ku' | 'ar';
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  currentPhoto,
  onPhotoChange,
  onPhotoRemove,
  onPhotoEdit,
  language = 'en'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isRTL = language === 'ku' || language === 'ar';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert(isRTL ? 'قەبارەی وێنە زۆر گەورەیە. تکایە وێنەیەکی بچووکتر هەڵبژێرە (کەمتر لە 10MB)' : 'Photo size is too large. Please select a smaller photo (less than 10MB)');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Process photo: convert HEIC if needed, resize, maintain aspect ratio
      const processedPhoto = await processUploadedPhoto(file, 800, 800);
      
      onPhotoChange(processedPhoto);
    } catch (error) {
      console.error('Failed to process photo:', error);
      alert(isRTL ? 'هەڵەیەک ڕوویدا لە پرۆسێسکردنی وێنەکە' : 'Failed to process photo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPhotoRemove();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          "relative w-full aspect-square rounded-lg border-2 border-dashed cursor-pointer transition-all",
          "hover:border-primary hover:bg-muted/50",
          currentPhoto ? "border-border" : "border-muted-foreground/30",
          isProcessing && "opacity-50 cursor-wait"
        )}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p className="text-sm font-medium">
              {isRTL ? 'پرۆسێسکردنی وێنە...' : 'Processing...'}
            </p>
          </div>
        ) : currentPhoto ? (
          <>
            <img
              src={currentPhoto}
              alt="Resume photo"
              className="w-full h-full object-cover rounded-lg"
            />
            {isHovering && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center gap-2">
                {onPhotoEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPhotoEdit(); }}
                    className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                    title={isRTL ? 'دەستکاری وێنە' : 'Edit photo'}
                  >
                    <Pencil size={20} />
                  </button>
                )}
                <button
                  onClick={handleRemove}
                  className="p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                  title={isRTL ? 'سڕینەوەی وێنە' : 'Remove photo'}
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="p-4 rounded-full bg-muted mb-2">
              {isHovering ? <Upload size={24} /> : <User size={24} />}
            </div>
            <p className="text-sm font-medium">
              {isRTL ? 'وێنە زیاد بکە' : 'Add Photo'}
            </p>
            <p className="text-xs mt-1">
              {isRTL ? 'JPG، PNG یان HEIC' : 'JPG, PNG or HEIC'}
            </p>
          </div>
        )}
      </div>

      {currentPhoto && (
        <div className="flex gap-2 mt-2">
          {onPhotoEdit && (
            <button
              onClick={onPhotoEdit}
              className="flex-1 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors flex items-center justify-center gap-1.5"
            >
              <Pencil size={14} />
              {isRTL ? 'دەستکاری وێنە' : 'Edit Photo'}
            </button>
          )}
          <button
            onClick={handleRemove}
            className="flex-1 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            {isRTL ? 'سڕینەوەی وێنە' : 'Remove Photo'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoUploader;
