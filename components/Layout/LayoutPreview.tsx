import React from 'react';

interface LayoutPreviewProps {
  type: string;
  forPaper?: boolean; // When true, use fixed colors for paper context
}

export const LayoutPreview: React.FC<LayoutPreviewProps> = ({ type, forPaper = false }) => {
  const isOnlyText = type === 'onlytext';
  
  // Fixed colors for paper context (always light)
  const bgColor = forPaper ? '#ffffff' : undefined;
  const borderColor = forPaper ? '#e4e4e7' : undefined;
  const fillColor = forPaper ? 'rgba(24,24,27,0.4)' : undefined;
  const mutedBg = forPaper ? '#f4f4f5' : undefined;
  
  let grid = '';
  if (type === '1') grid = 'grid-cols-1 grid-rows-1';
  else if (type === '2') grid = 'grid-cols-1 grid-rows-2';
  else if (type === '2col') grid = 'grid-cols-2 grid-rows-1';
  else if (type === '4') grid = 'grid-cols-2 grid-rows-2';
  else if (type === '1text') grid = 'grid-cols-1 grid-rows-[2fr_1fr]';
  
  if (type === '2text') {
      return (
        <div 
          className={`w-7 h-9 rounded-sm border p-0.5 grid grid-cols-2 gap-0.5 pointer-events-none ${!forPaper ? 'bg-background border-border' : ''}`}
          style={forPaper ? { backgroundColor: bgColor, borderColor } : undefined}
        >
            <div className="flex flex-col gap-0.5 h-full">
                <div 
                  className={`rounded-[1px] h-full w-full ${!forPaper ? 'bg-foreground/40' : ''}`}
                  style={forPaper ? { backgroundColor: fillColor } : undefined}
                ></div>
                <div 
                  className={`rounded-[1px] h-full w-full ${!forPaper ? 'bg-foreground/40' : ''}`}
                  style={forPaper ? { backgroundColor: fillColor } : undefined}
                ></div>
            </div>
            <div className="flex flex-col gap-0.5 h-full">
                 <div 
                   className={`rounded-[1px] h-full w-full flex items-center justify-center ${!forPaper ? 'bg-muted' : ''}`}
                   style={forPaper ? { backgroundColor: mutedBg } : undefined}
                 >
                   <div 
                     className={`w-1.5 h-px ${!forPaper ? 'bg-foreground/40' : ''}`}
                     style={forPaper ? { backgroundColor: fillColor } : undefined}
                   ></div>
                 </div>
                 <div 
                   className={`rounded-[1px] h-full w-full flex items-center justify-center ${!forPaper ? 'bg-muted' : ''}`}
                   style={forPaper ? { backgroundColor: mutedBg } : undefined}
                 >
                   <div 
                     className={`w-1.5 h-px ${!forPaper ? 'bg-foreground/40' : ''}`}
                     style={forPaper ? { backgroundColor: fillColor } : undefined}
                   ></div>
                 </div>
            </div>
        </div>
      );
  }

  if (type === '1text-side') {
      return (
        <div 
          className={`w-7 h-9 rounded-sm border p-0.5 grid grid-cols-2 gap-0.5 pointer-events-none ${!forPaper ? 'bg-background border-border' : ''}`}
          style={forPaper ? { backgroundColor: bgColor, borderColor } : undefined}
        >
            <div 
              className={`rounded-[1px] h-full w-full ${!forPaper ? 'bg-foreground/40' : ''}`}
              style={forPaper ? { backgroundColor: fillColor } : undefined}
            ></div>
            <div 
              className={`rounded-[1px] h-full w-full flex items-center justify-center ${!forPaper ? 'bg-muted' : ''}`}
              style={forPaper ? { backgroundColor: mutedBg } : undefined}
            >
                <div 
                  className={`w-1.5 h-px ${!forPaper ? 'bg-foreground/40' : ''}`}
                  style={forPaper ? { backgroundColor: fillColor } : undefined}
                ></div>
            </div>
        </div>
      );
  }

  if (type === 'businesscard') {
      return (
        <div 
          className={`w-7 h-9 rounded-sm border p-0.5 grid grid-cols-2 grid-rows-5 gap-0.5 pointer-events-none ${!forPaper ? 'bg-background border-border' : ''}`}
          style={forPaper ? { backgroundColor: bgColor, borderColor } : undefined}
        >
          {Array(10).fill(0).map((_, i) => (
            <div 
              key={i} 
              className={`rounded-[1px] ${!forPaper ? 'bg-foreground/40' : ''}`}
              style={forPaper ? { backgroundColor: fillColor } : undefined}
            ></div>
          ))}
        </div>
      );
  }

  if (type === 'businesscard-form') {
      return (
        <div 
          className={`w-7 h-9 rounded-sm border p-0.5 flex gap-0.5 pointer-events-none ${!forPaper ? 'bg-background border-border' : ''}`}
          style={forPaper ? { backgroundColor: bgColor, borderColor } : undefined}
        >
          <div 
            className={`rounded-[1px] w-1/2 h-full ${!forPaper ? 'bg-foreground/40' : ''}`}
            style={forPaper ? { backgroundColor: fillColor } : undefined}
          ></div>
          <div className="w-1/2 h-full flex flex-col gap-0.5">
            {Array(5).fill(0).map((_, i) => (
              <div 
                key={i} 
                className={`rounded-[1px] flex-1 w-full ${!forPaper ? 'bg-foreground/45' : ''}`}
                style={forPaper ? { backgroundColor: fillColor } : undefined}
              ></div>
            ))}
          </div>
        </div>
      );
  }

  if (type === 'businesscard-form-reverse') {
      return (
        <div 
          className={`w-7 h-9 rounded-sm border p-0.5 flex gap-0.5 pointer-events-none ${!forPaper ? 'bg-background border-border' : ''}`}
          style={forPaper ? { backgroundColor: bgColor, borderColor } : undefined}
        >
          <div className="w-1/2 h-full flex flex-col gap-0.5">
            {Array(5).fill(0).map((_, i) => (
              <div 
                key={i} 
                className={`rounded-[1px] flex-1 w-full ${!forPaper ? 'bg-foreground/45' : ''}`}
                style={forPaper ? { backgroundColor: fillColor } : undefined}
              ></div>
            ))}
          </div>
          <div 
            className={`rounded-[1px] w-1/2 h-full ${!forPaper ? 'bg-foreground/40' : ''}`}
            style={forPaper ? { backgroundColor: fillColor } : undefined}
          ></div>
        </div>
      );
  }

  
  return (
    <div 
      className={`w-7 h-9 rounded-sm border p-0.5 grid gap-0.5 pointer-events-none ${grid} ${!forPaper ? 'bg-background border-border' : ''}`}
      style={forPaper ? { backgroundColor: bgColor, borderColor } : undefined}
    >
      {!isOnlyText && !type.includes('text') && ['1', '2', '2col', '4'].includes(type) && Array(type === '2col' ? 2 : parseInt(type)).fill(0).map((_, i) => (
        <div 
          key={i} 
          className={`rounded-[1px] w-full h-full ${!forPaper ? 'bg-foreground/40' : ''}`}
          style={forPaper ? { backgroundColor: fillColor } : undefined}
        ></div>
      ))}
      {type === '1text' && (
          <>
          <div 
            className={`rounded-[1px] ${!forPaper ? 'bg-foreground/40' : ''}`}
            style={forPaper ? { backgroundColor: fillColor } : undefined}
          ></div>
          <div 
            className={`rounded-[1px] flex items-center justify-center ${!forPaper ? 'bg-muted' : ''}`}
            style={forPaper ? { backgroundColor: mutedBg } : undefined}
          >
            <div 
              className={`w-3 h-px ${!forPaper ? 'bg-foreground/40' : ''}`}
              style={forPaper ? { backgroundColor: fillColor } : undefined}
            ></div>
          </div>
          </>
      )}
      {isOnlyText && (
        <div className="w-full h-full flex flex-col gap-0.5 p-1 justify-center">
            <div 
              className={`w-full h-px ${!forPaper ? 'bg-foreground/40' : ''}`}
              style={forPaper ? { backgroundColor: fillColor } : undefined}
            ></div>
            <div 
              className={`w-3/4 h-px ${!forPaper ? 'bg-foreground/40' : ''}`}
              style={forPaper ? { backgroundColor: fillColor } : undefined}
            ></div>
            <div 
              className={`w-full h-px ${!forPaper ? 'bg-foreground/40' : ''}`}
              style={forPaper ? { backgroundColor: fillColor } : undefined}
            ></div>
        </div>
      )}
    </div>
  );
};
