import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setOnline, setRideRequest, clearRideRequest, setCurrentRide, setRideStatus, resetRide } from '../../app/slices/rideSlice';
import { driverAPI } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { MapPin, TrendingUp, Clock, Star, LogOut, CheckCircle, X, Phone, Navigation } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { logout } from '../../app/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// ── Incoming Ride Request Modal ──
const RideRequestModal = ({ request, onAccept, onReject }) => {
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (!request) return;
    setTimer(30);
    const t = setInterval(() => {
      setTimer((v) => {
        if (v <= 1) { clearInterval(t); onReject(); return 0; }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [request]);

  if (!request) return null;

  const pct = (timer / 30) * 100;
  const circumference = 2 * Math.PI * 26;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-dark-800 rounded-3xl border border-white/10
        shadow-[0_-20px_60px_rgba(0,0,0,0.6)] animate-slide-up overflow-hidden">

        {/* Progress bar top */}
        <div className="h-1 bg-white/10">
          <div className="h-full bg-primary-500 transition-all duration-1000 ease-linear"
            style={{ width: pct + '%' }} />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest">New Ride Request</p>
              <p className="font-display font-bold text-xl text-white mt-0.5">
                {request.rideType?.toUpperCase()} RIDE
              </p>
            </div>
            {/* Timer circle */}
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle cx="30" cy="30" r="26" fill="none" stroke="#f97316" strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - pct / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-sm">
                {timer}
              </span>
            </div>
          </div>

          {/* Route */}
          <div className="bg-white/[0.04] rounded-2xl p-4 mb-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Pickup</p>
                <p className="text-sm text-white font-medium">{request.pickup?.address || 'Pickup location'}</p>
              </div>
            </div>
            <div className="ml-1 w-0.5 h-4 bg-white/10" />
            <div className="flex items-start gap-3">
              <MapPin size={12} className="text-primary-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Drop</p>
                <p className="text-sm text-white font-medium">{request.destination?.address || 'Destination'}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: '📍', label: 'Distance', value: (request.distance?.toFixed(1) || '—') + ' km' },
              { icon: '⏱️', label: 'Duration',  value: (request.duration || '—') + ' min'           },
              { icon: '💰', label: 'Fare',      value: formatCurrency(request.fare || 0)             },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 bg-white/[0.04] rounded-2xl">
                <p className="text-lg mb-1">{s.icon}</p>
                <p className="font-bold text-white text-sm">{s.value}</p>
                <p className="text-white/30 text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button onClick={onReject}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/[0.06]
                border border-white/10 rounded-2xl text-white/60 font-semibold hover:bg-white/10 transition-colors">
              <X size={18} /> Decline
            </button>
            <button onClick={onAccept}
              className="flex-2 flex-1 flex items-center justify-center gap-2 py-4
                bg-primary-500 hover:bg-primary-600 rounded-2xl text-white font-bold
                shadow-lg shadow-primary-500/30 transition-all active:scale-[0.97]">
              <CheckCircle size={18} /> Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Active Ride Card ──
const ActiveRideCard = ({ ride, rideStatus, onUpdateStatus, otp }) => {
  const [otpInput, setOtpInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  const steps = {
    accepted: { next: 'arrived',   btnLabel: "I've Arrived",     btnColor: 'bg-blue-500 hover:bg-blue-600'     },
    arrived:  { next: 'start_otp', btnLabel: 'Verify OTP & Start', btnColor: 'bg-purple-500 hover:bg-purple-600' },
    started:  { next: 'completed', btnLabel: 'Complete Ride',    btnColor: 'bg-primary-500 hover:bg-primary-600' },
  };
  const step = steps[rideStatus];

  const handleAction = async () => {
    if (rideStatus === 'arrived') { return; }
    await onUpdateStatus(step?.next);
  };

  const handleVerifyOTP = async () => {
    if (otpInput.length < 4) return toast.error('Enter 4-digit OTP');
    setVerifying(true);
    try {
      await driverAPI.verifyOTP(ride._id, otpInput);
      toast.success('OTP verified! Ride started');
    } catch (err) { toast.error(err.response?.data?.error || 'Invalid OTP'); }
    finally { setVerifying(false); }
  };

  return (
    <div className="card space-y-4">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-green-400 uppercase tracking-wider">
            {rideStatus?.replace('_', ' ')}
          </span>
        </div>
        <span className="text-primary-400 font-bold text-lg">
          {formatCurrency(ride.fare?.finalFare || 0)}
        </span>
      </div>

      {/* Route */}
      <div className="bg-white/[0.04] rounded-2xl p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
          <span className="text-white/70 truncate">{ride.pickup?.address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin size={10} className="text-primary-500 flex-shrink-0" />
          <span className="text-white/70 truncate">{ride.destination?.address}</span>
        </div>
      </div>

      {/* OTP input when arrived */}
      {rideStatus === 'arrived' && (
        <div className="space-y-3">
          <p className="text-sm text-white/50 text-center">Ask customer for 4-digit OTP</p>
          <div className="flex gap-2">
            <input
              type="tel" maxLength={4}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter OTP"
              className="input-field flex-1 text-center text-2xl font-bold tracking-[0.5em]"
            />
            <button onClick={handleVerifyOTP} disabled={verifying || otpInput.length < 4}
              className="btn-primary px-4 rounded-2xl disabled:opacity-40">
              {verifying ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '✓'}
            </button>
          </div>
        </div>
      )}

      {/* Customer Info */}
      {ride.customer && (
        <div className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-2xl">
          <div className="w-10 h-10 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center font-bold text-primary-400">
            {ride.customer?.name?.[0] || 'R'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{ride.customer?.name || 'Rider'}</p>
            <p className="text-white/40 text-xs">{ride.customer?.phone}</p>
          </div>
          {ride.customer?.phone && (
            <a href={'tel:' + ride.customer.phone}
              className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center">
              <Phone size={16} className="text-green-400" />
            </a>
          )}
        </div>
      )}

      {/* Action Button */}
      {step && rideStatus !== 'arrived' && (
        <button onClick={handleAction}
          className={'w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.97] ' + step.btnColor}>
          <Navigation size={18} /> {step.btnLabel}
        </button>
      )}
    </div>
  );
};

// ── Main Driver Home ──
const DriverHome = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector((s) => s.auth);
  const { isOnline, rideRequest, currentRide, rideStatus } = useSelector((s) => s.ride);
  const { emit, on, off } = useSocket('/ride');

  const [earnings, setEarnings]   = useState({ today: 0, totalRides: 0 });
  const [toggling, setToggling]   = useState(false);

  // Socket listeners
  useEffect(() => {
    const handleRequest = (data) => {
      dispatch(setRideRequest(data));
    };
    const handleCancelled = () => {
      dispatch(resetRide());
      toast.error('Ride was cancelled');
    };
    const handleStatusUpdate = ({ status }) => {
      dispatch(setRideStatus(status));
    };

    const c1 = on('ride:new-request',  handleRequest);
    const c2 = on('ride:cancelled',    handleCancelled);
    const c3 = on('ride:status-update',handleStatusUpdate);

    return () => { c1?.(); c2?.(); c3?.(); };
  }, [dispatch, on]);

  // Fetch earnings
  useEffect(() => {
    driverAPI.getEarnings('today').then((res) => {
      setEarnings({
        today:      res.data.data.totalEarnings || 0,
        totalRides: res.data.data.totalRides    || 0,
      });
    }).catch(() => {});
  }, [currentRide]);

  const handleToggleOnline = async () => {
    setToggling(true);
    try {
      await driverAPI.toggleOnline(!isOnline);
      dispatch(setOnline(!isOnline));
      toast(isOnline ? '🔴 You are now offline' : '🟢 You are now online!');
    } catch { toast.error('Failed to update status'); }
    finally { setToggling(false); }
  };

  const handleAcceptRide = async () => {
    if (!rideRequest) return;
    try {
      await driverAPI.acceptRide(rideRequest.rideId);
      emit('driver:accept-ride', { rideId: rideRequest.rideId });
      const rideRes = await driverAPI.getRide(rideRequest.rideId);
      dispatch(setCurrentRide(rideRes.data.data.ride));
      dispatch(setRideStatus('accepted'));
      dispatch(clearRideRequest(rideRequest));
      toast.success('Ride accepted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept');
      dispatch(clearRideRequest());
    }
  };

  const handleRejectRide = () => {
    if (rideRequest) emit('driver:reject-ride', { rideId: rideRequest.rideId });
    dispatch(clearRideRequest());
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!currentRide) return;
    try {
      await driverAPI.updateStatus(currentRide._id, newStatus);
      dispatch(setRideStatus(newStatus));
      if (newStatus === 'completed') {
        toast.success('Ride completed! 🎉');
        setTimeout(() => dispatch(resetRide()), 2000);
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const hasActiveRide = currentRide && ['accepted','arrived','started'].includes(rideStatus);

  return (
    <div className="min-h-screen bg-dark-900 pb-6">

      {/* Header */}
      <div className="bg-dark-800/80 backdrop-blur-xl border-b border-white/[0.06] px-4 pt-12 pb-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 font-display">
              {user?.name?.[0] || 'D'}
            </div>
            <div>
              <p className="text-xs text-white/40">Welcome back,</p>
              <p className="font-bold text-white text-sm">{user?.name || 'Driver'}</p>
            </div>
          </div>

          {/* Online toggle */}
          <button onClick={handleToggleOnline} disabled={toggling || hasActiveRide}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all
              disabled:opacity-50
              ${isOnline
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-white/[0.06] border border-white/10 text-white/50'
              }`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
            {toggling ? '...' : isOnline ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">

        {/* Earnings Cards */}
        <div className="grid grid-cols-3 gap-3 animate-fade-up">
          {[
            { icon: '💰', label: "Today's Earn", value: formatCurrency(earnings.today)       },
            { icon: '🚗', label: 'Rides Today',  value: earnings.totalRides                  },
            { icon: '⭐', label: 'Rating',       value: (user?.rating || 5.0).toFixed(1)     },
          ].map((s) => (
            <div key={s.label} className="card text-center py-4">
              <p className="text-2xl mb-2">{s.icon}</p>
              <p className="font-bold text-white text-base">{s.value}</p>
              <p className="text-white/30 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Active ride */}
        {hasActiveRide && (
          <div className="animate-fade-up">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Active Ride</p>
            <ActiveRideCard
              ride={currentRide}
              rideStatus={rideStatus}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        )}

        {/* Waiting for ride */}
        {isOnline && !hasActiveRide && !rideRequest && (
          <div className="card text-center py-10 animate-fade-up">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-4xl mx-auto">
                🚗
              </div>
              {[1,2,3].map((i) => (
                <div key={i} className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping"
                  style={{ animationDelay: i * 0.4 + 's' }} />
              ))}
            </div>
            <p className="font-bold text-lg text-white mb-1">You're Online!</p>
            <p className="text-white/40 text-sm">Waiting for ride requests...</p>
          </div>
        )}

        {/* Offline state */}
        {!isOnline && !hasActiveRide && (
          <div className="card text-center py-10 animate-fade-up">
            <div className="text-5xl mb-4">😴</div>
            <p className="font-bold text-lg text-white mb-1">You're Offline</p>
            <p className="text-white/40 text-sm mb-6">Go online to start receiving ride requests</p>
            <button onClick={handleToggleOnline} disabled={toggling}
              className="btn-primary mx-auto px-8 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
              {toggling ? '...' : 'Go Online'}
            </button>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => { dispatch(logout()); navigate('/'); }}
          className="w-full py-3 text-white/30 hover:text-white/60 text-sm transition-colors flex items-center justify-center gap-2">
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {/* Ride Request Modal */}
      <RideRequestModal
        request={rideRequest}
        onAccept={handleAcceptRide}
        onReject={handleRejectRide}
      />
    </div>
  );
};

export default DriverHome;