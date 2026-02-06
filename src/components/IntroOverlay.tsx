import React, { useState, useEffect, useRef } from "react";
import {
  VALENTINE_TITLE,
  VALENTINE_TITLE_ACCENT,
  VALENTINE_IMAGE,
  VALENTINE_NO_TEXT,
  VALENTINE_YES_TEXT,
  INTRO_TITLE,
  INTRO_DESCRIPTION,
  INTRO_BUTTON_TEXT,
} from "../config";

interface IntroOverlayProps {
  onStart: () => void;
}

const IntroOverlay: React.FC<IntroOverlayProps> = ({ onStart }) => {
  const [step, setStep] = useState<"valentine" | "welcome">("valentine");
  const [showContent, setShowContent] = useState(false);
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });
  const [evadeCount, setEvadeCount] = useState(0);
  const [noButtonConverted, setNoButtonConverted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const noButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, [step]);

  const handleYes = () => {
    setShowContent(false);
    setTimeout(() => {
      setStep("welcome");
    }, 300);
  };

  const handleNoHover = () => {
    if (noButtonConverted) return;

    const newCount = evadeCount + 1;
    setEvadeCount(newCount);

    // On 4th attempt, convert to Yes button
    if (newCount >= 4) {
      setNoButtonConverted(true);
      return;
    }

    // Calculate new random position within container bounds
    if (containerRef.current && noButtonRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const button = noButtonRef.current.getBoundingClientRect();

      // Calculate max offsets to keep button in view
      const maxX = (container.width / 2) - (button.width / 2) - 20;
      const maxY = 60; // Limit vertical movement

      // Generate random position (away from center)
      const randomX = (Math.random() - 0.5) * 2 * maxX;
      const randomY = (Math.random() - 0.5) * 2 * maxY;

      setNoButtonPos({ x: randomX, y: randomY });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0d0d0d]">
      {/* Background image with scanlines */}
      <div className="absolute inset-0 flicker-subtle">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: step === "valentine"
              ? "url('/images/gta.avif')"
              : "url('/images/gta3.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.15,
            filter: "saturate(0.7) brightness(0.8)",
          }}
        />
        {/* Scanline overlay - only on background */}
        <div className="scanlines" />
      </div>

      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,45,149,0.15) 0%, transparent 70%)",
        }}
      />

      {step === "valentine" ? (
        <div
          ref={containerRef}
          className={`relative max-w-2xl w-full mx-4 bg-[#1c1c1e] mac-card overflow-hidden transition-all duration-500 ${
            showContent ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* macOS window header */}
          <div className="flex items-center px-4 py-3 bg-[#2c2c2e] border-b border-[#3a3a3c]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="flex-1 text-center text-xs text-gray-500 font-pixel">
              love.exe
            </span>
            <div className="w-14" />
          </div>

          <div className="p-10 md:p-16 text-center">
            <h1 className="font-pixel text-4xl md:text-5xl lg:text-6xl text-[#ff2d95] mb-10 glow-pink tracking-wider leading-tight">
              {VALENTINE_TITLE}{" "}
              <span className="italic">{VALENTINE_TITLE_ACCENT}</span>
            </h1>

            {/* Image */}
            <div className="mb-12 relative inline-block">
              <img
                src={VALENTINE_IMAGE}
                alt="Us"
                className="w-48 h-48 md:w-56 md:h-56 object-cover"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-6 items-center min-h-[100px] relative">
              {noButtonConverted ? (
                // Converted No button - now a Yes button!
                <button
                  onClick={handleYes}
                  className="retro-btn px-8 py-3 bg-[#ff2d95] border-[#ff2d95] text-[#0a0a0f] text-xl font-pixel hover:bg-[#ff50a8] transition-all duration-300"
                >
                  {VALENTINE_YES_TEXT}
                </button>
              ) : (
                <button
                  ref={noButtonRef}
                  onMouseEnter={handleNoHover}
                  onClick={() => {}}
                  className="retro-btn px-8 py-3 bg-transparent border-[#ff2d95] text-[#ff2d95] text-xl font-pixel transition-all duration-150"
                  style={{
                    transform: `translate(${noButtonPos.x}px, ${noButtonPos.y}px)`,
                  }}
                >
                  {VALENTINE_NO_TEXT}
                </button>
              )}
              <button
                onClick={handleYes}
                className="retro-btn px-8 py-3 bg-[#ff2d95] border-[#ff2d95] text-[#0a0a0f] text-xl font-pixel hover:bg-[#ff50a8]"
              >
                {VALENTINE_YES_TEXT}
              </button>
            </div>

            {/* Evade counter hint */}
            {evadeCount > 0 && evadeCount < 4 && !noButtonConverted && (
              <p className="mt-4 text-xs text-gray-600 font-pixel">
                Nice try... {4 - evadeCount} more {4 - evadeCount === 1 ? 'attempt' : 'attempts'} left
              </p>
            )}

            {/* Decorative text */}
            <p className="mt-8 text-xs text-gray-600 font-pixel tracking-widest">
              {">"} AWAITING INPUT...
              <span className="cursor-blink" />
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`relative max-w-2xl w-full mx-4 bg-[#1c1c1e] mac-card overflow-hidden transition-all duration-500 ${
            showContent ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* macOS window header */}
          <div className="flex items-center px-4 py-3 bg-[#2c2c2e] border-b border-[#3a3a3c]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="flex-1 text-center text-xs text-gray-500 font-pixel">
              map.exe
            </span>
            <div className="w-14" />
          </div>

          <div className="p-10 md:p-16 text-center">
            <h1 className="font-pixel text-5xl md:text-6xl lg:text-7xl text-[#ff2d95] mb-8 glow-pink tracking-wider">
              {INTRO_TITLE}
            </h1>

            <p className="text-gray-400 text-base md:text-lg mb-12 max-w-md mx-auto font-pixel leading-relaxed tracking-wide">
              {INTRO_DESCRIPTION}
            </p>

            <button
              onClick={onStart}
              className="retro-btn px-10 py-4 bg-transparent border-[#ff2d95] text-[#ff2d95] text-xl font-pixel hover:bg-[#ff2d95]/10 glow-pink"
            >
              {">"} {INTRO_BUTTON_TEXT}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroOverlay;
