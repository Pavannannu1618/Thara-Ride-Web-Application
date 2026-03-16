import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { rideAPI } from '../services/api';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import Spinner from '../components/common/Spinner';
import { formatCurrency, formatDate, getStatusColor, truncateAddress } from '../utils/helpers';
import { MapPin } from 'lucide-react';

const RideCard = ({ ride }) => (
  <div className="card space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg">{
          { bike: '🏍️', auto: '🛺', mini: '🚗', sedan: '🚙', suv: '🚐' }[ride.rideType] || '🚗'
        }</span>
        <span className="font-semibold capitalize">{ride.rideType}</span>
      </div>
      <div className="text-right">
        <div className="font-bold text-primary-400">{formatCurrency(ride.fare?.finalFare || 0)}</div>
        <div className={`text-xs ${getStatusColor(ride.status)}`}>{ride.status}</div>
      </div>
    </div>

    <div className="space-y-2 text-sm">
      <div className="flex items-start gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0" />
        <span className="text-white/70">{truncateAddress(ride.pickup?.address, 40)}</span>
      </div>
      <div className="flex items-start gap-2">
        <MapPin size={12} className="text-primary-500 flex-shrink-0 mt-0.5" />
        <span className="text-white/70">{truncateAddress(ride.destination?.address, 40)}</span>
      </div>
    </div>

    <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/5">
      <span>{formatDate(ride.createdAt)}</span>
      <span>{ride.route?.distanceKm?.toFixed(1)} km</span>
    </div>
  </div>
);

const History = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rideHistory'],
    queryFn: () => rideAPI.getHistory({ page: 1, limit: 20 }),
  });

  const rides = data?.data?.data?.rides || [];

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      <Navbar />
      <div className="max-w-md mx-auto px-4 pt-20">
        <h1 className="text-2xl font-bold mb-6">Ride History</h1>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="text-center py-16 text-white/40">Failed to load rides</div>
        ) : rides.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🚗</div>
            <p className="text-white/60">No rides yet</p>
            <p className="text-white/40 text-sm">Your ride history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rides.map((ride) => <RideCard key={ride._id} ride={ride} />)}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default History;