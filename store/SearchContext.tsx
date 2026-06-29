import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { highlightTextInElement, removeHighlights } from '../utils/highlightText';

interface SearchMatch {
  type: 'photo' | 'pageTitle' | 'globalTitle' | 'textArea';
  id: string | number;
  matchIndex: number;
  matchLength: number;
}

interface SearchContextType {
  searchText: string;
  setSearchText: (text: string) => void;
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;
  currentMatchIndex: number;
  setCurrentMatchIndex: (index: number) => void;
  matches: SearchMatch[];
  setMatches: (matches: SearchMatch[]) => void;
  caseSensitive: boolean;
  setCaseSensitive: (sensitive: boolean) => void;
  applyHighlights: () => void;
  clearHighlights: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchText, setSearchText] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [caseSensitive, setCaseSensitive] = useState(false);


  const applyHighlights = useCallback(() => {
    if (!searchText || !isSearchActive) return;

    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    let globalMatchIdx = 0;

    editableElements.forEach((element) => {
      const el = element as HTMLElement;
      removeHighlights(el);
      
      if (!searchText) return;
      
      const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapeRegex(searchText)})`, caseSensitive ? 'g' : 'gi');
      
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      const textNodes: Text[] = [];
      
      let node: Node | null;
      while ((node = walker.nextNode())) {
        textNodes.push(node as Text);
      }

      textNodes.forEach((textNode) => {
        const text = textNode.textContent || '';
        if (!regex.test(text)) return;
        regex.lastIndex = 0;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
          }

          const mark = document.createElement('mark');
          mark.textContent = match[0];
          mark.className = 'search-highlight';
          mark.dataset.matchIndex = globalMatchIdx.toString();
          
          if (globalMatchIdx === currentMatchIndex) {
            mark.classList.add('search-highlight-current');
          }
          
          fragment.appendChild(mark);
          lastIndex = regex.lastIndex;
          globalMatchIdx++;
        }

        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        textNode.parentNode?.replaceChild(fragment, textNode);
      });
    });

    // Scroll to current match
    setTimeout(() => {
      const currentMark = document.querySelector('mark.search-highlight-current');
      if (currentMark) {
        currentMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }, [searchText, isSearchActive, caseSensitive, currentMatchIndex]);


  const clearHighlights = useCallback(() => {
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach((element) => {
      removeHighlights(element as HTMLElement);
    });
  }, []);

  useEffect(() => {
    if (isSearchActive && searchText) {
      const timer = setTimeout(() => {
        applyHighlights();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      clearHighlights();
    }
  }, [searchText, isSearchActive, caseSensitive, currentMatchIndex, applyHighlights, clearHighlights]);

  return (
    <SearchContext.Provider
      value={{
        searchText,
        setSearchText,
        isSearchActive,
        setIsSearchActive,
        currentMatchIndex,
        setCurrentMatchIndex,
        matches,
        setMatches,
        caseSensitive,
        setCaseSensitive,
        applyHighlights,
        clearHighlights,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
