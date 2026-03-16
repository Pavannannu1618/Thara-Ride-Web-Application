import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { rideAPI } from '../services/api';
import { setCurrentRide, setRideStatus, setDriver, resetRide } from '../app/slices/rideSlice';
import { useRideTracking } from '../hooks/useRideTracking';
import LiveTrack from '../components/tracking/LiveTrack';
import { DriverStatusStrip } from '../components/tracking/ETABadge';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import { ArrowLeft, Star, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

// ── Rating Modal ──
const RatingModal = ({ rideId, onDone }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const TAGS = ['Clean car', 'Safe driving', 'On time', 'Friendly', 'Good route'];
  const [selectedTags, setSelectedTags] = useState([]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // API call would go here
      await new Promise((r) => setTimeout(r, 500));
      toast.success('Thanks for your feedback! ⭐');
      onDone();
    } catch {
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card space-y-4">
      <div className="text-center">
        <div className="text-5xl mb-2">🎉</div>
        <h3 className="text-xl font-bold">Rate your ride</h3>
        <p className="text-white/50 text-sm">How was your experience?</p>
      </div>

      {/* Star Rating */}
      <div className="flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="text-3xl transition-transform hover:scale-110 active:scale-95"
          >
            {star <= rating ? '⭐' : '☆'}
          </button>
        ))}
      </div>

      {/* Quick Tags */}
      <div className="flex flex-wrap gap-2">
        {TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTags((prev) =>
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
            )}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              selectedTags.includes(tag)
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                : 'bg-white/5 border-white/10 text-white/60'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Comment */}
      <textarea
        className="input-field text-sm resize-none"
        rows={3}
        placeholder="Any additional feedback? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={300}
      />

      <Button onClick={handleSubmit} loading={submitting} fullWidth>
        Submit Rating
      </Button>
    </div>
  );
};

// ── Main RideTracking Page ──
const RideTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentRide, rideStatus, driver } = useSelector((s) => s.ride);
  const [showRating, setShowRating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Fetch ride details
  const { data, isLoading } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => rideAPI.getRide(id),
    enabled: !!id,
    refetchInterval: rideStatus === 'searching' ? 5000 : false,
  });

  // Sync ride data to Redux
  useEffect(() => {
    if (data?.data?.data?.ride) {
      const ride = data.data.data.ride;
      dispatch(setCurrentRide(ride));
      dispatch(setRideStatus(ride.status));
      if (ride.driver) dispatch(setDriver(ride.driver));
    }
  }, [data, dispatch]);

  // Live socket tracking
  useRideTracking(id);

  // Show rating modal on completion
  useEffect(() => {
    if (rideStatus === 'completed' && !showRating) {
      setTimeout(() => setShowRating(true), 1500);
    }
  }, [rideStatus]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this ride?')) return;
    setCancelling(true);
    try {
      await rideAPI.cancelRide(id, 'Customer cancelled');
      dispatch(resetRide());
      navigate('/', { replace: true });
      toast('Ride cancelled');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading && !currentRide) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  const ride = currentRide || data?.data?.data?.ride;
  if (!ride) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-5xl">🔍</div>
        <p className="text-white/60">Ride not found</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const isActive = ['searching', 'accepted', 'arrived', 'started'].includes(rideStatus || ride.status);
  const isCompleted = (rideStatus || ride.status) === 'completed';
  const isCancelled = (rideStatus || ride.status) === 'cancelled';

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-dark-900/90 backdrop-blur-xl border-b border-white/5 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-lg">
              {isCompleted ? 'Ride Completed' : isActive ? 'Live Tracking' : 'Ride Details'}
            </h1>
            <p className={`text-xs ${getStatusColor(rideStatus || ride.status)}`}>
              {(rideStatus || ride.status)?.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-16 max-w-md mx-auto px-4 pb-8 space-y-4">

        {/* Map - show for active rides */}
        {isActive && (
          <LiveTrack height="45vh" showDriverInfo={false} />
        )}

        {/* Completed State */}
        {isCompleted && !showRating && (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">You've arrived!</h2>
            <p className="text-white/50">Loading your rating form...</p>
          </div>
        )}

        {/* Rating Modal */}
        {showRating && (
          <RatingModal
            rideId={id}
            onDone={() => {
              setShowRating(false);
              dispatch(resetRide());
              navigate('/', { replace: true });
            }}
          />
        )}

        {/* Driver Status Strip */}
        {isActive && rideStatus && rideStatus !== 'searching' && (
          <DriverStatusStrip status={rideStatus} />
        )}

        {/* Searching Animation */}
        {rideStatus === 'searching' && (
          <div className="card flex flex-col items-center py-8 gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center">
                <span className="text-4xl">🚗</span>
              </div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-primary-500/20 animate-ping"
                  style={{ animationDelay: `${i * 0.4}s` }}
                />
              ))}
            </div>
            <p className="font-semibold text-lg">Finding your driver...</p>
            <p className="text-white/40 text-sm text-center">
              We're matching you with the best available driver nearby
            </p>
          </div>
        )}

        {/* Ride Route Card */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-white/70 text-sm">ROUTE</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-white/40">PICKUP</p>
                <p className="text-sm text-white">{ride.pickup?.address}</p>
              </div>
            </div>
            <div className="ml-1.5 w-0.5 h-4 bg-white/10" />
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-primary-500 rounded-full mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-white/40">DESTINATION</p>
                <p className="text-sm text-white">{ride.destination?.address}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
            {[
              { label: 'Distance', value: `${ride.route?.distanceKm?.toFixed(1) || '—'} km` },
              { label: 'Duration', value: `${ride.route?.durationMins || '—'} min` },
              { label: 'Fare',     value: formatCurrency(ride.fare?.finalFare || 0) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-white/40">{label}</p>
                <p className="font-bold text-sm text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Card (active rides) */}
        {driver && isActive && rideStatus !== 'searching' && (
          <div className="card space-y-3">
            <h3 className="font-semibold text-white/70 text-sm">YOUR DRIVER</h3>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-2xl">
                {driver?.user?.avatar
                  ? <img src={driver.user.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                  : '👤'
                }
              </div>
              <div className="flex-1">
                <p className="font-bold">{driver?.user?.name || 'Your Driver'}</p>
                <p className="text-sm text-white/50">⭐ {driver?.rating?.toFixed(1) || '5.0'}</p>
                {driver?.vehicle && (
                  <p className="text-xs text-white/40 mt-0.5">
                    {driver.vehicle.make} {driver.vehicle.model} · {driver.vehicle.plateNumber}
                  </p>
                )}
              </div>
              {driver?.user?.phone && (
                <a href={`tel:${driver.user.phone}`}
                  className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center text-xl">
                  📞
                </a>
              )}
            </div>

            {/* OTP (show when driver accepted) */}
            {ride.otp && rideStatus === 'accepted' && (
              <div className="p-3 bg-primary-500/10 rounded-xl border border-primary-500/20 text-center">
                <p className="text-xs text-white/50 mb-1">Share this OTP with your driver to start the ride</p>
                <p className="text-3xl font-bold tracking-[0.5em] text-primary-400">{ride.otp}</p>
              </div>
            )}
          </div>
        )}

        {/* Cancelled State */}
        {isCancelled && (
          <div className="card text-center space-y-4">
            <div className="text-5xl">❌</div>
            <h3 className="text-xl font-bold">Ride Cancelled</h3>
            <p className="text-white/50 text-sm">
              {ride.cancelReason || 'This ride was cancelled'}
            </p>
            <Button onClick={() => navigate('/')} fullWidth>Book Another Ride</Button>
          </div>
        )}

        {/* Cancel Button */}
        {isActive && ['searching', 'accepted', 'arrived'].includes(rideStatus || ride.status) && (
          <Button
            onClick={handleCancel}
            loading={cancelling}
            variant="ghost"
            fullWidth
          >
            Cancel Ride
          </Button>
        )}
      </div>
    </div>
  );
};

export default RideTracking;