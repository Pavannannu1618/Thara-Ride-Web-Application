import { RIDE_TYPES } from '../../utils/fareUtils';

// Badges shown on certain ride types
const BADGES = {
  pool: { text: 'CHEAPEST', className: 'bg-green-500/20 text-green-400' },
  mini: { text: 'POPULAR',  className: 'bg-amber-400/20 text-amber-400' },
};

/**
 * RideSelector
 * Displays all ride types as selectable rows.
 * Shows per-type fare based on destination distance.
 *
 * Props:
 *   selectedType   — currently selected ride type key
 *   onSelect(type) — called when user taps a row
 *   destination    — { fares: { bike, auto, ... }, roadKm, duration } | null
 */
const RideSelector = ({ selectedType, onSelect, destination }) => (
  <div className="mx-4 mt-4">
    <div className="flex items-center justify-between mb-3">
      <p className="text-white/40 text-xs uppercase tracking-widest">Choose a ride</p>
      {destination?.roadKm && (
        <span className="text-white/25 text-xs">{destination.roadKm} km route</span>
      )}
    </div>

    <div className="space-y-2">
      {RIDE_TYPES.map((r) => {
        const fare     = destination?.fares?.[r.type] ?? r.minFare;
        const isActive = selectedType === r.type;
        const badge    = BADGES[r.type];

        return (
          <button
            key={r.type}
            onClick={() => onSelect(r.type)}
            className={`
              w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border
              transition-all active:scale-[0.99]
              ${isActive
                ? 'bg-amber-400/12 border-amber-400/50'
                : 'bg-white/4 border-white/8 hover:bg-white/7 hover:border-white/15'}
            `}
          >
            {/* Icon */}
            <span className="text-2xl w-8 text-center flex-shrink-0">{r.icon}</span>

            {/* Label + badge + duration */}
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold text-sm
                  ${isActive ? 'text-amber-400' : 'text-white'}`}>
                  {r.label}
                </span>
                {badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium
                                    ${badge.className}`}>
                    {badge.text}
                  </span>
                )}
              </div>
              <p className="text-white/30 text-xs mt-0.5">
                {destination?.duration
                  ? `~${destination.duration} away`
                  : 'Available nearby'}
              </p>
            </div>

            {/* Fare */}
            <div className="text-right flex-shrink-0">
              <p className={`font-bold text-base ${isActive ? 'text-amber-400' : 'text-white'}`}>
                ₹{fare}
              </p>
              {destination?.roadKm && (
                <p className="text-white/25 text-[10px]">₹{r.perKm}/km</p>
              )}
            </div>

            {/* Radio indicator */}
            <div className={`
              w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
              ${isActive ? 'border-amber-400 bg-amber-400' : 'border-white/20'}
            `}>
              {isActive && (
                <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

export default RideSelector;