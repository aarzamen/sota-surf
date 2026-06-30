
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noBorder?: boolean;
  variant?: 'default' | 'alert' | 'dim';
}

function CardComponent({ children, className = '', style, noBorder = false, variant = 'default' }: CardProps) {
  
  let borderColor = 'border-mil-border';
  if (variant === 'alert') borderColor = 'border-mil-alert/50';
  if (variant === 'dim') borderColor = 'border-mil-border/50';

  return (
    <div
      className={`
        relative bg-mil-panel 
        ${!noBorder ? `border ${borderColor}` : ''} 
        p-4 
        transition-all duration-300
        ${className}
      `}
      style={style}
    >
      {/* Rugged Corner Screws */}
      {!noBorder && (
        <>
          {/* Top Left */}
          <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t border-l border-mil-tan/50"></div>
          <div className="absolute top-1.5 left-1.5 w-1 h-1 bg-mil-border rounded-full opacity-50"></div>
          
          {/* Top Right */}
          <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t border-r border-mil-tan/50"></div>
          <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-mil-border rounded-full opacity-50"></div>
          
          {/* Bottom Left */}
          <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b border-l border-mil-tan/50"></div>
          <div className="absolute bottom-1.5 left-1.5 w-1 h-1 bg-mil-border rounded-full opacity-50"></div>
          
          {/* Bottom Right */}
          <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b border-r border-mil-tan/50"></div>
          <div className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-mil-border rounded-full opacity-50"></div>
        </>
      )}
      {children}
    </div>
  );
}

export const Card = React.memo(CardComponent);
