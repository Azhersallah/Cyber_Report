import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSearch } from '../../store/SearchContext';

interface HighlightOverlayProps {
  targetRef: React.RefObject<HTMLElement>;
  elementId?: string | number;
  elementType?: 'photo' | 'pageTitle' | 'globalTitle' | 'textArea';
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  isCurrent: boolean;
}

export const HighlightOverlay: React.FC<HighlightOverlayProps> = ({
  targetRef,
  elementId,
  elementType,
}) => {
  const { searchText, isSearchActive, caseSensitive, matches, currentMatchIndex } = useSearch();
  const [highlights, setHighlights] = useState<HighlightRect[]>([]);

  useEffect(() => {
    if (!isSearchActive || !searchText || !targetRef.current) {
      setHighlights([]);
      return;
    }

    const element = targetRef.current;
    const text = element.textContent || '';
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapeRegex(searchText), caseSensitive ? 'g' : 'gi');

    const newHighlights: HighlightRect[] = [];
    let match;
    let matchIdx = 0;

    while ((match = regex.exec(text)) !== null) {
      // Find the text node and position
      const range = document.createRange();
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
      
      let currentPos = 0;
      let node: Node | null = walker.nextNode();
      
      while (node) {
        const nodeLength = node.textContent?.length || 0;
        if (currentPos + nodeLength > match.index) {
          const startOffset = match.index - currentPos;
          const endOffset = Math.min(startOffset + match[0].length, nodeLength);
          
          try {
            range.setStart(node, startOffset);
            range.setEnd(node, endOffset);
            
            const rect = range.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            // Check if this is the current match
            const isCurrentMatch = matches.some((m, idx) => 
              idx === currentMatchIndex && 
              m.id === elementId && 
              m.type === elementType &&
              m.matchIndex === match!.index
            );
            
            newHighlights.push({
              top: rect.top - elementRect.top,
              left: rect.left - elementRect.left,
              width: rect.width,
              height: rect.height,
              isCurrent: isCurrentMatch,
            });
          } catch (e) {
            // Ignore range errors
          }
          break;
        }
        currentPos += nodeLength;
        node = walker.nextNode();
      }
      matchIdx++;
    }

    setHighlights(newHighlights);
  }, [searchText, isSearchActive, caseSensitive, matches, currentMatchIndex, elementId, elementType, targetRef]);

  if (!isSearchActive || highlights.length === 0) {
    return null;
  }

  return (
    <>
      {highlights.map((h, i) => (
        <div
          key={i}
          className="absolute pointer-events-none rounded-sm transition-all duration-150"
          style={{
            top: h.top,
            left: h.left,
            width: h.width,
            height: h.height,
            backgroundColor: h.isCurrent ? 'rgba(251, 146, 60, 0.5)' : 'rgba(253, 224, 71, 0.5)',
            boxShadow: h.isCurrent ? '0 0 0 2px rgba(251, 146, 60, 0.8)' : 'none',
            zIndex: 10,
          }}
        />
      ))}
    </>
  );
};

export default HighlightOverlay;
