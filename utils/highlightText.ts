// Utility to highlight text in the DOM
export const highlightTextInElement = (
  element: HTMLElement,
  searchText: string,
  caseSensitive: boolean = false,
  currentMatchIndex: number = -1,
  elementMatchIndices: number[] = []
): void => {
  if (!searchText || !element) return;

  // Remove existing highlights
  removeHighlights(element);

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapeRegex(searchText)})`, caseSensitive ? 'g' : 'gi');

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  let globalMatchIdx = 0;
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
      
      const isCurrent = elementMatchIndices.includes(globalMatchIdx) && 
                        elementMatchIndices.indexOf(globalMatchIdx) === currentMatchIndex;
      
      if (isCurrent) {
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
};


export const removeHighlights = (element: HTMLElement): void => {
  const marks = element.querySelectorAll('mark.search-highlight');
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      const textNode = document.createTextNode(mark.textContent || '');
      parent.replaceChild(textNode, mark);
      parent.normalize();
    }
  });
};

export const scrollToCurrentMatch = (element: HTMLElement, matchIndex: number): void => {
  const currentMark = element.querySelector(`mark.search-highlight[data-match-index="${matchIndex}"]`);
  if (currentMark) {
    currentMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
