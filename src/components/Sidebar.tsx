import React from "react";
import { LocationData } from "../types";
import { SIDEBAR_TITLE } from "../config";

interface SidebarProps {
  locations: LocationData[];
  onSelect: (location: LocationData) => void;
  selectedId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  locations,
  onSelect,
  selectedId,
}) => {
  return (
    <div className="hidden md:flex flex-col w-72 bg-[#0a0a0a] border-l border-[#333] h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#333]">
        <div className="flex items-center gap-2 text-[#666] text-xs font-pixel uppercase tracking-widest">
          <span className="text-[#ff2d95]">◈</span>
          {SIDEBAR_TITLE}
        </div>
      </div>

      {/* Locations list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {locations.map((loc, index) => (
            <button
              key={loc.id}
              onClick={() => onSelect(loc)}
              className={`w-full text-left p-3 transition-all font-pixel text-sm border ${
                selectedId === loc.id
                  ? "bg-[#ff2d95]/10 border-[#ff2d95] text-[#ff2d95]"
                  : "bg-transparent border-[#333] text-[#888] hover:border-[#555] hover:text-[#ccc]"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-[#555] text-xs mt-0.5">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <div className="uppercase tracking-wide">{loc.name}</div>
                  {loc.date && (
                    <div className="text-xs text-[#555] mt-1">{loc.date}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#333]">
        <div className="text-[10px] text-[#444] font-pixel uppercase tracking-widest">
          {locations.length} Locations
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
