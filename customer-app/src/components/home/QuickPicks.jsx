import { useState } from 'react';
import { ArrowRight, Edit2, Trash2, MapPin, Home, Briefcase, Plane } from 'lucide-react';

export const QUICK_LABELS = [
  { label: 'Home',    icon: <Home size={18} />,      key: 'home'    },
  { label: 'Work',    icon: <Briefcase size={18} />, key: 'work'    },
  { label: 'Airport', icon: <Plane size={18} />,    key: 'airport' },
];

/**
 * QuickPicks
 * Shows Home / Work / Airport shortcut buttons + More menu.
 * An amber dot on the button indicates that address has already been saved.
 *
 * Props:
 *   savedAddresses  — from Redux user.savedAddresses
 *   selectedKey     — currently selected quick key
 *   onPick(key)     — called when a button is tapped
 *   onGoToSaved     — savedAddress => void
 *   onEditSaved     — savedAddress => void
 *   onRemoveSaved   — label => void
 */
const QuickPicks = ({
  savedAddresses = [],
  selectedKey,
  onPick,
  onGoToSaved,
  onEditSaved,
  onRemoveSaved,
}) => {
  const [showSaved, setShowSaved] = useState(false);

  const quicks = [...QUICK_LABELS, { label: 'More', icon: <MapPin size={18} />, key: 'more' }];

  const toggleSaved = () => {
    setShowSaved((prev) => !prev);
    onPick?.('more');
  };

  const handleGoToSaved = (item) => {
    onGoToSaved?.(item);
    setShowSaved(false);
  };

  return (
    <div className="space-y-2 mt-3 w-full">
      <div className="flex flex-wrap gap-2">
        {quicks.map((q) => {
          const active = q.key === 'more'
            ? showSaved
            : q.key === selectedKey;

          return (
            <button
              key={q.key}
              onClick={() => {
                if (q.key === 'more') {
                  toggleSaved();
                } else {
                  setShowSaved(false);
                  onPick?.(q.key);
                }
              }}
              className={`flex-1 min-w-[84px] py-2 px-2 rounded-xl border transition-all ${
                active
                  ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                {q.icon}
                <span className="text-xs uppercase tracking-wide whitespace-nowrap">{q.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {showSaved && savedAddresses.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
          {savedAddresses.map((item) => (
            <div
              key={item.label}
              className="bg-[#11131f] border border-white/10 rounded-lg p-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-amber-300 font-semibold uppercase tracking-wide mb-1">
                    {item.label?.charAt(0).toUpperCase() + item.label?.slice(1)}
                  </p>
                  <p className="text-white/60 text-[11px] line-clamp-2">{item.address}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    title="Edit"
                    onClick={() => onEditSaved?.(item)}
                    className="p-1 text-white/60 hover:text-white"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    title="Remove"
                    onClick={() => onRemoveSaved?.(item.label)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleGoToSaved(item)}
                className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded-xl bg-amber-400/15 border border-amber-400/40 px-2 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-400/25"
              >
                <ArrowRight size={14} />
                Go to {item.label?.charAt(0).toUpperCase() + item.label?.slice(1)}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickPicks;

