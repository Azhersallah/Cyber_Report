import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Search, Replace, X, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { useSearch } from '../../store/SearchContext';
import { getTranslation } from '../../utils/translations';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/toast';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MatchLocation {
  type: 'photo' | 'pageTitle' | 'globalTitle' | 'textArea';
  id: string | number;
  text: string;
  matchIndex: number;
  matchLength: number;
}

const FindReplaceModal: React.FC<FindReplaceModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const search = useSearch();
  const t = (key: string) => getTranslation(key, state.language);
  const isKurdish = state.language === 'ku';

  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matches, setMatches] = useState<MatchLocation[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);


  // Sync with search context
  useEffect(() => {
    search.setSearchText(findText);
    search.setIsSearchActive(isOpen && findText.length > 0);
    search.setCaseSensitive(caseSensitive);
  }, [findText, isOpen, caseSensitive]);

  useEffect(() => {
    search.setCurrentMatchIndex(currentMatchIndex);
    search.setMatches(matches.map(m => ({
      type: m.type, id: m.id, matchIndex: m.matchIndex, matchLength: m.matchLength
    })));
  }, [currentMatchIndex, matches]);

  useEffect(() => {
    if (!isOpen) {
      search.setIsSearchActive(false);
      search.setSearchText('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && findInputRef.current) findInputRef.current.focus();
  }, [isOpen]);


  useEffect(() => {
    if (!findText.trim()) { setMatches([]); setCurrentMatchIndex(0); return; }
    const foundMatches: MatchLocation[] = [];
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapeRegex(findText), caseSensitive ? 'g' : 'gi');

    state.photos.forEach((photo) => {
      if (photo && photo.description) {
        const text = photo.description.replace(/<[^>]*>/g, '');
        let match;
        while ((match = regex.exec(text)) !== null) {
          foundMatches.push({ type: 'photo', id: photo.id, text, matchIndex: match.index, matchLength: match[0].length });
        }
      }
    });

    Object.keys(state.pageTitles).forEach(key => {
      const title = state.pageTitles[parseInt(key)];
      if (title) {
        const text = title.replace(/<[^>]*>/g, '');
        let match;
        while ((match = regex.exec(text)) !== null) {
          foundMatches.push({ type: 'pageTitle', id: parseInt(key), text, matchIndex: match.index, matchLength: match[0].length });
        }
      }
    });

    if (state.globalTitle) {
      const text = state.globalTitle.replace(/<[^>]*>/g, '');
      let match;
      while ((match = regex.exec(text)) !== null) {
        foundMatches.push({ type: 'globalTitle', id: 'global', text, matchIndex: match.index, matchLength: match[0].length });
      }
    }

    Object.keys(state.textAreas).forEach(key => {
      const areaText = state.textAreas[key];
      if (areaText) {
        const text = areaText.replace(/<[^>]*>/g, '');
        let match;
        while ((match = regex.exec(text)) !== null) {
          foundMatches.push({ type: 'textArea', id: key, text, matchIndex: match.index, matchLength: match[0].length });
        }
      }
    });

    setMatches(foundMatches);
    setCurrentMatchIndex(0);
  }, [findText, caseSensitive, state.photos, state.pageTitles, state.globalTitle, state.textAreas]);

  const goToNextMatch = () => { if (matches.length > 0) setCurrentMatchIndex((prev) => (prev + 1) % matches.length); };
  const goToPrevMatch = () => { if (matches.length > 0) setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length); };


  const replaceCurrentMatch = () => {
    if (matches.length === 0 || !findText.trim()) { showToast(t('findReplace.notFound'), 'info'); return; }
    const match = matches[currentMatchIndex];
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (match.type === 'photo') {
      const photo = state.photos.find(p => p && p.id === match.id);
      if (photo && photo.description) {
        const newDesc = photo.description.replace(new RegExp(escapeRegex(findText), caseSensitive ? '' : 'i'), replaceText);
        dispatch({ type: 'UPDATE_PHOTO', payload: { ...photo, description: newDesc } });
      }
    } else if (match.type === 'pageTitle') {
      const title = state.pageTitles[match.id as number];
      if (title) {
        const newTitle = title.replace(new RegExp(escapeRegex(findText), caseSensitive ? '' : 'i'), replaceText);
        dispatch({ type: 'SET_PAGE_TITLE', payload: { pageIndex: match.id as number, title: newTitle } });
      }
    } else if (match.type === 'globalTitle') {
      const newTitle = state.globalTitle.replace(new RegExp(escapeRegex(findText), caseSensitive ? '' : 'i'), replaceText);
      dispatch({ type: 'SET_GLOBAL_TITLE', payload: newTitle });
    } else if (match.type === 'textArea') {
      const text = state.textAreas[match.id as string];
      if (text) {
        const newText = text.replace(new RegExp(escapeRegex(findText), caseSensitive ? '' : 'i'), replaceText);
        dispatch({ type: 'UPDATE_TEXT_AREA', payload: { key: match.id as string, value: newText } });
      }
    }
    showToast(t('findReplace.replacedOne') || '1 replacement made', 'success');
  };


  const replaceAllMatches = () => {
    if (!findText.trim()) { showToast(t('findReplace.enterText'), 'warning'); return; }
    if (matches.length === 0) { showToast(t('findReplace.notFound'), 'info'); return; }

    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapeRegex(findText), caseSensitive ? 'g' : 'gi');
    let count = 0;

    state.photos.forEach(photo => {
      if (photo && photo.description) {
        const matchCount = (photo.description.match(regex) || []).length;
        if (matchCount > 0) { count += matchCount; dispatch({ type: 'UPDATE_PHOTO', payload: { ...photo, description: photo.description.replace(regex, replaceText) } }); }
      }
    });

    Object.keys(state.pageTitles).forEach(key => {
      const title = state.pageTitles[parseInt(key)];
      if (title) {
        const matchCount = (title.match(regex) || []).length;
        if (matchCount > 0) { count += matchCount; dispatch({ type: 'SET_PAGE_TITLE', payload: { pageIndex: parseInt(key), title: title.replace(regex, replaceText) } }); }
      }
    });

    if (state.globalTitle) {
      const matchCount = (state.globalTitle.match(regex) || []).length;
      if (matchCount > 0) { count += matchCount; dispatch({ type: 'SET_GLOBAL_TITLE', payload: state.globalTitle.replace(regex, replaceText) }); }
    }

    Object.keys(state.textAreas).forEach(key => {
      const text = state.textAreas[key];
      if (text) {
        const matchCount = (text.match(regex) || []).length;
        if (matchCount > 0) { count += matchCount; dispatch({ type: 'UPDATE_TEXT_AREA', payload: { key, value: text.replace(regex, replaceText) } }); }
      }
    });

    showToast(t('findReplace.replaced').replace('{count}', count.toString()), 'success');
  };

  if (!isOpen) return null;


  const panelContent = (
    <div 
      ref={panelRef} 
      className={`fixed top-16 z-[9999] w-80 bg-popover rounded-lg shadow-xl border border-border overflow-hidden animate-fade-in ${isKurdish ? 'left-4 font-kufi' : 'right-4'}`} 
      dir={isKurdish ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
    >
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium">{t('findReplace.title')}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors"><X size={14} /></button>
      </div>

      <div className="p-3 space-y-3">
        {/* Find Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t('findReplace.find')}</label>
          <div className="relative">
            <Input ref={findInputRef} value={findText} onChange={(e) => setFindText(e.target.value)} placeholder={t('findReplace.findPlaceholder')} className="pr-16 h-9"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); goToNextMatch(); } }} />
            {findText && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : '0'}</span>}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevMatch} disabled={matches.length === 0} className="flex-1 h-8"><ChevronUp size={14} />{t('findReplace.prev') || 'Previous'}</Button>
          <Button variant="outline" size="sm" onClick={goToNextMatch} disabled={matches.length === 0} className="flex-1 h-8">{t('findReplace.next') || 'Next'}<ChevronDown size={14} /></Button>
        </div>

        {/* Replace Input */}
        <div className="space-y-1.5 pt-2 border-t border-border">
          <label className="text-xs font-medium text-muted-foreground">{t('findReplace.replace')}</label>
          <Input value={replaceText} onChange={(e) => setReplaceText(e.target.value)} placeholder={t('findReplace.replacePlaceholder')} className="h-9" />
        </div>

        {/* Replace Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={replaceCurrentMatch} disabled={matches.length === 0} className="flex-1 h-8"><ArrowRight size={14} />{t('findReplace.replaceOne') || 'Replace'}</Button>
          <Button variant="default" size="sm" onClick={replaceAllMatches} disabled={matches.length === 0} className="flex-1 h-8"><Replace size={14} />{t('findReplace.replaceAll')}</Button>
        </div>

        {/* Case Sensitive Toggle */}
        <div className="flex items-center gap-2 pt-1">
          <button onClick={() => setCaseSensitive(!caseSensitive)} className={`text-[10px] px-2 py-1 rounded border transition-all ${caseSensitive ? 'border-foreground bg-accent text-foreground' : 'border-border text-muted-foreground hover:border-foreground/50'}`}>{t('findReplace.caseSensitive') || 'Aa'}</button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(panelContent, document.body);
};

export default FindReplaceModal;
