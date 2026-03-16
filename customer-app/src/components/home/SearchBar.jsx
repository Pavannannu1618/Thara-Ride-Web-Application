import { useRef }   from 'react';
import { formatPlace } from '../../utils/geoUtils';

/**
 * SearchBar — the destination input + autocomplete dropdown.
 *
 * Props:
 *   inputText, onInputChange, onClear
 *   suggestions, sugLoading, showDropdown
 *   focused, onFocus, onBlur
 *   onSelectSuggestion(item)
 *   onOpenMapPicker()
 *   cityName
 */
const SearchBar = ({
  inputText,
  onInputChange,
  onClear,
  suggestions,
  sugLoading,
  showDropdown,
  focused,
  onFocus,
  onBlur,
  onSelectSuggestion,
  onOpenMapPicker,
  cityName,
}) => {
  const inputRef = useRef(null);

  return (
    <div className="relative">
      {/* ── Input row ── */}
      <div className={`
        flex items-center gap-3 border rounded-xl px-4 py-3 transition-colors duration-200
        ${focused ? 'bg-white/8 border-amber-400/40' : 'bg-white/5 border-white/10'}
      `}>
        {/* Search icon */}
        <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none"
             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8"/>
          <path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={onFocus}
          onBlur={() => setTimeout(onBlur, 200)}
          placeholder={`Search in ${cityName || 'your city'}...`}
          className="bg-transparent text-white placeholder-white/30 text-sm
                     outline-none flex-1 min-w-0"
        />

        {/* Right icon — clear or map pin */}
        {inputText ? (
          <button onClick={onClear}
                  className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        ) : (
          <button onClick={onOpenMapPicker}
                  title="Pick on map"
                  className="text-white/30 hover:text-amber-400 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827
                   0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Autocomplete Dropdown ── */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50
                        bg-[#11111e] border border-white/10 rounded-2xl
                        shadow-2xl overflow-hidden max-h-80 overflow-y-auto">

          {/* Loading */}
          {sugLoading && (
            <div className="flex items-center gap-3 px-4 py-3 text-white/30 text-sm">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Searching nearby places...
            </div>
          )}

          {/* No results */}
          {!sugLoading && suggestions.length === 0 && inputText.length > 1 && (
            <div className="px-4 py-4 text-center">
              <p className="text-white/30 text-sm">
                No results for <span className="text-white/60">"{inputText}"</span>
              </p>
              <p className="text-white/20 text-xs mt-1">
                Try a spelling fix or nearby landmark
              </p>
            </div>
          )}

          {/* Suggestion rows */}
          {suggestions.map((item, i) => {
            const { main, secondary } = formatPlace(item.display_name);
            return (
              <button
                key={item.place_id || i}
                onMouseDown={() => onSelectSuggestion(item)}
                className={`
                  w-full flex items-start gap-3 px-4 py-3 text-left
                  hover:bg-white/5 active:bg-amber-400/5 transition-colors
                  ${i < suggestions.length - 1 ? 'border-b border-white/5' : ''}
                `}
              >
                {/* Pin icon */}
                <div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center
                                justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-400" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827
                         0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>

                {/* Text + badges */}
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{main}</p>
                  {secondary && (
                    <p className="text-white/35 text-xs truncate mt-0.5">{secondary}</p>
                  )}

                  {item.distanceKm !== null && (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {/* km badge */}
                      <span className="flex items-center gap-1 text-[10px] font-medium
                                       bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded-full">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447
                               -.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021
                               18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                        </svg>
                        {item.roadKm} km
                      </span>

                      {/* Duration badge */}
                      <span className="flex items-center gap-1 text-[10px] font-medium
                                       bg-white/8 text-white/40 px-2 py-0.5 rounded-full">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {item.duration}
                      </span>

                      {/* Fare range */}
                      {item.fares && (
                        <span className="text-[10px] font-medium text-amber-400">
                          ₹{item.fares.bike}–₹{item.fares.suv}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Map picker option */}
          <button
            onMouseDown={onOpenMapPicker}
            className="w-full flex items-center gap-3 px-4 py-3 border-t border-white/5
                       hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-400/10 flex items-center
                            justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="8" height="8" rx="1"/>
                <rect x="13" y="3" width="8" height="8" rx="1"/>
                <rect x="3" y="13" width="8" height="8" rx="1"/>
                <rect x="13" y="13" width="8" height="8" rx="1"/>
              </svg>
            </div>
            <span className="text-cyan-400 text-sm font-medium">
              Pick exact location on map
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;