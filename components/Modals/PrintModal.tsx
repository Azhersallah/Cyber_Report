import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Printer, X, Check, FileText, MousePointer2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { useApp } from '../../store/AppContext';
import { getTranslation } from '../../utils/translations';

interface PrintModalProps {
  totalPages: number;
  onClose: () => void;
  onConfirm: (selectedPages: number[]) => void;
}

const formatRange = (selected: Record<number, boolean>, total: number): string => {
  const nums = Object.keys(selected).map(Number).filter(n => selected[n]).sort((a, b) => a - b);
  if (nums.length === total) return 'All';
  if (nums.length === 0) return '';
  const pages = nums.map(n => n + 1);
  const ranges: string[] = [];
  if (pages.length === 0) return '';
  let start = pages[0];
  let prev = pages[0];
  for (let i = 1; i < pages.length; i++) {
      if (pages[i] === prev + 1) { prev = pages[i]; }
      else { ranges.push(start === prev ? `${start}` : `${start}-${prev}`); start = pages[i]; prev = pages[i]; }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(', ');
};

const parseRange = (input: string, total: number): Record<number, boolean> => {
  const map: Record<number, boolean> = {};
  if (!input || !input.trim()) return map;
  if (input.toLowerCase() === 'all') { for(let i=0; i<total; i++) map[i] = true; return map; }
  const parts = input.split(',');
  parts.forEach(part => {
      const range = part.trim().split('-');
      if (range.length === 1) { const num = parseInt(range[0]); if (!isNaN(num) && num >= 1 && num <= total) map[num - 1] = true; }
      else if (range.length === 2) { const start = parseInt(range[0]); const end = parseInt(range[1]); if (!isNaN(start) && !isNaN(end)) { const s = Math.max(1, Math.min(start, end)); const e = Math.min(total, Math.max(start, end)); for (let i = s; i <= e; i++) map[i - 1] = true; } }
  });
  return map;
};

const PrintModal: React.FC<PrintModalProps> = ({ totalPages, onClose, onConfirm }) => {
  const { state, dispatch } = useApp();
  const t = (key: string) => getTranslation(key, state.language);
  const isKurdish = state.language === 'ku';
  const isInvoiceMode = state.mode === 'invoice';
  
  const [selectedMap, setSelectedMap] = useState<Record<number, boolean>>({});
  const [rangeInput, setRangeInput] = useState('');
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  
  useEffect(() => {
    const initial: Record<number, boolean> = {};
    for (let i = 0; i < totalPages; i++) initial[i] = true;
    setSelectedMap(initial);
    setRangeInput(formatRange(initial, totalPages));
  }, [totalPages]);

  const handlePageClick = (index: number, e: React.MouseEvent) => {
    let newMap = { ...selectedMap };
    if (e.shiftKey && lastClickedIndex !== null) {
        const start = Math.min(lastClickedIndex, index);
        const end = Math.max(lastClickedIndex, index);
        for (let i = start; i <= end; i++) newMap[i] = true;
    } else { newMap[index] = !newMap[index]; }
    setSelectedMap(newMap);
    setLastClickedIndex(index);
    setRangeInput(formatRange(newMap, totalPages));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setRangeInput(e.target.value);
      setSelectedMap(parseRange(e.target.value, totalPages));
  };

  const handleInputBlur = () => {
      const newMap = parseRange(rangeInput, totalPages);
      setSelectedMap(newMap);
      setRangeInput(formatRange(newMap, totalPages));
  };

  const selectAll = () => { const all: Record<number, boolean> = {}; for (let i = 0; i < totalPages; i++) all[i] = true; setSelectedMap(all); setRangeInput('All'); };
  const deselectAll = () => { setSelectedMap({}); setRangeInput(''); };

  const handleConfirm = () => {
    const selected = Object.keys(selectedMap).map(Number).filter(i => selectedMap[i]).sort((a, b) => a - b);
    onConfirm(selected);
    onClose();
  };

  const selectedCount = Object.values(selectedMap).filter(Boolean).length;
  const isAllSelected = selectedCount === totalPages;

  const modalContent = (
    <div className={`fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 animate-fade-in ${isKurdish ? 'font-kufi' : ''}`} dir={isKurdish ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-2xl flex flex-col max-h-[85vh]">
        
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Printer size={18} />
                {t('print.title')}
              </CardTitle>
              <CardDescription className="mt-0.5">{t('print.selectPages')}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
          </div>
        </CardHeader>

        {isInvoiceMode && (
          <div className="p-3 border-b border-border flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">{t('invoice.startNumber')}:</label>
              <Input
                type="number"
                min={1}
                value={state.settings.invoiceStartNumber}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  dispatch({ type: 'UPDATE_SETTINGS', payload: { invoiceStartNumber: val } });
                }}
                className="w-24"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">{t('invoice.endNumber')}:</label>
              <Input
                type="number"
                min={1}
                value={state.settings.invoiceEndNumber}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  dispatch({ type: 'UPDATE_SETTINGS', payload: { invoiceEndNumber: val } });
                }}
                className="w-24"
              />
            </div>
          </div>
        )}
        <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                <label className="text-sm font-medium whitespace-nowrap">{t('print.pages')}:</label>
                <div className="relative flex-1 max-w-xs">
                    <Input value={rangeInput} onChange={handleInputChange} onBlur={handleInputBlur} placeholder={t('print.placeholder')} className="pr-16" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{selectedCount} {t('print.selected')}</span>
                </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={selectAll} variant={isAllSelected ? "secondary" : "outline"} size="sm" className="flex-1 sm:flex-none">{t('print.selectAll')}</Button>
                <Button onClick={deselectAll} variant="outline" size="sm" className="flex-1 sm:flex-none">{t('print.clear')}</Button>
            </div>
        </div>

        <CardContent className="p-4 overflow-y-auto flex-1 bg-muted/30">
           <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                    <button 
                        key={idx}
                        onClick={(e) => handlePageClick(idx, e)}
                        className={`group relative aspect-[210/297] rounded-sm border transition-all flex flex-col items-center justify-center gap-0.5 ${
                            selectedMap[idx]
                                ? 'border-foreground bg-accent' 
                                : 'border-border bg-background opacity-60 hover:opacity-100 hover:border-foreground/50'
                        }`}
                    >
                        <FileText size={16} className={selectedMap[idx] ? 'text-foreground' : 'text-muted-foreground'} />
                        <span className={`text-[9px] font-medium ${selectedMap[idx] ? 'text-foreground' : 'text-muted-foreground'}`}>{idx + 1}</span>
                        {selectedMap[idx] && (
                            <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-foreground rounded-full flex items-center justify-center">
                                <Check size={8} className="text-background" />
                            </div>
                        )}
                    </button>
                ))}
           </div>
           {totalPages === 0 && <div className="flex items-center justify-center h-full text-muted-foreground text-sm">{t('print.noPages')}</div>}
        </CardContent>

        <CardFooter className="border-t border-border py-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MousePointer2 size={12} />
                <span>{t('print.shiftHint')}</span>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>{t('action.cancel')}</Button>
                <Button onClick={handleConfirm} disabled={selectedCount === 0}>
                    <Printer size={16} />
                    {t('action.print')} {selectedCount > 0 ? `(${selectedCount})` : ''}
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default PrintModal;
