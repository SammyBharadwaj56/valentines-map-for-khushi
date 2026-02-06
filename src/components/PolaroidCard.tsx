import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { LocationData } from '../types';

/** Placeholder for paper/snap sound when polaroid opens. Replace with actual audio when you have an asset. */
function playPaperSound(): void {
  // Optional: new Audio('/sounds/paper.mp3').play().catch(() => {});
}

export interface PolaroidCardHandle {
  nextImage: () => void;
  prevImage: () => void;
}

interface PolaroidCardProps {
  location: LocationData | null;
  onClose: () => void;
}

const PolaroidCard = forwardRef<PolaroidCardHandle, PolaroidCardProps>(({ location, onClose }, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const validImages = useMemo(
    () => (location ? location.images.filter((img) => img && img.trim()) : []),
    [location?.images]
  );

  // Random rotation for each polaroid: -2deg to 2deg
  const rotation = useMemo(() => {
    return (Math.random() - 0.5) * 4;
  }, [location?.id, currentImageIndex]);

  const nextImage = useCallback(() => {
    if (validImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
    }
  }, [validImages.length]);

  const prevImage = useCallback(() => {
    if (validImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    }
  }, [validImages.length]);

  useImperativeHandle(ref, () => ({
    nextImage,
    prevImage,
  }), [nextImage, prevImage]);

  useEffect(() => {
    if (location) {
      setIsClosing(false);
      setIsVisible(true);
      setCurrentImageIndex(0);
      playPaperSound();
    }
  }, [location]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!location) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location, nextImage, prevImage, handleClose]);

  if (!location || !isVisible) return null;

  const currentImage = validImages[currentImageIndex];

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 text-white/60 hover:text-[#ff2d95] transition-colors font-pixel text-2xl z-10"
      >
        ✕
      </button>

      {/* Navigation arrows - outside polaroid */}
      {validImages.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 border border-white/20 rounded-full flex items-center justify-center text-white text-2xl hover:bg-[#ff2d95]/30 hover:border-[#ff2d95] transition-all z-10"
          >
            ‹
          </button>
          <button
            onClick={nextImage}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 border border-white/20 rounded-full flex items-center justify-center text-white text-2xl hover:bg-[#ff2d95]/30 hover:border-[#ff2d95] transition-all z-10"
          >
            ›
          </button>
        </>
      )}

      {/* Polaroid card */}
      <div
        className={`relative max-w-md w-full mx-4 ${isClosing ? 'polaroid-exit' : 'polaroid-enter'}`}
        style={{
          '--rotation': `${rotation}deg`,
          transform: `rotate(${rotation}deg)`,
        } as React.CSSProperties}
      >
        {/* Polaroid frame */}
        <div
          className="bg-[#fafafa] p-3 pb-16 shadow-2xl"
          style={{
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.1)',
          }}
        >
          {/* Photo */}
          <div className="relative bg-[#1a1a1a] aspect-square overflow-hidden">
            {currentImage ? (
              <img
                src={currentImage}
                alt={location.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#444]">
                <span className="font-pixel text-lg">NO PHOTOS</span>
              </div>
            )}
          </div>

          {/* Handwritten caption area */}
          <div className="absolute bottom-3 left-3 right-3 text-center">
            <p className="font-handwritten text-xl text-gray-700 mb-1">
              {location.name}
            </p>
            {location.date && (
              <p className="font-handwritten text-sm text-gray-500">
                {location.date}
              </p>
            )}
          </div>
        </div>

        {/* Tape decoration */}
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-8 bg-[#fff8dc]/70 rotate-[-1deg]"
          style={{
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />

        {/* Image counter */}
        {validImages.length > 1 && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <span className="font-pixel text-sm text-white/60">
              <span className="text-[#ff2d95]">{currentImageIndex + 1}</span>
              {" / "}
              {validImages.length}
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail strip at bottom */}
      {validImages.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg max-w-[90vw] overflow-x-auto">
          {validImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                idx === currentImageIndex
                  ? 'border-[#ff2d95] opacity-100 scale-110'
                  : 'border-transparent opacity-50 hover:opacity-75'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Keyboard hint */}
      <div className="absolute bottom-6 right-6 flex gap-4 text-[10px] text-white/30 font-pixel">
        <span>← → Navigate</span>
        <span>ESC Close</span>
      </div>
    </div>
  );
});

PolaroidCard.displayName = 'PolaroidCard';

export default PolaroidCard;
