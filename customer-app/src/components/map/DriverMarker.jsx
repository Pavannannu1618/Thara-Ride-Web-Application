import React, { useEffect, useRef } from 'react';

// ── Animated Driver Marker for Google Maps ──
const DriverMarker = ({ map, position, heading = 0, rideType = 'mini' }) => {
  const markerRef = useRef(null);
  const overlayRef = useRef(null);

  const vehicleEmoji = {
    bike:  '🏍️',
    auto:  '🛺',
    mini:  '🚗',
    sedan: '🚙',
    suv:   '🚐',
    pool:  '🚌',
  }[rideType] || '🚗';

  useEffect(() => {
    if (!map || !position || !window.google) return;

    // Remove old marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Create advanced marker or fallback
    try {
      const { AdvancedMarkerElement } = window.google.maps.marker || {};

      if (AdvancedMarkerElement) {
        // ── Google Maps Advanced Marker ──
        const el = document.createElement('div');
        el.style.cssText = `
          width: 44px; height: 44px;
          background: #1e1e2e;
          border: 2px solid #f97316;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 4px 20px rgba(249,115,22,0.4);
          transform: rotate(${heading}deg);
          transition: transform 0.5s ease;
        `;
        el.innerHTML = vehicleEmoji;

        markerRef.current = new AdvancedMarkerElement({
          map,
          position: { lat: position.lat, lng: position.lng },
          content: el,
          title: 'Your Driver',
        });
      } else {
        // ── Fallback: Standard Marker ──
        markerRef.current = new window.google.maps.Marker({
          map,
          position: { lat: position.lat, lng: position.lng },
          title: 'Your Driver',
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#f97316',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            rotation: heading,
          },
        });
      }
    } catch (err) {
      console.warn('DriverMarker error:', err);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [map, position?.lat, position?.lng, heading, rideType]);

  // Update heading without recreating marker
  useEffect(() => {
    if (!markerRef.current || !heading) return;
    try {
      const content = markerRef.current.content;
      if (content) content.style.transform = `rotate(${heading}deg)`;
      else if (markerRef.current.setIcon) {
        const icon = markerRef.current.getIcon();
        markerRef.current.setIcon({ ...icon, rotation: heading });
      }
    } catch {}
  }, [heading]);

  return null; // Renders via Google Maps API, not React DOM
};

// ── Standalone HTML Driver Pin (for non-Google Maps use) ──
export const DriverPin = ({ heading = 0, rideType = 'mini', size = 44, animated = true }) => {
  const vehicleEmoji = {
    bike: '🏍️', auto: '🛺', mini: '🚗', sedan: '🚙', suv: '🚐',
  }[rideType] || '🚗';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Pulse ring */}
      {animated && (
        <>
          <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping" />
          <div className="absolute inset-1 rounded-full bg-primary-500/10 animate-ping"
            style={{ animationDelay: '0.3s' }} />
        </>
      )}
      {/* Vehicle icon */}
      <div
        className="relative z-10 bg-dark-800 border-2 border-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30"
        style={{
          width: size, height: size,
          fontSize: size * 0.45,
          transform: `rotate(${heading}deg)`,
          transition: 'transform 0.5s ease',
        }}
      >
        {vehicleEmoji}
      </div>
    </div>
  );
};

export default DriverMarker;