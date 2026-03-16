import { useState, useRef, useCallback } from 'react';

// ── Nominatim (OpenStreetMap) — free, no API key needed ──
const searchNominatim = async (query) => {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      q:               query,
      format:          'json',
      addressdetails:  1,
      limit:           6,
      countrycodes:    'in',
      'accept-language': 'en',
    });

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en' }
  });
  if (!res.ok) return [];
  return res.json();
};

const reverseGeocode = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?` +
    new URLSearchParams({ lat, lon: lng, format: 'json' });
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.display_name || null;
};

export { searchNominatim, reverseGeocode };

// ── Autocomplete input component ──
const PlacesSearch = ({ value, onChange, onSelect, placeholder = 'Search destination...' }) => {
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState(false);
  const debounce   = useRef(null);

  const handleChange = useCallback((text) => {
    onChange(text);
    clearTimeout(debounce.current);
    if (!text.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchNominatim(text);
        setResults(data);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 400);
  }, [onChange]);

  const handleSelect = (item) => {
    const address = item.display_name;
    const coords  = [parseFloat(item.lon), parseFloat(item.lat)];
    onChange(address);
    setResults([]);
    setFocused(false);
    onSelect({ address, coordinates: coords });
  };

  // Format display name — show just first two parts
  const formatName = (display_name) => {
    const parts = display_name.split(',');
    return {
      main:      parts.slice(0, 2).join(',').trim(),
      secondary: parts.slice(2, 4).join(',').trim(),
    };
  };

  const showDropdown = focused && (loading || results.length > 0 || value.length > 1);

  return (
    <div className="relative">
      {/* Input */}
      <div className={`
        flex items-center gap-3 border rounded-xl px-4 py-3 transition-colors
        ${focused ? 'bg-white/8 border-amber-400/40' : 'bg-white/5 border-white/10'}
      `}>
        <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none"
             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8"/>
          <path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
          className="bg-transparent text-white placeholder-white/30 text-sm
                     outline-none flex-1 min-w-0"
        />
        {value && (
          <button
            onClick={() => { onChange(''); setResults([]); onSelect(null); }}
            className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50
                        bg-[#13131f] border border-white/10 rounded-xl
                        shadow-2xl overflow-hidden max-h-72 overflow-y-auto">

          {loading && (
            <div className="flex items-center gap-3 px-4 py-3 text-white/30 text-sm">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Searching...
            </div>
          )}

          {!loading && results.length === 0 && value.length > 1 && (
            <div className="px-4 py-3 text-white/30 text-sm">
              No results for "{value}"
            </div>
          )}

          {results.map((item, i) => {
            const { main, secondary } = formatName(item.display_name);
            return (
              <button
                key={item.place_id || i}
                onMouseDown={() => handleSelect(item)}
                className={`
                  w-full flex items-start gap-3 px-4 py-3 text-left
                  hover:bg-white/5 transition-colors
                  ${i < results.length - 1 ? 'border-b border-white/5' : ''}
                `}
              >
                <div className="w-7 h-7 rounded-lg bg-amber-400/10 flex items-center
                                justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827
                         0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{main}</p>
                  {secondary && (
                    <p className="text-white/40 text-xs truncate mt-0.5">{secondary}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlacesSearch;