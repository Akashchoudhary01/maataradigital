import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for API calls with loading/error state management
 */
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall, { successMessage, onSuccess, onError } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      if (successMessage) toast.success(successMessage);
      if (onSuccess) onSuccess(result.data);
      return result.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'An error occurred';
      setError(message);
      toast.error(message);
      if (onError) onError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
};

export default useApi;
