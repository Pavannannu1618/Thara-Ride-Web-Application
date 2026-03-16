import { useState, useRef, useCallback } from 'react';
import { smartSearch } from '../utils/geoUtils';

/**
 * Manages destination search state.
 * Debounces input at 380 ms, calls smartSearch with city bias + fuzzy matching.
 *
 * Usage:
 *   const { inputText, suggestions, sugLoading, focused,
 *           handleInputChange, handleClear, setFocused } = usePlaceSearch(userLat, userLng, cityName);
 */
const usePlaceSearch = (userLat, userLng, cityName) => {
  const [inputText,   setInputText]   = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading,  setSugLoading]  = useState(false);
  const [focused,     setFocused]     = useState(false);

  const debounceRef = useRef(null);

  const handleInputChange = useCallback((val) => {
    setInputText(val);
    clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSugLoading(true);
      try {
        const results = await smartSearch(val, userLat, userLng, cityName);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSugLoading(false);
      }
    }, 380);
  }, [userLat, userLng, cityName]);

  const handleClear = useCallback(() => {
    clearTimeout(debounceRef.current);
    setInputText('');
    setSuggestions([]);
  }, []);

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  const showDropdown = focused && (sugLoading || suggestions.length > 0 || inputText.length > 1);

  return {
    inputText,
    setInputText,
    suggestions,
    sugLoading,
    focused,
    setFocused,
    showDropdown,
    handleInputChange,
    handleClear,
    clearSuggestions,
  };
};

export default usePlaceSearch;