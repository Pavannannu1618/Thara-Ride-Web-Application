import { useState }       from 'react';
import { useNavigate }    from 'react-router-dom';
import { authAPI }        from '../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Strip everything except digits, cap at 10
  const handlePhoneChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
    setError('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');

    if (phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (!/^[6-9]/.test(phone)) {
      setError('Mobile number must start with 6, 7, 8, or 9');
      return;
    }

    setLoading(true);
    try {
      await authAPI.sendOTP(phone);   // sends plain 10-digit number
      navigate('/auth/verify', { state: { phone } });
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to send OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070e] flex flex-col items-center
                    justify-center px-6">

      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-4xl font-black text-amber-400 tracking-tight">
          Thara Ride
        </div>
        <p className="text-white/30 text-sm mt-1">Your city, your ride</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/5 border border-white/10
                      rounded-2xl p-6">
        <h2 className="text-white font-bold text-xl mb-1">Enter your number</h2>
        <p className="text-white/40 text-sm mb-6">
          We'll send a 6-digit OTP to verify
        </p>

        <form onSubmit={handleSend} className="space-y-4">

          {/* Phone input */}
          <div className={`
            flex items-center gap-3 border rounded-xl px-4 py-3.5 transition-colors
            ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5'}
          `}>
            {/* India flag + code */}
            <div className="flex items-center gap-1.5 flex-shrink-0
                            border-r border-white/10 pr-3">
              <span className="text-lg">🇮🇳</span>
              <span className="text-white/50 text-sm">+91</span>
            </div>

            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="98765 43210"
              maxLength={10}
              className="bg-transparent text-white placeholder-white/20
                         text-base outline-none flex-1 min-w-0 tracking-widest"
              autoFocus
            />

            {/* Character count */}
            <span className={`text-xs flex-shrink-0 tabular-nums
              ${phone.length === 10 ? 'text-green-400' : 'text-white/20'}`}>
              {phone.length}/10
            </span>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || phone.length !== 10}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40
                       text-black font-bold py-4 rounded-xl transition-colors
                       active:scale-[0.98] disabled:cursor-not-allowed text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Sending OTP...
              </span>
            ) : (
              'Get OTP →'
            )}
          </button>
        </form>

        <p className="text-white/20 text-xs text-center mt-5">
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>

      {/* Driver registration link */}
      <button
        onClick={() => navigate('/driver/register')}
        className="mt-6 text-white/30 hover:text-amber-400 text-sm
                   transition-colors"
      >
        Register as a driver →
      </button>
    </div>
  );
};

export default Login;