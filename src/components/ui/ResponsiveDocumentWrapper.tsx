import React, { useState, useEffect, useRef } from 'react';

export const ResponsiveDocumentWrapper = ({ children, isInvoice = true }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const handleResize = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    // For A4, width is 210mm (~794px). For landscape, width is 297mm (~1123px).
    const docWidth = isInvoice ? 794 : 1123;
    
    if (containerWidth < docWidth) {
      setScale(containerWidth / docWidth);
    } else {
      setScale(1);
    }
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    // Extra timeout for rendering stability
    const timer = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [children, isInvoice]);

  const docHeight = isInvoice ? 1123 : 794;
  const scaledHeight = docHeight * scale;

  return (
    <div 
      ref={containerRef} 
      className="w-full flex justify-center overflow-visible"
    >
      <div 
        style={{ 
          width: isInvoice ? '794px' : '1123px',
          height: `${scaledHeight}px`,
          position: 'relative',
          overflow: 'visible'
        }}
      >
        <div 
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: isInvoice ? '794px' : '1123px',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveDocumentWrapper;
