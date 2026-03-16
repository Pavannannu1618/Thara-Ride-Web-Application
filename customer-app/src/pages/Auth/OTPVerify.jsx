import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../app/slices/authSlice';
import { authAPI } from '../../services/api';

const OTPVerify = () => {
  const [digits, setDigits]     = useState(['', '', '', '', '', '']);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [resending, setResending]     = useState(false);

  const inputRefs = useRef([]);
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const [params]  = useSearchParams();
  const location  = useLocation();

  const role  = params.get('role') || 'rider';
  const phone = location.state?.phone || '';

  // ── Countdown timer ──
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Focus first box on mount ──
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  // ── Handle single digit input ──
  const handleChange = (index, value) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const next  = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && index === 5) {
      const otp = [...next.slice(0, 5), digit].join('');
      if (otp.length === 6) handleVerify(otp);
    }
  };

  // ── Handle backspace ──
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      }
    }
    if (e.key === 'ArrowLeft'  && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  // ── Handle paste ──
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) handleVerify(pasted);
  };

  // ── Verify ──
  const handleVerify = async (otpOverride) => {
    const otp = otpOverride || digits.join('');
    if (otp.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.verifyOTP(phone, otp);
      const { user, tokens } = res.data.data;
      dispatch(setCredentials({ user, tokens, role: user.role || role }));
      navigate(role === 'driver' ? '/driver/home' : '/home', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
      // Clear boxes on error
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ──
  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    try {
      await authAPI.sendOTP(phone);
      setResendTimer(30);
      setDigits(['', '', '', '', '', '']);
      setError('');
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const otp = digits.join('');

  return (
    <div className="min-h-screen bg-[#07070e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/40 hover:text-white/70
                     transition-colors mb-10 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20
                        flex items-center justify-center mb-6">
          <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25
                 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3
                 0h3m-3 18.75h3" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-white mb-1">Enter OTP</h1>
        <p className="text-white/40 text-sm mb-2">
          6-digit code sent to{' '}
          <span className="text-amber-400 font-medium">{phone}</span>
        </p>

        {/* Dev mode badge */}
        {import.meta.env.DEV && (
          <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20
                          rounded-lg px-3 py-2 mb-6">
            <span className="text-cyan-400 text-xs font-mono">{'>'}_</span>
            <span className="text-cyan-400/80 text-xs">
              Dev mode — check backend terminal for OTP
            </span>
          </div>
        )}

        {/* ── OTP Boxes ── */}
        <div className="flex gap-3 justify-center mb-6 mt-6" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className={`
                w-12 h-14 text-center text-xl font-bold rounded-xl border-2
                bg-white/5 text-white outline-none transition-all duration-150
                ${digit
                  ? 'border-amber-400 bg-amber-400/10 text-amber-400'
                  : 'border-white/10 focus:border-amber-400/60 focus:bg-white/8'
                }
                ${error ? 'border-red-500/60 shake' : ''}
              `}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {/* Verify button */}
        <button
          onClick={() => handleVerify()}
          disabled={loading || otp.length !== 6}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40
                     disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl
                     transition-colors text-base mb-6"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Verifying...
            </span>
          ) : 'Verify & Continue'}
        </button>

        {/* Resend */}
        <p className="text-center text-sm text-white/40">
          Didn't receive it?{' '}
          {resendTimer > 0 ? (
            <span className="text-white/30">
              Resend in <span className="text-amber-400 font-semibold">{resendTimer}s</span>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-amber-400 font-semibold hover:text-amber-300
                         transition-colors disabled:opacity-40"
            >
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </p>

      </div>
    </div>
  );
};

export default OTPVerify;