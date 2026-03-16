import { useEffect, useRef, useState } from 'react';
import { reverseGeocode }              from './PlacesSearch';

// ── Leaflet (free OpenStreetMap, no API key) ──
// Add to index.html: <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
// Add to index.html: <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

const MapPicker = ({ initialLocation, onSelect, onClose }) => {
  const mapRef    = useRef(null);
  const mapObj    = useRef(null);
  const markerRef = useRef(null);

  const [address,    setAddress]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [coords,     setCoords]     = useState(null);

  const defaultLat = initialLocation ? initialLocation[1] : 12.9716;
  const defaultLng = initialLocation ? initialLocation[0] : 77.5946;

  const doReverseGeocode = async (lat, lng) => {
    setLoading(true);
    try {
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setLoading(false);
    }
    setCoords([lng, lat]);
  };

  useEffect(() => {
    if (!window.L) {
      setAddress('Map library not loaded');
      return;
    }

    const L   = window.L;
    const map = L.map(mapRef.current, { zoomControl: true }).setView(
      [defaultLat, defaultLng], 15
    );

    // Dark tile layer (CartoDB dark)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains:  'abcd',
        maxZoom:     19,
      }
    ).addTo(map);

    // Custom amber marker
    const icon = L.divIcon({
      html: `<div style="
        width:24px;height:24px;
        background:#f59e0b;
        border:3px solid #fff;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
      "></div>`,
      iconSize:   [24, 24],
      iconAnchor: [12, 24],
      className:  '',
    });

    const marker = L.marker([defaultLat, defaultLng], { icon, draggable: true })
      .addTo(map);
    markerRef.current = marker;

    doReverseGeocode(defaultLat, defaultLng);

    // Click to move marker
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      doReverseGeocode(lat, lng);
    });

    // Drag marker
    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      doReverseGeocode(lat, lng);
    });

    mapObj.current = map;

    return () => { map.remove(); };
  }, []); // eslint-disable-line

  const handleConfirm = () => {
    if (!address || !coords) return;
    setConfirming(true);
    onSelect({ address, coordinates: coords });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07070e]">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-4 bg-[#07070e]
                      border-b border-white/10 flex-shrink-0">
        <button onClick={onClose}
                className="text-white/50 hover:text-white transition-colors p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h2 className="text-white font-semibold text-sm">Pick Destination</h2>
          <p className="text-white/40 text-xs">Tap or drag the pin to set location</p>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: 0 }} />

        {/* No Leaflet fallback */}
        {!window.L && (
          <div className="absolute inset-0 flex flex-col items-center justify-center
                          bg-[#0d0d1a] text-white/40 text-sm text-center px-8 gap-3">
            <div className="text-4xl">🗺️</div>
            <p className="font-medium text-white/60">Map not loaded</p>
            <p className="text-xs">Add Leaflet to index.html (see below)</p>
          </div>
        )}
      </div>

      {/* Bottom confirm */}
      <div className="px-4 pt-4 pb-6 bg-[#07070e] border-t border-white/10 flex-shrink-0">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center
                          justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75
                       7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12
                       -2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/40 text-xs mb-0.5">Selected location</p>
            {loading ? (
              <div className="h-4 bg-white/10 rounded animate-pulse w-48"/>
            ) : (
              <p className="text-white text-sm leading-tight line-clamp-2">
                {address || 'Tap map to select'}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!address || !coords || loading || confirming}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40
                     text-black font-bold py-4 rounded-xl transition-colors
                     active:scale-[0.98] disabled:cursor-not-allowed"
        >
          {confirming ? 'Setting destination...' : 'Confirm Destination'}
        </button>
      </div>
    </div>
  );
};

export default MapPicker;