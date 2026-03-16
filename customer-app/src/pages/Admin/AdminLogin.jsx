import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../../app/slices/authSlice';
import { adminAPI } from '../../services/api';

const AdminLogin = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res  = await adminAPI.login(form.email, form.password);
      const { admin, tokens } = res.data.data;

      // Store tokens + set role from admin.role (e.g. 'superadmin')
      dispatch(setCredentials({
        user:   { ...admin, isAdmin: true },
        tokens,
        role:   admin.role,   // 'superadmin' | 'admin' | 'support' | 'ops'
      }));

      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070e] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-amber-400 tracking-wider">THARA</h1>
          <p className="text-white/40 text-sm mt-1">Admin Dashboard</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="block text-white/60 text-sm mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="admin@thararide.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                       text-white placeholder-white/20 focus:outline-none
                       focus:border-amber-400/50 transition-colors"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-white/60 text-sm mb-1">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                       text-white placeholder-white/20 focus:outline-none
                       focus:border-amber-400/50 transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleLogin}
          disabled={loading || !form.email || !form.password}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40
                     disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl
                     transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

      </div>
    </div>
  );
};

export default AdminLogin;
// ```

// ---

// After saving, **clear localStorage** then login again. The terminal will now log:
// ```
// [protect] decoded: { id: '...', role: 'superadmin' }
// [protect] admin authenticated, role: superadmin
// [Admin Login] role in token: superadmin