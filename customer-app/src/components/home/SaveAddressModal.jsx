import { useState, useEffect } from 'react';
import { QUICK_LABELS } from './QuickPicks';

/**
 * SaveAddressModal
 * Bottom-sheet that lets the user tag a destination as Home / Work / Airport.
 *
 * Props:
 *   destination       — { address, coordinates }
 *   onSave(label, dest) — called with chosen label and destination object
 *   onClose()
 *   saving            — boolean, shows loading state on Save button
 *   initialLabel      — pre-selected label, e.g. 'home', 'work', or 'more'
 */
const SaveAddressModal = ({
  destination,
  onSave,
  onClose,
  saving = false,
  initialLabel = 'home',
}) => {
  const [saveLabel, setSaveLabel] = useState(initialLabel || 'home');
  const [customLabel, setCustomLabel] = useState('');
  const [addressText, setAddressText] = useState(destination?.address || '');

  // Reset state when destination or initial label changes
  useEffect(() => {
    setSaveLabel(initialLabel || 'home');
    setCustomLabel('');
    setAddressText(destination?.address || '');
  }, [destination, initialLabel]);

  if (!destination) return null;

  const chosenLabel = saveLabel === 'more' ? customLabel.trim() : saveLabel;
  const canSave = !!chosenLabel && !!addressText.trim();

  const labelButtons = [
    ...QUICK_LABELS,
    { label: 'More', icon: '➕', key: 'more' },
  ];

  const handleSave = () => {
    if (!canSave) return;
    onSave(chosenLabel, {
      address: addressText.trim(),
      coordinates: destination.coordinates || [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
      <div className="w-full bg-[#13131f] border-t border-white/10 rounded-t-3xl p-6">

        <h3 className="text-white font-bold text-lg mb-1">Save Address</h3>

        <p className="text-white/40 text-sm mb-4 line-clamp-2">{destination.address}</p>

        <p className="text-white/60 text-sm mb-3">Save as:</p>

        <div className="flex gap-3 mb-4">
          {labelButtons.map((q) => (
            <button
              key={q.key}
              onClick={() => setSaveLabel(q.key)}
              className={`
                flex-1 py-3 rounded-xl border text-center transition-all
                ${saveLabel === q.key
                  ? 'bg-amber-400/15 border-amber-400/40 text-amber-400'
                  : 'bg-white/5 border-white/10 text-white/60'}
              `}
            >
              <div className="text-xl">{q.icon}</div>
              <div className="text-xs mt-1">{q.label}</div>
            </button>
          ))}
        </div>

        {saveLabel === 'more' && (
          <div className="mb-4">
            <label className="text-white/60 text-xs">Custom label</label>
            <input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g. Gym, Parents, School"
              className="w-full mt-1 px-3 py-2 text-white text-sm bg-white/5 border border-white/10 rounded-lg focus:border-amber-400/40 outline-none"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="text-white/60 text-xs">Address</label>
          <textarea
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            rows={2}
            className="w-full mt-1 px-3 py-2 text-white text-sm bg-white/5 border border-white/10 rounded-lg focus:border-amber-400/40 outline-none resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10
                       text-white/40 text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300
                       text-black font-bold text-sm disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveAddressModal;