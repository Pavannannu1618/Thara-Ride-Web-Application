import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSocket } from './useSocket';
import { setDriverLocation, setRideStatus, setDriver } from '../app/slices/rideSlice';
import toast from 'react-hot-toast';
import { RIDE_STATUS_LABELS } from '../constants';

export const useRideTracking = (rideId) => {
  const dispatch = useDispatch();
  const { emit, on, off } = useSocket('/ride');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!rideId) return;

    emit('ride:join-room', rideId);
    setIsConnected(true);

    const handleLocationBroadcast = (data) => {
      dispatch(setDriverLocation({ lat: data.lat, lng: data.lng, heading: data.heading }));
    };

    const handleRideAccepted = (data) => {
      dispatch(setRideStatus('accepted'));
      dispatch(setDriver(data.ride?.driver));
      toast.success('🚗 Driver found! On the way...');
    };

    const handleStatusUpdate = ({ status }) => {
      dispatch(setRideStatus(status));
      const label = RIDE_STATUS_LABELS[status];
      if (label) toast(label, { icon: status === 'completed' ? '✅' : 'ℹ️' });
    };

    const handleCancelled = ({ reason, by }) => {
      dispatch(setRideStatus('cancelled'));
      toast.error(`Ride cancelled by ${by}: ${reason || 'No reason provided'}`);
    };

    const cleanup1 = on('driver:location-broadcast', handleLocationBroadcast);
    const cleanup2 = on('ride:accepted', handleRideAccepted);
    const cleanup3 = on('ride:status-update', handleStatusUpdate);
    const cleanup4 = on('ride:cancelled', handleCancelled);

    return () => {
      cleanup1?.();
      cleanup2?.();
      cleanup3?.();
      cleanup4?.();
      setIsConnected(false);
    };
  }, [rideId, dispatch, emit, on, off]);

  return { isConnected };
};