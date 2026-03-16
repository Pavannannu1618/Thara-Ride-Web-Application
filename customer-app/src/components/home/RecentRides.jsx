/**
 * RecentRides
 * Shows the last 3 rides from history. Tapping navigates to the tracking page.
 *
 * Props:
 *   rides        — array of ride objects from rideAPI.getHistory
 *   onRideClick(id)
 *   onRebook(ride)
 */
const RecentRides = ({ rides = [], onRideClick, onRebook }) => (
  <div className="mx-4 mt-6">
    <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Recent rides</p>

    {rides.length === 0 ? (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-2">🚗</div>
        <p className="text-white/30 text-sm">No rides yet</p>
        <p className="text-white/20 text-xs mt-1">Your ride history will appear here</p>
      </div>
    ) : (
      <div className="space-y-2">
        {rides.map((ride) => (
          <div
            key={ride._id}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3"
          >
            <button
              onClick={() => onRideClick(ride._id)}
              className="flex-1 text-left flex items-center gap-3 hover:bg-white/8 transition-colors rounded-lg p-1"
            >
              <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center text-sm flex-shrink-0">
                📍
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm truncate">
                  {ride.destination?.address || 'Unknown destination'}
                </p>
                <p className="text-white/30 text-xs">
                  {ride.status} • ₹{ride.fare?.finalFare || '—'}
                </p>
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRebook?.(ride);
              }}
              className="whitespace-nowrap px-3 py-1.5 border border-amber-400/50 text-amber-200 text-xs font-semibold rounded-lg hover:bg-amber-400/20"
            >
              Rebook
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default RecentRides;