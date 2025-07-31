import { useState, useCallback } from 'react';
import api from '../services/api';

export default function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const request = useCallback(async (method, endpoint, body = null, config = {}) => {
    setLoading(true);
    setError(null);

    try {
      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await api.get(endpoint, config);
          break;
        case 'post':
          response = await api.post(endpoint, body, config);
          break;
        case 'put':
          response = await api.put(endpoint, body, config);
          break;
        case 'delete':
          response = await api.delete(endpoint, config);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'An error occurred';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    data,
    request
  };
}
