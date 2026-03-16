/**
 * DestinationPill
 * Shows the selected destination address + distance / duration summary.
 * The bookmark icon triggers the Save Address modal.
 *
 * Props:
 *   destination  — { address, roadKm, duration }
 *   onSave()     — open save address modal
 */
const DestinationPill = ({ destination, onSave }) => {
  if (!destination) return null;

  return (
    <div className="mt-3 bg-amber-400/5 border border-amber-400/20 rounded-xl px-3 py-3">

      {/* Address row */}
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor"
             viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87
                   -3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5
                   2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <p className="text-amber-400 text-xs flex-1 leading-relaxed line-clamp-2">
          {destination.address}
        </p>
        {/* Save shortcut */}
        <button
          onClick={onSave}
          title="Save this address"
          className="text-white/30 hover:text-amber-400 transition-colors flex-shrink-0 ml-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
          </svg>
        </button>
      </div>

      {/* Route summary */}
      {destination.roadKm && (
        <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-amber-400/15">
          {/* Distance */}
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9
                   7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1
                   1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>
            <span className="text-cyan-400 text-xs font-semibold">
              {destination.roadKm} km
            </span>
          </div>

          <span className="text-white/20 text-xs">•</span>

          {/* Duration */}
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="text-white/40 text-xs">{destination.duration}</span>
          </div>

          <span className="text-white/20 text-xs">•</span>
          <span className="text-white/25 text-xs">via fastest route</span>
        </div>
      )}
    </div>
  );
};

export default DestinationPill;