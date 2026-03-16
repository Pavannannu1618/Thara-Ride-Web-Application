import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedRideType, setFareEstimate, setBookingStep } from '../../app/slices/rideSlice';
import { rideAPI } from '../../services/api';
import { RIDE_TYPES } from '../../constants';
import { formatCurrency, formatDuration, formatDistance } from '../../utils/helpers';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { useState } from 'react';
import { ChevronLeft, Zap } from 'lucide-react';

const RideTypeSelector = () => {
  const dispatch = useDispatch();
  const { pickup, destination, selectedRideType, fareEstimate } = useSelector((s) => s.ride);
  const [estimates, setEstimates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEstimates = async () => {
      if (!pickup || !destination) return;
      setLoading(true);
      try {
        const results = {};
        await Promise.all(
          RIDE_TYPES.map(async (rt) => {
            const res = await rideAPI.estimateFare({
              pickup: pickup.location,
              destination: destination.location,
              rideType: rt.id,
            });
            results[rt.id] = res.data.data;
          })
        );
        setEstimates(results);
        if (!fareEstimate) dispatch(setFareEstimate(results['mini']));
      } catch (err) {
        console.error('Fare estimate error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEstimates();
  }, [pickup, destination]);

  const handleSelect = (type) => {
    dispatch(setSelectedRideType(type.id));
    if (estimates[type.id]) dispatch(setFareEstimate(estimates[type.id]));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => dispatch(setBookingStep(1))} className="p-2 rounded-full hover:bg-white/10">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="font-bold text-lg">Choose a ride</h2>
          {estimates[selectedRideType] && (
            <p className="text-sm text-white/60">
              {formatDistance(estimates[selectedRideType].distanceKm)} •{' '}
              {formatDuration(estimates[selectedRideType].durationMins)} away
            </p>
          )}
        </div>
      </div>

      {/* Ride Types */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-2">
          {RIDE_TYPES.map((type) => {
            const est = estimates[type.id];
            const isSelected = selectedRideType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => handleSelect(type)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 border-2 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-transparent bg-white/5 hover:bg-white/10'
                }`}
              >
                {/* Icon */}
                <span className="text-3xl">{type.icon}</span>

                {/* Details */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{type.label}</span>
                    {type.id === 'mini' && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Popular</span>
                    )}
                  </div>
                  <p className="text-sm text-white/60">{type.desc}</p>
                  {est?.surgeMultiplier > 1 && (
                    <div className="flex items-center gap-1 text-xs text-yellow-400 mt-1">
                      <Zap size={10} />
                      <span>{est.surgeMultiplier}x surge</span>
                    </div>
                  )}
                </div>

                {/* Fare */}
                <div className="text-right">
                  {est ? (
                    <>
                      <div className="font-bold text-lg">{formatCurrency(est.totalFare)}</div>
                      <div className="text-xs text-white/60">{formatDuration(est.durationMins)}</div>
                    </>
                  ) : (
                    <Spinner size="sm" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Button
        onClick={() => dispatch(setBookingStep(3))}
        disabled={!selectedRideType}
        fullWidth
      >
        Continue with {RIDE_TYPES.find((r) => r.id === selectedRideType)?.label}
      </Button>
    </div>
  );
};

export default RideTypeSelector;