import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch }     from 'react-redux';
import { useNavigate, useLocation }     from 'react-router-dom';

// Layout
import BottomNav        from '../components/layout/BottomNav';
import MapPicker        from '../components/map/MapPicker';

// Home-specific components
import SearchBar        from '../components/home/SearchBar';
import DestinationPill  from '../components/home/DestinationPill';
import QuickPicks       from '../components/home/QuickPicks';
import RideSelector     from '../components/home/RideSelector';
import BookBar          from '../components/home/BookBar';
import RecentRides      from '../components/home/RecentRides';
import SaveAddressModal from '../components/home/SaveAddressModal';

// Hooks
import useUserLocation  from '../hooks/useUserLocation';
import usePlaceSearch   from '../hooks/usePlaceSearch';

// Utils
import { enrichLocation, reverseGeocode } from '../utils/geoUtils';

// API + Redux
import { rideAPI, authAPI }  from '../services/api';
import { updateUser }        from '../app/slices/authSlice';

// ─────────────────────────────────────────────────────────────────────────────
const Home = () => {
  const { user }  = useSelector((s) => s.auth);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const location = useLocation();

  // ── Location (GPS + city name) ──────────────────────────────────────────
  const { userLat, userLng, cityName, pickup } = useUserLocation();

  // ── Destination passed from other page (e.g. profile) ─────────────────────
  useEffect(() => {
    if (location.state?.destination) {
      const dest = location.state.destination;
      if (dest.address && dest.coordinates?.length) {
        const enriched = enrichLocation(dest, userLat, userLng);
        setDestination(enriched);
        setInputText(dest.address.split(',').slice(0, 3).join(','));
      }
    }
  }, [location.state, userLat, userLng]);

  // ── Search ──────────────────────────────────────────────────────────────
  const {
    inputText, setInputText,
    suggestions, sugLoading,
    focused, setFocused, showDropdown,
    handleInputChange, handleClear, clearSuggestions,
  } = usePlaceSearch(userLat, userLng, cityName);

  // ── Booking state ───────────────────────────────────────────────────────
  const [destination,   setDestination]   = useState(null);
  const [selectedType,  setSelectedType]  = useState('mini');
  const [showMapPicker, setShowMapPicker] = useState(false);

  // ── Recent rides ────────────────────────────────────────────────────────
  const [recentRides, setRecent] = useState([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    rideAPI.getHistory({ page: 1, limit: 3 })
      .then((r) => setRecent(r.data?.data?.rides || []))
      .catch(() => {});
  }, []);

  // ── Save address modal ──────────────────────────────────────────────────
  const [showSaveAddr, setShowSaveAddr]   = useState(false);
  const [savingAddr, setSavingAddr]       = useState(false);
  const [saveLabel, setSaveLabel]         = useState('home');
  const [selectedQuick, setSelectedQuick] = useState('');

  // ── Handlers ────────────────────────────────────────────────────────────

  // Select suggestion from dropdown
  const handleSelectSuggestion = (item) => {
    const shortAddress = item.display_name.split(',').slice(0, 3).join(',');
    setInputText(shortAddress);
    setDestination({
      address:    item.display_name,
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
      distanceKm: item.distanceKm,
      roadKm:     item.roadKm,
      duration:   item.duration,
      fares:      item.fares,
    });
    clearSuggestions();
    setFocused(false);
  };

  // Select from MapPicker (enriches with distance + fares)
  const handleMapSelect = (loc) => {
    const enriched = enrichLocation(loc, userLat, userLng);
    setDestination(enriched);
    setInputText(loc.address.split(',').slice(0, 3).join(','));
    setShowMapPicker(false);
  };

  // Quick-pick Home / Work / Airport / More
  const handleQuickPick = (key) => {
    if (key === 'more') {
      setSelectedQuick('more');
      return; // handled by QuickPicks component (show saved addresses)
    }

    setSelectedQuick(key);

    const saved = user?.savedAddresses?.find((a) => a.label === key);
    if (saved?.coordinates?.length) {
      const enriched = enrichLocation(
        { address: saved.address, coordinates: saved.coordinates },
        userLat, userLng
      );
      setDestination(enriched);
      setInputText(saved.address.split(',').slice(0, 3).join(','));
      return;
    }

    // Address not saved yet — open modal pre-set to this label
    setSaveLabel(key);
    setShowSaveAddr(true);
  };

  // Clear destination
  const handleClearDestination = () => {
    handleClear();
    setDestination(null);
    setSelectedQuick('');
  };

  const handleGoToSaved = (item) => {
    if (!item?.address || !item?.coordinates?.length) return;
    const enriched = enrichLocation(
      { address: item.address, coordinates: item.coordinates },
      userLat, userLng
    );
    setDestination(enriched);
    setInputText(item.address.split(',').slice(0, 3).join(','));
    setSelectedQuick(item.label);
  };

  const handleEditSaved = (item) => {
    if (!item) return;
    setSaveLabel(item.label || 'more');
    setDestination({ address: item.address, coordinates: item.coordinates });
    setInputText(item.address.split(',').slice(0, 3).join(','));
    setShowSaveAddr(true);
    setSelectedQuick(item.label);
  };

  const handleRemoveSaved = async (label) => {
    try {
      const cleaned = (user?.savedAddresses || []).filter((a) => a.label !== label);
      const res = await authAPI.updateProfile({ savedAddresses: cleaned });
      const updatedUser = res.data?.data?.user;
      if (updatedUser) dispatch(updateUser(updatedUser));
      else dispatch(updateUser({ savedAddresses: cleaned }));
      if (selectedQuick === label) setSelectedQuick('');
    } catch (err) {
      console.error('Remove saved address failed', err);
    }
  };

  const handleRebook = (ride) => {
    if (!ride?.destination?.address || !ride?.destination?.location?.coordinates?.length) return;

    const destCoords = ride.destination.location.coordinates;
    const enriched = enrichLocation(
      { address: ride.destination.address, coordinates: destCoords },
      userLat,
      userLng,
    );

    setDestination(enriched);
    setInputText(ride.destination.address.split(',').slice(0, 3).join(','));
    setSelectedType(ride.rideType || 'mini');
    setSelectedQuick('');
  };

  // Save address with chosen label / destination (for custom edit)
  const handleSaveAddress = async (label, dest = null) => {
    const target = dest || destination;
    if (!target?.address) return;

    setSavingAddr(true);
    try {
      const existing = user?.savedAddresses || [];
      const updated  = [
        ...existing.filter((a) => a.label !== label),
        {
          label,
          address: target.address,
          coordinates: target.coordinates || [],
        },
      ];
      const res = await authAPI.updateProfile({ savedAddresses: updated });
      dispatch(updateUser(res.data?.data?.user || { savedAddresses: updated }));
      setShowSaveAddr(false);
    } catch { /* silent */ }
    finally { setSavingAddr(false); }
  };

  // Navigate to booking
  const handleBook = () => {
    navigate('/booking', {
      state: {
        pickup,
        destination,
        rideType:      selectedType,
        estimatedFare: destination?.fares?.[selectedType],
      },
    });
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#07070e] pb-28">

      {/* ── Header ── */}
      <div className="px-4 pt-8 pb-4 flex items-center justify-between">
        <div>
          <p className="text-white/40 text-sm">Good to see you,</p>
          <h1 className="text-white font-bold text-xl leading-tight">
            {user?.name || 'Rider'} 👋
          </h1>
          {cityName && (
            <p className="text-white/30 text-xs mt-0.5 flex items-center gap-1">
              <span className="text-amber-400">📍</span> {cityName}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/30
                     flex items-center justify-center text-amber-400 font-bold text-lg"
        >
          {user?.name?.[0]?.toUpperCase() || 'R'}
        </button>
      </div>

      {/* ── Where to? card ── */}
      <div className="mx-4 mt-2">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
            Where to?
          </p>

          <SearchBar
            inputText={inputText}
            onInputChange={handleInputChange}
            onClear={handleClearDestination}
            suggestions={suggestions}
            sugLoading={sugLoading}
            showDropdown={showDropdown}
            focused={focused}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSelectSuggestion={handleSelectSuggestion}
            onOpenMapPicker={() => setShowMapPicker(true)}
            cityName={cityName}
          />

          <DestinationPill
            destination={!focused ? destination : null}
            onSave={() => setShowSaveAddr(true)}
          />

          <QuickPicks
            savedAddresses={user?.savedAddresses}
            selectedKey={selectedQuick}
            onPick={handleQuickPick}
            onGoToSaved={handleGoToSaved}
            onEditSaved={handleEditSaved}
            onRemoveSaved={handleRemoveSaved}
          />
        </div>
      </div>

      {/* ── Ride selector ── */}
      {destination && (
        <RideSelector
          selectedType={selectedType}
          onSelect={setSelectedType}
          destination={destination}
        />
      )}

      {/* ── Book button + fare strip ── */}
      <BookBar
        selectedType={selectedType}
        destination={destination}
        onBook={handleBook}
      />

      {/* ── Recent rides ── */}
      <RecentRides
        rides={recentRides}
        onRideClick={(id) => navigate('/ride/' + id)}
        onRebook={handleRebook}
      />

      {/* ── Map Picker Modal ── */}
      {showMapPicker && (
        <MapPicker
          initialLocation={pickup?.coordinates}
          onSelect={handleMapSelect}
          onClose={() => setShowMapPicker(false)}
          reverseGeocode={async (lat, lng) => {
            const data = await reverseGeocode(lat, lng);
            return data?.display_name || null;
          }}
        />
      )}

      {/* ── Save Address Modal ── */}
      {showSaveAddr && (
        <SaveAddressModal
          destination={destination || { address: '', coordinates: [] }}
          initialLabel={saveLabel}
          onSave={handleSaveAddress}
          onClose={() => setShowSaveAddr(false)}
          saving={savingAddr}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default Home;