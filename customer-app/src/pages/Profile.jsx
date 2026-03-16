import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout , updateUser} from '../app/slices/authSlice';
import { authAPI } from '../services/api';
import BottomNav from '../components/layout/BottomNav';
import { Edit2, Trash2, ArrowRight } from 'lucide-react';
import SaveAddressModal from '../components/home/SaveAddressModal';

// ── Single toast — never stacks ──
const useCopyToast = () => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      timerRef.current = null;
    }, 2000);
  };
  return { visible, show };
};

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user }  = useSelector((s) => s.auth);

  const { visible: copied, show: showCopied } = useCopyToast();

  // ── Saved addresses state ──
  const [showSaveAddr, setShowSaveAddr]       = useState(false);
  const [editingAddress, setEditingAddress]   = useState(null);
  const [savingAddress, setSavingAddress]     = useState(false);
  const [expandedAddresses, setExpandedAddresses] = useState([]);

  // ── Edit state ──
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [saveErr, setSaveErr]   = useState('');
  const [form, setForm] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
  });

  // ── Sign out ──
  const handleSignOut = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await authAPI.logout({ refreshToken }).catch(() => {});
    } finally {
      dispatch(logout());
      navigate('/', { replace: true });
    }
  };

  // ── Copy referral ──
  const handleCopy = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode).then(showCopied);
  };

  // ── Save profile ──
  const handleSave = async () => {
  setSaving(true);
  setSaveErr('');
  try {
    const res = await authAPI.updateProfile({
      name:  form.name.trim(),
      email: form.email.trim() || undefined,
    });

    // ── Immediately sync Redux state — no refresh needed ──
    const updatedUser = res.data?.data?.user;
    if (updatedUser) {
      dispatch(updateUser(updatedUser));
    } else {
      // Fallback: patch with what we sent
      dispatch(updateUser({
        name:  form.name.trim(),
        email: form.email.trim() || undefined,
      }));
    }

    setEditing(false);
  } catch (err) {
    setSaveErr(err.response?.data?.error || 'Failed to save. Please try again.');
  } finally {
    setSaving(false);
  }
};

  const updateSavedAddresses = async (newSavedAddresses) => {
    setSavingAddress(true);
    try {
      const res = await authAPI.updateProfile({ savedAddresses: newSavedAddresses });
      const updatedUser = res.data?.data?.user;
      if (updatedUser) {
        dispatch(updateUser(updatedUser));
      } else {
        dispatch(updateUser({ savedAddresses: newSavedAddresses }));
      }
    } catch (err) {
      console.error('Save addresses failed', err);
    } finally {
      setSavingAddress(false);
      setShowSaveAddr(false);
      setEditingAddress(null);
    }
  };

  const handleDeleteAddress = (label) => {
    const filtered = (user?.savedAddresses || []).filter((a) => a.label !== label);
    updateSavedAddresses(filtered);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowSaveAddr(true);
  };

  const handleGoToAddress = (address) => {
    if (!address?.coordinates?.length || !address?.address) return;
    navigate('/home', { state: { destination: {
      address: address.address,
      coordinates: address.coordinates,
    } } });
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowSaveAddr(true);
  };

  const handleSaveAddress = (label, dest) => {
    const existing = user?.savedAddresses || [];
    const queued = existing.filter((a) => a.label !== (editingAddress?.label || label));
    updateSavedAddresses([...queued, { label, address: dest.address, coordinates: dest.coordinates || [] }]);
  };

  const handleCancel = () => {
    setForm({ name: user?.name || '', email: user?.email || '' });
    setSaveErr('');
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#07070e] pb-24">

      {/* ── Copy Toast ── */}
      <div className={`
        fixed top-5 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2 px-4 py-2.5
        bg-green-500 text-white text-sm font-semibold rounded-full shadow-lg
        transition-all duration-300 pointer-events-none
        ${copied ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}
      `}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
             stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Referral code copied!
      </div>

      {/* ── Header ── */}
      <div className="bg-white/5 border-b border-white/10 px-4 py-4
                      flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/30
                          flex items-center justify-center text-amber-400 font-bold text-lg">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              {user?.name || 'User'}
            </p>
            <p className="text-white/40 text-xs">{user?.phone}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="text-white/40 hover:text-white/70 transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-6 space-y-4">

        {/* ── Referral Code ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
            Your Referral Code
          </p>
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl text-amber-400 tracking-widest">
              {user?.referralCode || '——'}
            </span>
            <button
              onClick={handleCopy}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                transition-all duration-200 border active:scale-95
                ${copied
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-amber-400/10 border-amber-400/30 text-amber-400 hover:bg-amber-400/20'}
              `}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012
                         2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2
                         2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-white/30 text-xs mt-2">
            Share this code — earn ₹50 per successful referral
          </p>
        </div>

        {/* ── Profile Info ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/60 text-sm font-semibold">Profile Info</p>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-amber-400 hover:text-amber-300 transition-colors p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0
                       113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="text-white/40 hover:text-white/70 text-xs px-3 py-1
                             border border-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-black bg-amber-400 hover:bg-amber-300 text-xs
                             font-semibold px-3 py-1 rounded-lg transition-colors
                             disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {saveErr && (
            <p className="text-red-400 text-xs mb-3 bg-red-500/10 border
                          border-red-500/20 rounded-lg px-3 py-2">
              {saveErr}
            </p>
          )}

          <div className="space-y-3">
            {/* Name */}
            <div className="flex items-start gap-3 py-1">
              <span className="text-white/30 flex-shrink-0 mt-3">
                <PersonIcon />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">
                  Name
                </p>
                {editing ? (
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 focus:border-amber-400/50
                               rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors"
                  />
                ) : (
                  <p className="text-white text-sm">{user?.name || '—'}</p>
                )}
              </div>
            </div>

            {/* Phone (read-only always) */}
            <InfoRow icon={<PhoneIcon />} label="Phone" value={user?.phone || '—'} />

            {/* Email */}
            <div className="flex items-start gap-3 py-1">
              <span className="text-white/30 flex-shrink-0 mt-3">
                <EmailIcon />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">
                  Email
                </p>
                {editing ? (
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Add email address"
                    className="w-full bg-white/5 border border-white/10 focus:border-amber-400/50
                               rounded-lg px-3 py-2 text-white text-sm outline-none
                               placeholder-white/20 transition-colors"
                  />
                ) : (
                  <p className={`text-sm ${!user?.email ? 'text-white/30 italic' : 'text-white'}`}>
                    {user?.email || 'Not added'}
                  </p>
                )}
              </div>
            </div>

            {/* Loyalty */}
            <InfoRow
              icon={<StarIcon />}
              label="Loyalty Points"
              value={`${user?.loyaltyPoints ?? 0} pts`}
            />
          </div>
        </div>

        {/* ── Saved Addresses ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/60 text-sm font-semibold">Saved Addresses</p>
            <button
              onClick={handleAddAddress}
              className="text-amber-400 hover:text-amber-300 text-xs font-semibold"
            >
              + Add Address
            </button>
          </div>

          {Array.isArray(user?.savedAddresses) && user.savedAddresses.length > 0 ? (
            <div className="space-y-2">
              {user.savedAddresses.map((item) => {
                const isExpanded = expandedAddresses.includes(item.label);
                return (
                  <div
                    key={item.label}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-white font-semibold truncate">
                          {item.label?.charAt(0).toUpperCase() + item.label?.slice(1)}
                        </p>
                        <p
                          className={`text-white/50 text-xs ${isExpanded ? 'whitespace-normal break-words' : 'overflow-hidden'}`}
                          style={!isExpanded ? {
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            textOverflow: 'ellipsis',
                          } : {}}
                        >
                          {item.address}
                        </p>
                        {item.address?.length > 120 && (
                          <button
                            onClick={() => {
                              setExpandedAddresses((prev) =>
                                prev.includes(item.label)
                                  ? prev.filter((x) => x !== item.label)
                                  : [...prev, item.label]
                              );
                            }}
                            className="text-amber-300 text-[10px] font-semibold mt-1"
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGoToAddress(item)}
                          className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-100 text-xs font-semibold"
                        >
                          <ArrowRight size={14} />
                          Go to {item.label?.charAt(0).toUpperCase() + item.label?.slice(1)}
                        </button>
                        <button
                          onClick={() => handleEditAddress(item)}
                          className="p-1 text-white/60 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(item.label)}
                          className="p-1 text-red-400 hover:text-red-300"
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/30 text-xs">No saved addresses yet.</p>
          )}
        </div>

        {/* ── Sign Out ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 text-red-400
                       hover:text-red-300 transition-colors py-1 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3
                   3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>

      </div>

      {showSaveAddr && (
        <SaveAddressModal
          destination={editingAddress || { address: '', coordinates: [] }}
          initialLabel={editingAddress?.label || 'home'}
          onSave={handleSaveAddress}
          onClose={() => {
            setShowSaveAddr(false);
            setEditingAddress(null);
          }}
          saving={savingAddress}
        />
      )}
      <BottomNav />
    </div>
  );
};

// ── Read-only info row ──
const InfoRow = ({ icon, label, value, dim }) => (
  <div className="flex items-center gap-3 py-1">
    <span className="text-white/30 flex-shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-white/30 text-[10px] uppercase tracking-wider leading-none mb-0.5">
        {label}
      </p>
      <p className={`text-sm truncate ${dim ? 'text-white/30 italic' : 'text-white'}`}>
        {value}
      </p>
    </div>
  </div>
);

const PersonIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0
         01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1
         1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716
         21 3 14.284 3 6V5z" />
  </svg>
);
const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2
         2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const StarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0
         00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0
         00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538
         1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1
         1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1
         1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

export default Profile;