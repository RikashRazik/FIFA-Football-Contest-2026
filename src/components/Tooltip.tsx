import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'bottom' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative flex items-center justify-center cursor-help"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 p-3 w-48 text-xs bg-slate-800 text-white rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 pointer-events-none
          ${position === 'top' ? 'bottom-full mb-2' : ''}
          ${position === 'bottom' ? 'top-full mt-2' : ''}
          ${position === 'left' ? 'right-full mr-2' : ''}
          ${position === 'right' ? 'left-full ml-2' : ''}
        `}>
          {content}
          <div className={`absolute w-2 h-2 bg-slate-800 transform rotate-45
            ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
            ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
            ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
            ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
          `} />
        </div>
      )}
    </div>
  );
}
