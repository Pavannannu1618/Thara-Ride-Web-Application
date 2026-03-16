// import React, { useEffect, useRef } from 'react';
import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { MapPin, Navigation } from 'lucide-react';

const LiveTrack = ({ height = '300px' }) => {
  const mapRef = useRef(null);
  const { pickup, destination, driverLocation } = useSelector((s) => s.ride);

  // Simple visual map representation (replace with Google Maps in production)
  const getStatusIndicator = () => {
    if (!driverLocation) return 'Locating driver...';
    return `Driver at ${driverLocation.lat?.toFixed(4)}, ${driverLocation.lng?.toFixed(4)}`;
  };

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className="relative w-full bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl overflow-hidden border border-white/10"
    >
      {/* Map Placeholder - In production use @react-google-maps/api */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          {/* Animated Map Grid */}
          <div className="grid grid-cols-8 gap-1 opacity-20 mb-4">
            {Array(32).fill(0).map((_, i) => (
              <div key={i} className="w-8 h-8 border border-white/20 rounded" />
            ))}
          </div>

          {/* Pickup Pin */}
          {pickup && (
            <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg" />
                <div className="text-xs text-green-400 mt-1 bg-dark-800/80 px-2 py-0.5 rounded">Pickup</div>
              </div>
            </div>
          )}

          {/* Destination Pin */}
          {destination && (
            <div className="absolute top-2/3 right-1/3 transform translate-x-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center">
                <MapPin size={20} className="text-primary-500" />
                <div className="text-xs text-primary-400 mt-1 bg-dark-800/80 px-2 py-0.5 rounded">Drop</div>
              </div>
            </div>
          )}

          {/* Driver Location */}
          {driverLocation && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400/30 rounded-full animate-ping" />
                <div className="relative w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <Navigation size={16} className="text-white" style={{ transform: `rotate(${driverLocation.heading || 0}deg)` }} />
                </div>
              </div>
            </div>
          )}

          <p className="text-white/40 text-xs mt-2">{getStatusIndicator()}</p>
        </div>
      </div>

      {/* Route Line Visual */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <path d="M 100,180 Q 200,100 300,200" stroke="url(#routeGrad)" strokeWidth="3" fill="none" strokeDasharray="8,4" />
      </svg>
    </div>
  );
};

export default LiveTrack;