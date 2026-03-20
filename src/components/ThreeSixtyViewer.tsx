import React, { useState, useRef } from 'react';

interface ThreeSixtyViewerProps {
  images: string[];
}

export default function ThreeSixtyViewer({ images }: ThreeSixtyViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 10) {
      const step = delta > 0 ? -1 : 1;
      setCurrentIndex(prev => (prev + step + images.length) % images.length);
      startX.current = e.clientX;
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - startX.current;
    if (Math.abs(delta) > 10) {
      const step = delta > 0 ? -1 : 1;
      setCurrentIndex(prev => (prev + step + images.length) % images.length);
      startX.current = e.touches[0].clientX;
    }
  };

  return (
    <div 
      className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <img
        src={images[currentIndex]}
        alt="360 View"
        className="w-full h-full object-contain pointer-events-none"
        referrerPolicy="no-referrer"
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
        Arraste para girar 360°
      </div>
    </div>
  );
}
