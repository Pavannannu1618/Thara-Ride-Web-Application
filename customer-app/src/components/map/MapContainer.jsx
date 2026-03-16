import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { GOOGLE_MAPS_KEY } from '../../constants';
import { DriverPin } from './DriverMarker';
import { Navigation, MapPin, ZoomIn, ZoomOut, Crosshair } from 'lucide-react';

// ── Fallback Map (no Google Maps key) ──
const FallbackMap = ({ pickup, destination, driverLocation, height }) => (
  <div
    style={{ height }}
    className="relative w-full bg-gradient-to-br from-slate-900 via-dark-800 to-dark-900 rounded-2xl overflow-hidden border border-white/10"
  >
    {/* Grid background */}
    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage:
          'linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />

    {/* Map label */}
    <div className="absolute top-3 left-3 bg-dark-800/80 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/10">
      <p className="text-xs text-white/60">🗺 Live Map</p>
    </div>

    {/* Pickup pin */}
    {pickup && (
      <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center gap-1">
          <div className="w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg shadow-green-400/50" />
          <div className="text-xs text-green-400 bg-dark-800/90 px-2 py-0.5 rounded-lg border border-green-400/20 whitespace-nowrap max-w-xs truncate">
            📍 {pickup?.address ? pickup.address.split(',')[0] : 'Pickup'}
          </div>
        </div>
      </div>
    )}

    {/* Destination pin */}
    {destination && (
      <div className="absolute bottom-1/3 right-1/3 transform translate-x-1/2 translate-y-1/2">
        <div className="flex flex-col items-center gap-1">
          <MapPin size={20} className="text-primary-500 drop-shadow-lg" />
          <div className="text-xs text-primary-400 bg-dark-800/90 px-2 py-0.5 rounded-lg border border-primary-400/20 whitespace-nowrap max-w-xs truncate">
            🏁 {destination?.address ? destination.address.split(',')[0] : 'Drop'}
          </div>
        </div>
      </div>
    )}

    {/* Route line */}
    {pickup && destination && (
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <line
          x1="33%" y1="33%"
          x2="67%" y2="67%"
          stroke="url(#routeGrad)"
          strokeWidth="3"
          strokeDasharray="10,5"
        />
      </svg>
    )}

    {/* Driver marker */}
    {driverLocation && (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <DriverPin heading={driverLocation.heading || 0} animated />
      </div>
    )}

    {/* No key notice */}
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500/20 border border-yellow-500/30 rounded-xl px-3 py-1.5 whitespace-nowrap">
      <p className="text-xs text-yellow-400">Add VITE_GOOGLE_MAPS_KEY for live map</p>
    </div>
  </div>
);

// ── Dark Map Style ──
const darkMapStyle = [
  { elementType: 'geometry',             stylers: [{ color: '#1e1e2e' }] },
  { elementType: 'labels.text.stroke',   stylers: [{ color: '#1e1e2e' }] },
  { elementType: 'labels.text.fill',     stylers: [{ color: '#6b7280' }] },
  { featureType: 'road',                 elementType: 'geometry',        stylers: [{ color: '#2d2d3f' }] },
  { featureType: 'road.arterial',        elementType: 'geometry',        stylers: [{ color: '#373752' }] },
  { featureType: 'road.highway',         elementType: 'geometry',        stylers: [{ color: '#3f3f5a' }] },
  { featureType: 'road.highway',         elementType: 'geometry.stroke', stylers: [{ color: '#1e1e2e' }] },
  { featureType: 'water',                elementType: 'geometry',        stylers: [{ color: '#0f0f1a' }] },
  { featureType: 'poi',                  elementType: 'geometry',        stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'poi.park',             elementType: 'geometry',        stylers: [{ color: '#1a2e1a' }] },
  { featureType: 'transit',              elementType: 'geometry',        stylers: [{ color: '#2d2d3f' }] },
  { featureType: 'administrative',       elementType: 'geometry.stroke', stylers: [{ color: '#3f3f5a' }] },
];

// ── Google Maps Loader ──
let _mapsReady = false;
let _mapsLoading = false;
const _mapsCallbacks = [];

const loadGoogleMaps = (apiKey) => {
  return new Promise((resolve) => {
    // No key — skip entirely, use fallback
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_KEY') {
      resolve(false);
      return;
    }

    // Already loaded
    if (_mapsReady && window.google?.maps) {
      resolve(true);
      return;
    }

    _mapsCallbacks.push(resolve);

    if (_mapsLoading) return;
    _mapsLoading = true;

    window.__googleMapsReady = () => {
      _mapsReady = true;
      _mapsLoading = false;
      _mapsCallbacks.forEach((cb) => cb(true));
      _mapsCallbacks.length = 0;
    };

    const script = document.createElement('script');
    script.src =
      'https://maps.googleapis.com/maps/api/js?key=' +
      apiKey +
      '&libraries=places,marker&callback=__googleMapsReady';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      _mapsLoading = false;
      _mapsCallbacks.forEach((cb) => cb(false));
      _mapsCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
};

// ── Main MapContainer ──
const MapContainer = ({ height = '40vh', showControls = true, className = '' }) => {
  const mapDivRef    = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef   = useRef({});

  const [mapsReady, setMapsReady] = useState(false);

  const { pickup, destination, driverLocation } = useSelector((s) => s.ride);

  // Load Google Maps script
  useEffect(() => {
    loadGoogleMaps(GOOGLE_MAPS_KEY).then((ready) => {
      setMapsReady(ready);
    });
  }, []);

  // Initialize map instance
  useEffect(() => {
    if (!mapsReady || !mapDivRef.current || googleMapRef.current) return;
    if (!window.google?.maps) return; // ✅ guard

    const center = pickup?.location?.coordinates
      ? { lat: pickup.location.coordinates[1], lng: pickup.location.coordinates[0] }
      : { lat: 12.9716, lng: 77.5946 };

    googleMapRef.current = new window.google.maps.Map(mapDivRef.current, {
      center,
      zoom: 14,
      disableDefaultUI: true,
      styles: darkMapStyle,
      gestureHandling: 'greedy',
    });
  }, [mapsReady]);

  // Pickup marker
  useEffect(() => {
    if (!googleMapRef.current || !pickup?.location?.coordinates) return;
    if (!window.google?.maps) return; // ✅ guard
    const [lng, lat] = pickup.location.coordinates;

    if (markersRef.current.pickup) markersRef.current.pickup.setMap(null);
    markersRef.current.pickup = new window.google.maps.Marker({
      map: googleMapRef.current,
      position: { lat, lng },
      title: 'Pickup',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#22c55e',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });
    googleMapRef.current.panTo({ lat, lng });
  }, [pickup, mapsReady]);

  // Destination marker
  useEffect(() => {
    if (!googleMapRef.current || !destination?.location?.coordinates) return;
    if (!window.google?.maps) return; // ✅ guard
    const [lng, lat] = destination.location.coordinates;

    if (markersRef.current.destination) markersRef.current.destination.setMap(null);
    markersRef.current.destination = new window.google.maps.Marker({
      map: googleMapRef.current,
      position: { lat, lng },
      title: 'Destination',
      icon: {
        path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#f97316',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    // Fit both markers in view
    if (pickup?.location?.coordinates) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: pickup.location.coordinates[1], lng: pickup.location.coordinates[0] });
      bounds.extend({ lat, lng });
      googleMapRef.current.fitBounds(bounds, { padding: 60 });
    }
  }, [destination, mapsReady]);

  // Driver marker
  useEffect(() => {
    if (!googleMapRef.current || !driverLocation) return;
    if (!window.google?.maps) return; // ✅ guard
    const { lat, lng, heading } = driverLocation;

    if (markersRef.current.driver) {
      markersRef.current.driver.setPosition({ lat, lng });
      const icon = markersRef.current.driver.getIcon();
      markersRef.current.driver.setIcon({ ...icon, rotation: heading || 0 });
    } else {
      markersRef.current.driver = new window.google.maps.Marker({
        map: googleMapRef.current,
        position: { lat, lng },
        title: 'Driver',
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: '#f97316',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: heading || 0,
        },
      });
    }
    googleMapRef.current.panTo({ lat, lng });
  }, [driverLocation, mapsReady]);

  const handleZoomIn  = () => googleMapRef.current?.setZoom((googleMapRef.current.getZoom() || 14) + 1);
  const handleZoomOut = () => googleMapRef.current?.setZoom((googleMapRef.current.getZoom() || 14) - 1);
  const handleCenter  = () => {
    const loc = driverLocation || (pickup?.location?.coordinates && {
      lat: pickup.location.coordinates[1],
      lng: pickup.location.coordinates[0],
    });
    if (loc) googleMapRef.current?.panTo(loc);
  };

  // ✅ Always show fallback if no key or maps not loaded
  if (!mapsReady) {
    return (
      <FallbackMap
        pickup={pickup?.location}
        destination={destination?.location}
        driverLocation={driverLocation}
        height={height}
      />
    );
  }

  return (
    <div className={'relative w-full rounded-2xl overflow-hidden ' + className} style={{ height }}>
      <div ref={mapDivRef} className="w-full h-full" />

      {showControls && (
        <div className="absolute right-3 bottom-6 flex flex-col gap-2">
          {[
            { icon: ZoomIn,    onClick: handleZoomIn,  label: 'Zoom in'  },
            { icon: ZoomOut,   onClick: handleZoomOut, label: 'Zoom out' },
            { icon: Crosshair, onClick: handleCenter,  label: 'Center'   },
          ].map(({ icon: Icon, onClick, label }) => (
            <button
              key={label}
              onClick={onClick}
              className="w-10 h-10 bg-dark-800/90 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center shadow-lg hover:bg-dark-800 transition-colors"
            >
              <Icon size={16} className="text-white" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapContainer;