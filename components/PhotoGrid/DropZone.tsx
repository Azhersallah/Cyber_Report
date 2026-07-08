import React, { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { generateId, readFileAsDataURL } from '../../utils/helpers';
import { Photo } from '../../types';
import { getTranslation } from '../../utils/translations';

const DropZone: React.FC = () => {
  const { state, dispatch } = useApp();
  const t = (key: string) => getTranslation(key, state.language);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newPhotos: Photo[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)) {
        try {
          const src = await readFileAsDataURL(file);
          newPhotos.push({
            id: generateId(),
            name: file.name,
            src,
            rotation: 0,
            annotations: []
          });
        } catch (err) {
          console.error("Failed to load image", err);
          errors.push(file.name);
        }
      }
    }
    
    if (newPhotos.length > 0) {
      dispatch({ type: 'ADD_PHOTOS', payload: newPhotos });
    }
    
    // Show error for failed files
    if (errors.length > 0) {
      alert(`Failed to load: ${errors.join(', ')}\n\nHEIC files may take a moment to convert.`);
    }

    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const onDrop = (e: React.DragEvent) => {
    // Check if it's a project file - if so, let the global handler in App.tsx deal with it
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const firstName = e.dataTransfer.files[0].name.toLowerCase();
      if (firstName.endsWith('.pppro') || firstName.endsWith('.ppfree') || firstName.endsWith('.cyr')) {
        // Don't prevent default - let it bubble to App.tsx
        return;
      }
    }
    
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    // Allow all drags - we'll filter in onDrop
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      data-drop-target="dropzone"
      onClick={handleClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      className="group relative overflow-hidden border border-dashed border-border rounded-md px-3 py-2.5 text-center transition-all cursor-pointer select-none hover:border-foreground/50 hover:bg-muted/50"
    >
      <input 
        type="file" 
        multiple 
        accept="image/*,.heic,.heif" 
        className="hidden" 
        ref={fileInputRef}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => handleFiles(e.target.files)}
      />
      
      <div className="relative z-10 flex items-center justify-center gap-2 pointer-events-none">
        <div className="p-1.5 bg-muted text-muted-foreground rounded-md group-hover:text-foreground transition-colors">
          <ImagePlus size={16} />
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {t('drop.title')}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground text-xs">
            {t('drop.browse')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DropZone;
