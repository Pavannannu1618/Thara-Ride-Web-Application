import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setBookingStep, setPaymentMethod, setPromoCode, setCurrentRide, setIsSearching } from '../../app/slices/rideSlice';
import { rideAPI } from '../../services/api';
import { PAYMENT_METHODS, RIDE_TYPES } from '../../constants';
import { formatCurrency } from '../../utils/helpers';
import Button from '../common/Button';
import { ChevronLeft, Tag, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const FareCard = () => {
  const dispatch = useDispatch();
  const { pickup, destination, selectedRideType, fareEstimate, paymentMethod, promoCode } = useSelector((s) => s.ride);
  const [loading, setLoading] = useState(false);
  const [promoInput, setPromoInput] = useState(promoCode || '');
  const [promoApplied, setPromoApplied] = useState(false);

  const selectedType = RIDE_TYPES.find((r) => r.id === selectedRideType);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    // In production, validate via API
    dispatch(setPromoCode(promoInput.toUpperCase()));
    setPromoApplied(true);
    toast.success('Promo code applied!');
  };

  const handleBookRide = async () => {
    setLoading(true);
    try {
      const res = await rideAPI.bookRide({
        pickup: pickup.location,
        destination: destination.location,
        rideType: selectedRideType,
        paymentMethod,
        promoCode: promoApplied ? promoCode : undefined,
      });
      dispatch(setCurrentRide(res.data.data.ride));
      dispatch(setIsSearching(true));
      dispatch(setBookingStep(4));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!fareEstimate) return null;

  const { baseFare, surgeMultiplier, totalFare, breakdown } = fareEstimate;
  const promoDiscount = promoApplied ? Math.ceil(totalFare * 0.1) : 0;
  const finalFare = totalFare - promoDiscount;

  return (
    <div className="flex flex-col gap-4">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button onClick={() => dispatch(setBookingStep(2))} className="p-2 rounded-full hover:bg-white/10">
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">Confirm booking</h2>
      </div>

      {/* Ride Summary */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{selectedType?.icon}</span>
          <div>
            <p className="font-semibold text-lg">{selectedType?.label}</p>
            <p className="text-sm text-white/60">{pickup?.location?.address} → {destination?.location?.address}</p>
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="border-t border-white/10 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Base fare</span>
            <span>{formatCurrency(breakdown?.base || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Distance charge</span>
            <span>{formatCurrency(breakdown?.distanceCharge || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Time charge</span>
            <span>{formatCurrency(breakdown?.timeCharge || 0)}</span>
          </div>
          {surgeMultiplier > 1 && (
            <div className="flex justify-between text-sm text-yellow-400">
              <span>Surge ({surgeMultiplier}x)</span>
              <span>+{formatCurrency(Math.ceil(baseFare * (surgeMultiplier - 1)))}</span>
            </div>
          )}
          {promoDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-400">
              <span>Promo discount</span>
              <span>-{formatCurrency(promoDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
            <span>Total</span>
            <span className="text-primary-500">{formatCurrency(finalFare)}</span>
          </div>
        </div>
      </div>

      {/* Promo Code */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            className="input-field pl-9 text-sm"
            placeholder="Promo code"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            disabled={promoApplied}
          />
          {promoApplied && <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />}
        </div>
        {!promoApplied && (
          <button onClick={handleApplyPromo} className="px-4 py-3 bg-white/10 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors">
            Apply
          </button>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <p className="text-sm text-white/60 mb-2">Payment method</p>
        <div className="grid grid-cols-4 gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm.id}
              onClick={() => dispatch(setPaymentMethod(pm.id))}
              className={`p-3 rounded-xl text-center transition-all border-2 ${
                paymentMethod === pm.id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-transparent bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-xl mb-1">{pm.icon}</div>
              <div className="text-xs text-white/60">{pm.label}</div>
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleBookRide} loading={loading} fullWidth>
        Book {selectedType?.label} · {formatCurrency(finalFare)}
      </Button>
    </div>
  );
};

export default FareCard;