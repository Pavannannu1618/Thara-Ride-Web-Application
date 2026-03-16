import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../hooks/useSocket';
import MapContainer from '../map/MapContainer';
import { DriverStatusStrip } from './ETABadge';
import { MessageCircle, AlertTriangle, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

// ── Live Tracking Panel ──
const LiveTrack = ({ height = '40vh', showDriverInfo = false }) => {
  const { rideStatus, currentRide, driverLocation, driver, eta } = useSelector((s) => s.ride);
  const { emit } = useSocket('/ride');
  const [collapsed, setCollapsed] = useState(false);

  const handleSOS = () => {
    if (!currentRide?._id || !driverLocation) {
      toast.error('SOS requires an active ride');
      return;
    }
    emit('ride:sos', {
      rideId: currentRide._id,
      location: {
        address: currentRide.pickup?.address || 'Unknown',
        coordinates: driverLocation
          ? [driverLocation.lng, driverLocation.lat]
          : currentRide.pickup?.location?.coordinates,
      },
    });
    toast('🚨 SOS Alert Sent! Emergency contacts notified.', { duration: 5000 });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Map */}
      <div className="relative">
        <MapContainer height={height} showControls />

        {/* Status overlay on map */}
        {rideStatus && ['accepted', 'arrived', 'started'].includes(rideStatus) && (
          <div className="absolute top-3 left-3 right-3">
            <DriverStatusStrip status={rideStatus} eta={eta} />
          </div>
        )}
      </div>

      {/* Driver Info Panel */}
      {showDriverInfo && driver && (
        <div className="card">
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-between mb-3"
          >
            <span className="font-semibold text-sm text-white/70">Driver Details</span>
            {collapsed
              ? <ChevronDown size={16} className="text-white/40" />
              : <ChevronUp   size={16} className="text-white/40" />
            }
          </button>

          {!collapsed && (
            <>
              {/* Driver row */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-xl overflow-hidden">
                  {driver?.user?.avatar
                    ? <img src={driver.user.avatar} alt="driver" className="w-full h-full object-cover" />
                    : '👤'
                  }
                </div>
                <div className="flex-1">
                  <p className="font-bold">{driver?.user?.name || 'Your Driver'}</p>
                  <p className="text-sm text-white/50">
                    ⭐ {driver?.rating?.toFixed(1) || '5.0'} · {driver?.totalRides || 0} rides
                  </p>
                </div>
                {driver?.user?.phone && (
                  
                    href={'tel:' : driver.user.phone},
                    className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center"
                  >
                    <Phone size={16} className="text-green-400" />
                
                )}
              </div>

              {/* Vehicle */}
              {driver?.vehicle && (
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl mb-3 text-sm">
                  <span className="text-lg">🚗</span>
                  <span className="text-white/70">
                    {driver.vehicle.make} {driver.vehicle.model}
                  </span>
                  <span className="ml-auto font-mono text-primary-400 font-bold">
                    {driver.vehicle.plateNumber}
                  </span>
                </div>
              )}

              {/* Ride fare */}
              {currentRide?.fare && (
                <div className="flex items-center justify-between text-sm p-2 bg-white/5 rounded-xl mb-3">
                  <span className="text-white/60">Ride fare</span>
                  <span className="font-bold text-primary-400">
                    {formatCurrency(currentRide.fare.finalFare)}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors">
                  <MessageCircle size={15} /> Chat
                </button>
                <button
                  onClick={handleSOS}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
                >
                  <AlertTriangle size={15} /> SOS
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveTrack;   