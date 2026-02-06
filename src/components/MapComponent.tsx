import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as L from 'leaflet';
import { LocationData } from '../types';

const HEART_SVG = `
  <svg viewBox="0 0 32 32" class="heart-marker" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 28.2l-1.9-1.7C7.4 20.3 3 16.3 3 11.5 3 7.6 6.1 4.5 10 4.5c2.2 0 4.3 1 5.7 2.7 1.4-1.7 3.5-2.7 5.7-2.7 3.9 0 7 3.1 7 7 0 4.8-4.4 8.8-11.1 15l-1.6 1.7z" fill="#ff2d95" stroke="#0ff" stroke-width="2"/>
    <circle cx="16" cy="11" r="3" fill="rgba(255,255,255,0.4)" />
  </svg>
`;

export interface MapComponentHandle {
  panBy: (dx: number, dy: number) => void;
  zoomBy: (delta: number) => void;
  getMarkerAtPoint: (x: number, y: number) => string | null;
}

interface MapComponentProps {
  locations: LocationData[];
  selectedLocation: LocationData | null;
  onLocationClick: (loc: LocationData) => void;
  onMapClick: () => void;
  onZoomChange: (zoom: number) => void;
}

const MapComponent = forwardRef<MapComponentHandle, MapComponentProps>(({
  locations,
  selectedLocation,
  onLocationClick,
  onMapClick,
  onZoomChange
}, ref) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    panBy: (dx: number, dy: number) => {
      if (mapRef.current) {
        mapRef.current.panBy([dx, dy], { animate: false });
      }
    },
    zoomBy: (delta: number) => {
      if (mapRef.current) {
        const currentZoom = mapRef.current.getZoom();
        const newZoom = currentZoom + delta * 0.5;
        console.log(`[ZOOM] delta=${delta}, current=${currentZoom}, new=${newZoom}`);
        mapRef.current.setZoom(newZoom, { animate: true });
      } else {
        console.log('[ZOOM] mapRef.current is null!');
      }
    },
    getMarkerAtPoint: (x: number, y: number) => {
      if (!mapRef.current || !containerRef.current) return null;

      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeX = x - containerRect.left;
      const relativeY = y - containerRect.top;

      // Check each marker
      for (const [locId, marker] of Object.entries(markersRef.current)) {
        const markerPoint = mapRef.current.latLngToContainerPoint(marker.getLatLng());
        const distance = Math.hypot(markerPoint.x - relativeX, markerPoint.y - relativeY);

        if (distance < 30) { // 30px threshold
          return locId;
        }
      }

      return null;
    },
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 3,
      minZoom: 1,
      maxZoom: 18,
      zoomControl: false,
      worldCopyJump: true
    });

    // Dark map tiles (CartoDB Dark Matter - free, no API key needed)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Zoom controls at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.on('zoomend', () => {
      onZoomChange(map.getZoom());
    });

    map.on('click', () => {
      onMapClick();
    });

    mapRef.current = map;

    // Add markers
    locations.forEach((loc) => {
      // Add a soft glow circle around the city
      L.circle(loc.coords, {
        radius: 80000,
        fillColor: '#ff2d95',
        fillOpacity: 0.15,
        stroke: false,
        interactive: false
      }).addTo(map);

      // Add the heart marker
      const icon = L.divIcon({
        html: HEART_SVG,
        className: 'custom-heart-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const tooltipContent = `
        <div style="font-weight: bold; margin-bottom: 4px;">${loc.name}</div>
        <div style="font-size: 11px; color: #888;">LAT: ${loc.coords[0].toFixed(4)} LNG: ${loc.coords[1].toFixed(4)}</div>
      `;
      const marker = L.marker(loc.coords, { icon })
        .addTo(map)
        .bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -20],
          className: 'custom-tooltip'
        })
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onLocationClick(loc);
        });

      markersRef.current[loc.id] = marker;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = {};
    };
  }, [locations, onLocationClick, onMapClick, onZoomChange]);

  // Sync selection with a smooth flyTo animation
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      mapRef.current.flyTo(selectedLocation.coords, 8, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [selectedLocation]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" style={{ background: '#0a0a0a' }} />;
});

MapComponent.displayName = 'MapComponent';

export default MapComponent;
