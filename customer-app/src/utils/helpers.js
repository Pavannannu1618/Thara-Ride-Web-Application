export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
};

export const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
};

export const formatDuration = (mins) => {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export const getRatingStars = (rating) => {
  return '⭐'.repeat(Math.round(rating));
};

export const truncateAddress = (address, maxLen = 30) => {
  if (!address) return '';
  return address.length > maxLen ? address.substring(0, maxLen) + '...' : address;
};

export const getStatusColor = (status) => {
  const colors = {
    searching: 'text-yellow-400',
    accepted:  'text-blue-400',
    arrived:   'text-purple-400',
    started:   'text-green-400',
    completed: 'text-green-500',
    cancelled: 'text-red-400',
  };
  return colors[status] || 'text-gray-400';
};