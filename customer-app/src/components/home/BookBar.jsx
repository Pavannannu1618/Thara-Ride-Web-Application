import { FARE_CONFIG } from '../../utils/fareUtils';

/**
 * BookBar
 * Shows a fare summary strip and the main Book button.
 * Only renders when destination + fare are available.
 *
 * Props:
 *   selectedType    — e.g. 'mini'
 *   destination     — { fares, roadKm, duration }
 *   onBook()        — called when Book button is tapped
 */
const BookBar = ({ selectedType, destination, onBook }) => {
  const cfg  = FARE_CONFIG[selectedType];
  const fare = destination?.fares?.[selectedType];

  if (!destination || !fare) return null;

  return (
    <div className="mx-4 mt-4">
      {/* Fare summary strip */}
      <div className="flex items-center justify-between px-4 py-2.5 mb-2
                      bg-white/3 border border-white/8 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl">{cfg.icon}</span>
          <div>
            <p className="text-white/60 text-xs">{cfg.label}</p>
            <p className="text-white/30 text-[10px]">
              {destination.roadKm} km • {destination.duration}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-bold text-lg">₹{fare}</p>
          <p className="text-white/30 text-[10px]">est. fare</p>
        </div>
      </div>

      {/* Book button */}
      <button
        onClick={onBook}
        className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold
                   py-4 rounded-xl transition-colors active:scale-[0.98] text-base"
      >
        Book {cfg.label} · ₹{fare} →
      </button>
    </div>
  );
};

export default BookBar;