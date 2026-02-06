import React from 'react';
import { LocationData } from '../types';
import {
  PANEL_GALLERY_TITLE,
  PANEL_NO_PHOTOS_EMOJI,
  PANEL_NO_PHOTOS_TEXT
} from '../config';

interface SidePanelProps {
  location: LocationData | null;
  onClose: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ location, onClose }) => {
  if (!location) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[1000] w-full sm:w-96 bg-[#1c1c1e] shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-[#3a3a3c] flex flex-col">
      {/* Header with macOS style */}
      <div className="flex items-center px-4 py-3 bg-[#2c2c2e] border-b border-[#3a3a3c]">
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors"
          />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs text-gray-500 font-pixel">location.exe</span>
        </div>
        <div className="w-14" />
      </div>

      {/* Location header */}
      <div className="p-6 border-b border-[#3a3a3c]">
        <h2 className="text-2xl font-pixel text-[#ff2d95] glow-pink mb-1">{location.name}</h2>
        <span className="text-xs font-pixel text-gray-500 uppercase tracking-wider">{location.date}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-8">
          <p className="text-gray-400 leading-relaxed font-pixel">
            {location.story}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-pixel text-[#ff2d95] uppercase tracking-widest">{PANEL_GALLERY_TITLE}</h3>

          {location.images.filter(img => img && img.trim()).length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {location.images.filter(img => img && img.trim()).map((img, idx) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#3a3a3c]">
                  <img
                    src={img}
                    alt={`${location.name} memory ${idx + 1}`}
                    className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#2c2c2e] border border-[#3a3a3c] rounded-lg p-8 text-center">
              <span className="text-3xl block mb-2">{PANEL_NO_PHOTOS_EMOJI}</span>
              <p className="text-xs text-gray-500 font-pixel">{PANEL_NO_PHOTOS_TEXT}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
