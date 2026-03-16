import axios from 'axios';
import { store } from '../app/store';
import { logout, setCredentials } from '../app/slices/authSlice';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Base instance ──
const api = axios.create({
  baseURL: BASE_URL + '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach access token ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

// ── Refresh token logic ──
let isRefreshing  = false;
let failedQueue   = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only intercept 401, skip refresh endpoint itself
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/send-otp') ||
      original.url?.includes('/auth/verify-otp') ||
      original.url?.includes('/admin/login')
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = 'Bearer ' + token;
        return api(original);
      });
    }

    isRefreshing = true;
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      isRefreshing = false;
      store.dispatch(logout());
      return Promise.reject(error);
    }

    try {
      const res = await axios.post(
        BASE_URL + '/api/v1/auth/refresh',
        { refreshToken },
        { timeout: 10000 }
      );

      const { tokens, user } = res.data.data;
      const role = user?.role || localStorage.getItem('userRole') || 'rider';

      localStorage.setItem('accessToken',  tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);

      store.dispatch(setCredentials({ user, tokens, role }));

      api.defaults.headers.common.Authorization = 'Bearer ' + tokens.accessToken;
      original.headers.Authorization            = 'Bearer ' + tokens.accessToken;

      processQueue(null, tokens.accessToken);
      return api(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      store.dispatch(logout());
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      window.location.href = '/';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── Auth API ──
export const authAPI = {
  sendOTP:   (phone)        => api.post('/auth/send-otp',   { phone }),
  verifyOTP: (phone, otp)   => api.post('/auth/verify-otp', { phone, otp }),
  refresh:   (refreshToken) => api.post('/auth/refresh',    { refreshToken }),
  logout:    (refreshToken) => api.post('/auth/logout',     { refreshToken }),
  getMe:     ()             => api.get('/auth/me'),
  updateProfile: (data)     => api.put('/auth/profile', data),
};

// ── Ride API ──
export const rideAPI = {
  estimate:   (data)         => api.post('/rides/estimate', data),
  book:       (data)         => api.post('/rides/book',     data),
  getById:    (id)           => api.get('/rides/' + id),
  cancel:     (id, reason)   => api.patch('/rides/' + id + '/cancel',     { reason }),
  accept:     (id)           => api.patch('/rides/' + id + '/accept'),
  arrived:    (id)           => api.patch('/rides/' + id + '/arrived'),
  verifyOTP:  (id, otp)      => api.post('/rides/'  + id + '/verify-otp', { otp }),
  complete:   (id)           => api.patch('/rides/' + id + '/complete'),
  getHistory: (params)       => api.get('/rides/history', { params }),
  schedule:   (data)         => api.post('/rides/schedule', data),
};

// ── Driver API ──
export const driverAPI = {
  toggleOnline: (isOnline)   => api.patch('/driver/toggle-online', { isOnline }),
  updateLocation: (coords)   => api.patch('/driver/location',      coords),
  getEarnings:  (params)     => api.get('/driver/earnings',        { params }),
  withdraw:     (amount)     => api.post('/driver/withdraw',       { amount }),
  getReviews:   ()           => api.get('/driver/reviews'),
};

// ── Payment API ──
export const paymentAPI = {
  createOrder:  (rideId)     => api.post('/payments/order',    { rideId }),
  verify:       (data)       => api.post('/payments/verify',   data),
  getHistory:   (params)     => api.get('/payments/history',   { params }),
  getWallet:    ()           => api.get('/payments/wallet'),
  addMoney:     (amount)     => api.post('/payments/wallet/add', { amount }),
};

// ── Admin API ──
export const adminAPI = {
  login:         (email, password) => api.post('/admin/login',           { email, password }),
  getDashboard:  ()                => api.get('/admin/dashboard'),
  getUsers:      (params)          => api.get('/admin/users',            { params }),
  getDrivers:    (params)          => api.get('/admin/drivers',          { params }),
  getLiveRides:  ()                => api.get('/admin/rides/live'),
  getRevenue:    (params)          => api.get('/admin/revenue',          { params }),
  approveDriver: (id, status)      => api.patch('/admin/drivers/' + id + '/approve', { status }),
  blockUser:     (id, blocked)     => api.patch('/admin/users/'   + id + '/block',   { blocked }),
  createPromo:   (data)            => api.post('/admin/promo', data),
};

export default api;