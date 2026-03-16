import React, { useState, useEffect } from 'react';
import { Clock, Navigation, TrendingUp } from 'lucide-react';
import { formatDuration } from '../../utils/helpers';

// ── ETA Badge ──
const ETABadge = ({ eta, label = 'ETA', variant = 'default', countdown = false }) => {
  const [timeLeft, setTimeLeft] = useState(eta);

  useEffect(() => {
    setTimeLeft(eta);
  }, [eta]);

  // Live countdown timer
  useEffect(() => {
    if (!countdown || !timeLeft) return;
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 60000); // countdown in minutes

    return () => clearInterval(interval);
  }, [countdown, eta]);

  if (!eta && eta !== 0) return null;

  const variants = {
    default: 'bg-white/10 border-white/10 text-white',
    primary: 'bg-primary-500/20 border-primary-500/30 text-primary-300',
    success: 'bg-green-500/20 border-green-500/30 text-green-300',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 border ${variants[variant]}`}>
      <Clock size={13} className="flex-shrink-0" />
      <span className="text-sm font-medium whitespace-nowrap">
        {label}:{' '}
        <span className="font-bold">
          {typeof timeLeft === 'number' ? formatDuration(timeLeft) : timeLeft}
        </span>
      </span>
    </div>
  );
};

// ── Driver Status Strip ──
export const DriverStatusStrip = ({ status, eta, distance }) => {
  const statusConfig = {
    accepted:  { icon: Navigation, label: 'Driver heading to you',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
    arrived:   { icon: Clock,      label: 'Driver is waiting',        color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    started:   { icon: TrendingUp, label: 'On the way to destination',color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20'  },
  };

  const config = statusConfig[status];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${config.bg}`}>
      <div className="flex items-center gap-2">
        <Icon size={16} className={config.color} />
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>
      <div className="flex items-center gap-3">
        {distance && (
          <span className="text-xs text-white/50">{distance} km</span>
        )}
        {eta !== undefined && (
          <ETABadge eta={eta} variant="primary" countdown={status === 'accepted'} />
        )}
      </div>
    </div>
  );
};

export default ETABadge;