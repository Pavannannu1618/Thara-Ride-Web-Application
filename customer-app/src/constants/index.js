export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
export const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

export const RIDE_TYPES = [
  { id: 'bike',  label: 'Bike',  icon: '🏍️', desc: 'Affordable bike rides', seats: 1 },
  { id: 'auto',  label: 'Auto',  icon: '🛺', desc: 'Classic auto rides',    seats: 3 },
  { id: 'mini',  label: 'Mini',  icon: '🚗', desc: 'Compact hatchback',     seats: 4 },
  { id: 'sedan', label: 'Sedan', icon: '🚙', desc: 'Comfortable sedan',     seats: 4 },
  { id: 'suv',   label: 'SUV',   icon: '🚐', desc: 'Spacious SUV',          seats: 6 },
];

export const PAYMENT_METHODS = [
  { id: 'cash',   label: 'Cash',     icon: '💵' },
  { id: 'upi',    label: 'UPI',      icon: '📱' },
  { id: 'wallet', label: 'Wallet',   icon: '👛' },
  { id: 'card',   label: 'Card',     icon: '💳' },
];

export const RIDE_STATUS_LABELS = {
  searching: 'Finding your driver...',
  accepted:  'Driver is on the way',
  arrived:   'Driver has arrived',
  started:   'Ride in progress',
  completed: 'Ride completed',
  cancelled: 'Ride cancelled',
};