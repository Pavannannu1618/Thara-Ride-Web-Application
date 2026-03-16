import { useState, useEffect } from 'react';
import { reverseGeocode, extractCity } from '../utils/geoUtils';

/**
 * Detects device GPS location once on mount.
 * Returns: { userLat, userLng, cityName, pickup }
 *
 * pickup = { address: 'Current location', coordinates: [lng, lat] }
 * cityName = e.g. 'Hyderabad' — used to bias search results
 */
const useUserLocation = () => {
  const [userLat,  setUserLat]  = useState(null);
  const [userLng,  setUserLng]  = useState(null);
  const [cityName, setCityName] = useState('');
  const [pickup,   setPickup]   = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setUserLat(lat);
        setUserLng(lng);
        setPickup({
          address:     'Current location',
          coordinates: [lng, lat],
        });

        // Detect city for biased search
        try {
          const data = await reverseGeocode(lat, lng);
          if (data?.address) setCityName(extractCity(data.address));
        } catch { /* silent */ }
      },
      () => { /* Permission denied or unavailable — silently skip */ }
    );
  }, []);

  return { userLat, userLng, cityName, pickup };
};

export default useUserLocation;