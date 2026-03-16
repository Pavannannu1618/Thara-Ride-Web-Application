import React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// ── Custom Toast Component ──
export const CustomToast = ({ t, type, title, message }) => {
  const icons = {
    success: <CheckCircle size={20} className="text-green-400 flex-shrink-0" />,
    error:   <XCircle    size={20} className="text-red-400 flex-shrink-0"   />,
    warning: <AlertCircle size={20} className="text-yellow-400 flex-shrink-0" />,
    info:    <Info       size={20} className="text-blue-400 flex-shrink-0"  />,
  };

  const borders = {
    success: 'border-green-500/30',
    error:   'border-red-500/30',
    warning: 'border-yellow-500/30',
    info:    'border-blue-500/30',
  };

  return (
    <div
      className={`flex items-start gap-3 bg-dark-800 border ${borders[type] || 'border-white/10'} 
        rounded-2xl px-4 py-3 shadow-2xl min-w-[280px] max-w-[360px]
        ${t.visible ? 'animate-enter' : 'animate-leave'}`}
    >
      {icons[type]}
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-white text-sm">{title}</p>}
        {message && <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{message}</p>}
      </div>
      <button
        onClick={() => toast.dismiss(t.id)}
        className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
      >
        <X size={14} className="text-white/40" />
      </button>
    </div>
  );
};

// ── Toast Helper Functions ──
export const showToast = {
  success: (title, message) =>
    toast.custom((t) => <CustomToast t={t} type="success" title={title} message={message} />),

  error: (title, message) =>
    toast.custom((t) => <CustomToast t={t} type="error" title={title} message={message} />, {
      duration: 5000,
    }),

  warning: (title, message) =>
    toast.custom((t) => <CustomToast t={t} type="warning" title={title} message={message} />),

  info: (title, message) =>
    toast.custom((t) => <CustomToast t={t} type="info" title={title} message={message} />),

  rideUpdate: (status) => {
    const messages = {
      accepted:  { title: '🚗 Driver Found!',      message: 'Your driver is on the way' },
      arrived:   { title: '📍 Driver Arrived',     message: 'Your driver is at the pickup point' },
      started:   { title: '🚀 Ride Started',       message: 'Have a safe journey!' },
      completed: { title: '✅ Ride Completed',     message: 'Rate your experience' },
      cancelled: { title: '❌ Ride Cancelled',     message: 'Your ride was cancelled' },
    };
    const msg = messages[status];
    if (msg) toast.custom((t) => <CustomToast t={t} type="info" {...msg} />);
  },
};

// ── Toaster Provider (add to main.jsx) ──
export const ToastProvider = () => (
  <Toaster
    position="top-center"
    gutter={8}
    containerStyle={{ top: 70 }}
    toastOptions={{ duration: 3000 }}
  />
);

export default showToast;