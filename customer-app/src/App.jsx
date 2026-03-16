import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate }     from 'react-router-dom';
import { useDispatch }                 from 'react-redux';
import { fetchMe }                     from './app/slices/authSlice';
import { FullPageSpinner }             from './components/common/Spinner';

import Landing        from './pages/Landing';
import Login          from './pages/Auth/Login';
import OTPVerify      from './pages/Auth/OTPVerify';
import Home           from './pages/Home';
import History        from './pages/History';
import Profile        from './pages/Profile';
import Wallet         from './pages/Wallet';
import RideTracking   from './pages/RideTracking';
import DriverHome     from './pages/Driver/DriverHome';
import DriverRegister from './pages/Driver/DriverRegister';
import AdminLogin     from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';

// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_ROLES = ['admin', 'superadmin', 'support', 'ops'];

// Normalise legacy 'customer' role → 'rider' so old tokens still work
const normalizeRole = (role) => (role === 'customer' ? 'rider' : role ?? '');

const getAuth = () => ({
  token: localStorage.getItem('accessToken'),
  role:  normalizeRole(localStorage.getItem('userRole')),
});

// ─── Guards ───────────────────────────────────────────────────────────────────
const RequireAuth = ({ children, allowedRoles }) => {
  const { token, role } = getAuth();
  if (!token || !role) return <Navigate to="/" replace />;
  if (allowedRoles?.length && !allowedRoles.includes(role))
    return <Navigate to="/" replace />;
  return children;
};

const RequireGuest = ({ children }) => {
  const { token, role } = getAuth();
  if (!token) return children;
  if (role === 'driver')           return <Navigate to="/driver/home"     replace />;
  if (ADMIN_ROLES.includes(role))  return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/home" replace />;
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => {
  const dispatch   = useDispatch();
  const fetchedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    const token = localStorage.getItem('accessToken');
    if (token) {
      dispatch(fetchMe()).finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []); // eslint-disable-line

  if (!ready) return <FullPageSpinner text="Loading Thara Ride..." />;

  // Computed once after ready — token/role are stable at this point
  const { token, role } = getAuth();
  const rootElement =
    !token                       ? <Landing />
    : !role                      ? <Landing />
    : role === 'driver'          ? <Navigate to="/driver/home"     replace />
    : ADMIN_ROLES.includes(role) ? <Navigate to="/admin/dashboard" replace />
    :                              <Navigate to="/home"            replace />;

  return (
    <Routes>
      {/* Root — Landing (with one-time intro animation via sessionStorage) */}
      <Route path="/" element={rootElement} />

      {/* ── Auth ── */}
      <Route path="/auth/login"  element={<RequireGuest><Login     /></RequireGuest>} />
      <Route path="/auth/verify" element={<RequireGuest><OTPVerify /></RequireGuest>} />

      {/* ── Rider ── */}
      <Route path="/home"     element={<RequireAuth allowedRoles={['rider']}><Home         /></RequireAuth>} />
      <Route path="/history"  element={<RequireAuth allowedRoles={['rider']}><History      /></RequireAuth>} />
      <Route path="/wallet"   element={<RequireAuth allowedRoles={['rider']}><Wallet       /></RequireAuth>} />
      <Route path="/profile"  element={<RequireAuth allowedRoles={['rider', 'driver']}><Profile /></RequireAuth>} />
      <Route path="/ride/:id" element={<RequireAuth allowedRoles={['rider']}><RideTracking /></RequireAuth>} />

      {/* ── Driver ── */}
      <Route path="/driver/register" element={<DriverRegister />} />
      <Route path="/driver/home"     element={<RequireAuth allowedRoles={['driver']}><DriverHome /></RequireAuth>} />

      {/* ── Admin ── */}
      <Route path="/admin/login"     element={<RequireGuest><AdminLogin /></RequireGuest>} />
      <Route path="/admin/dashboard" element={
        <RequireAuth allowedRoles={ADMIN_ROLES}>
          <AdminDashboard />
        </RequireAuth>
      } />

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;