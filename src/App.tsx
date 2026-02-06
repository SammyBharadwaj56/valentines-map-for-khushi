import React, { useState, useCallback, useRef } from 'react';
import MapComponent, { MapComponentHandle } from './components/MapComponent';
import PolaroidCard, { PolaroidCardHandle } from './components/PolaroidCard';
import IntroOverlay from './components/IntroOverlay';
import Sidebar from './components/Sidebar';
import HandTracking from './components/HandTracking';
import {
  LOCATIONS,
  HEADER_TITLE,
} from './config';
import { LocationData } from './types';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [currentZoom, setCurrentZoom] = useState(3);
  const [handTrackingEnabled, setHandTrackingEnabled] = useState(false);

  const mapRef = useRef<MapComponentHandle>(null);
  const polaroidRef = useRef<PolaroidCardHandle>(null);

  const handleLocationClick = useCallback((loc: LocationData) => {
    setSelectedLocation(loc);
  }, []);

  const handleMapClick = useCallback(() => {
    // Don't close on map click - only close via the polaroid close button
  }, []);

  const handleStart = useCallback(() => {
    setShowIntro(false);
  }, []);

  // Hand tracking callbacks
  const handleHandPan = useCallback((dx: number, dy: number) => {
    mapRef.current?.panBy(dx, dy);
  }, []);

  const handleHandZoom = useCallback((delta: number) => {
    mapRef.current?.zoomBy(delta);
  }, []);

  const handleMarkerHover = useCallback((x: number, y: number): string | null => {
    return mapRef.current?.getMarkerAtPoint(x, y) || null;
  }, []);

  const handleMarkerClick = useCallback((markerId: string) => {
    const location = LOCATIONS.find(loc => loc.id === markerId);
    if (location) {
      setSelectedLocation(location);
    }
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] overflow-hidden">
      {showIntro && <IntroOverlay onStart={handleStart} />}

      {/* Full-page tactical layout */}
      <div className="w-full h-full flex flex-col bg-[#0a0a0a] overflow-hidden">
        {/* Header bar */}
        <header className="flex items-center px-6 py-3 bg-[#0a0a0a] border-b border-[#333]">
          <div className="flex items-center gap-2">
            <span className="text-[#ff2d95]">◈</span>
            <h1 className="font-pixel text-sm text-[#888] uppercase tracking-widest">
              {HEADER_TITLE}
            </h1>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-6 text-xs font-pixel">
            <div className="text-[#555]">
              ZOOM: <span className="text-[#888]">{currentZoom.toFixed(1)}x</span>
            </div>
            <div className="text-[#555]">
              MARKERS: <span className="text-[#ff2d95]">{LOCATIONS.length}</span>
            </div>
            {/* Hand tracking toggle */}
            <button
              onClick={() => setHandTrackingEnabled(!handTrackingEnabled)}
              className={`px-3 py-1 border rounded transition-all ${
                handTrackingEnabled
                  ? 'border-[#ff2d95] text-[#ff2d95] bg-[#ff2d95]/10'
                  : 'border-[#444] text-[#666] hover:border-[#666]'
              }`}
            >
              ✋ {handTrackingEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map View */}
          <main className="flex-1 relative">
            <MapComponent
              ref={mapRef}
              locations={LOCATIONS}
              selectedLocation={selectedLocation}
              onLocationClick={handleLocationClick}
              onMapClick={handleMapClick}
              onZoomChange={setCurrentZoom}
            />
            {/* Grid overlay */}
            <div className="map-grid-overlay" />
            {/* Subtle scanlines */}
            <div className="map-scanlines" />
          </main>

          {/* Sidebar Nav - Right side */}
          <Sidebar
            locations={LOCATIONS}
            onSelect={handleLocationClick}
            selectedId={selectedLocation?.id}
          />
        </div>
      </div>

      {/* Polaroid Card Modal */}
      <PolaroidCard
        ref={polaroidRef}
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
      />

      {/* Hand Tracking Layer */}
      <HandTracking
        enabled={handTrackingEnabled}
        onPan={handleHandPan}
        onZoom={handleHandZoom}
        onMarkerHover={handleMarkerHover}
        onMarkerClick={handleMarkerClick}
        polaroidOpen={!!selectedLocation}
        onSwipeLeft={() => polaroidRef.current?.nextImage()}
        onSwipeRight={() => polaroidRef.current?.prevImage()}
      />
    </div>
  );
};

export default App;
