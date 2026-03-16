import { createSlice } from '@reduxjs/toolkit';

const rideSlice = createSlice({
  name: 'ride',
  initialState: {
    // ── Rider ──
    currentRide:      null,
    fareEstimate:     null,
    pickup:           null,
    destination:      null,
    selectedRideType: null,
    bookingStep:      0,
    promoCode:        null,
    paymentMethod:    'cash',
    isSearching:      false,
    isScheduled:      false,
    scheduledAt:      null,

    // ── Driver (on rider side — the assigned driver info) ──
    driver:           null,
    driverLocation:   null,
    eta:              null,

    // ── Driver App ──
    isOnline:         false,
    rideRequest:      null,
    rideStatus:       null,

    // ── Shared ──
    loading:          false,
    error:            null,
  },
  reducers: {
    // ── Rider ──
    setCurrentRide:      (s, { payload }) => { s.currentRide      = payload; },
    setFareEstimate:     (s, { payload }) => { s.fareEstimate     = payload; },
    setPickup:           (s, { payload }) => { s.pickup           = payload; },
    setDestination:      (s, { payload }) => { s.destination      = payload; },
    setSelectedRideType: (s, { payload }) => { s.selectedRideType = payload; },
    setBookingStep:      (s, { payload }) => { s.bookingStep      = payload; },
    setPromoCode:        (s, { payload }) => { s.promoCode        = payload; },
    setPaymentMethod:    (s, { payload }) => { s.paymentMethod    = payload; },
    setIsSearching:      (s, { payload }) => { s.isSearching      = payload; },
    setIsScheduled:      (s, { payload }) => { s.isScheduled      = payload; },
    setScheduledAt:      (s, { payload }) => { s.scheduledAt      = payload; },

    // ── Tracking ──
    setDriver:           (s, { payload }) => { s.driver           = payload; },
    setDriverLocation:   (s, { payload }) => { s.driverLocation   = payload; },
    setEta:              (s, { payload }) => { s.eta              = payload; },

    // ── Driver App ──
    setOnline:           (s, { payload }) => { s.isOnline         = payload; },
    setRideRequest:      (s, { payload }) => { s.rideRequest      = payload; },
    clearRideRequest:    (s)              => { s.rideRequest      = null;    },
    setRideStatus:       (s, { payload }) => { s.rideStatus       = payload; },

    // ── Full reset ──
    resetRide: (s) => {
      s.currentRide      = null;
      s.fareEstimate     = null;
      s.selectedRideType = null;
      s.bookingStep      = 0;
      s.promoCode        = null;
      s.paymentMethod    = 'cash';
      s.isSearching      = false;
      s.isScheduled      = false;
      s.scheduledAt      = null;
      s.driver           = null;
      s.driverLocation   = null;
      s.eta              = null;
      s.rideRequest      = null;
      s.rideStatus       = null;
    },

    setLoading: (s, { payload }) => { s.loading = payload; },
    setError:   (s, { payload }) => { s.error   = payload; },
  },
});

export const {
  // Rider
  setCurrentRide, setFareEstimate, setPickup, setDestination,
  setSelectedRideType, setBookingStep, setPromoCode, setPaymentMethod,
  setIsSearching, setIsScheduled, setScheduledAt,
  // Tracking
  setDriver, setDriverLocation, setEta,
  // Driver app
  setOnline, setRideRequest, clearRideRequest, setRideStatus,
  // Shared
  resetRide, setLoading, setError,
} = rideSlice.actions;

export default rideSlice.reducer;