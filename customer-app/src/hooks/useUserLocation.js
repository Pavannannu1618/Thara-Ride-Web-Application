import { useState, useEffect } from 'react';
import { reverseGeocode }      from '../utils/geoUtils';

const useUserLocation = () => {
  const [coords,   setCoords]   = useState(null);  // [lng, lat]
  const [cityName, setCityName] = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords([lng, lat]);

        try {
          const address = await reverseGeocode(lat, lng);
          // Extract city — usually the second-to-last comma-separated segment
          const parts = address.split(',');
          const city  = parts.length >= 2
            ? parts[parts.length - 3]?.trim() || parts[0]?.trim()
            : parts[0]?.trim();
          setCityName(city || 'your area');
        } catch {
          setCityName('your area');
        }

        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        // Default to Hyderabad if permission denied
        setCoords([78.4867, 17.3850]);
        setCityName('Hyderabad');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  return { coords, cityName, loading, error };
};

export default useUserLocation;