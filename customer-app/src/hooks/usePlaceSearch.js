import { useState, useRef, useCallback } from 'react';
import { smartSearch, getPlaceDetails } from '../utils/geoUtils';

const usePlaceSearch = () => {
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [selected,    setSelected]    = useState(null); // { address, coordinates, city }
  const debounceRef = useRef(null);

  // Call this on every keystroke
  const handleInput = useCallback((value, userCoords = null) => {
    setQuery(value);
    setSelected(null);
    clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const found = await smartSearch(value, userCoords);
      setResults(found);
      setLoading(false);
    }, 350);
  }, []);

  // Call this when user picks a suggestion
  const handleSelect = useCallback(async (place) => {
    setQuery(place.display_name || place.main_text || '');
    setResults([]);
    setLoading(true);

    const details = await getPlaceDetails(place.place_id);
    if (details) {
      setSelected(details);
      setQuery(details.address);
    } else {
      // Fallback — no coordinates available yet
      setSelected({ address: place.display_name, coordinates: null, city: '' });
    }
    setLoading(false);
    return details;
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setSelected(null);
    setLoading(false);
    clearTimeout(debounceRef.current);
  }, []);

  return {
    query,
    results,
    loading,
    selected,
    handleInput,
    handleSelect,
    clear,
    setSelected,
    setQuery,
  };
};

export default usePlaceSearch;