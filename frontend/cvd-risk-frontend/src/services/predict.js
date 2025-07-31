import api from './api';

export const predictCvdRisk = async (data) => {
  const response = await api.post('/predict/single', data);
  return response.data;
};

export const getPredictionHistory = async (limit = 10) => {
  const response = await api.get('/predict/history', { params: { limit } });
  return response.data;
};

export const processBatchPrediction = async (formData) => {
  const response = await api.post('/batch/predict-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const savePredictionResult = async (predictionId) => {
  const response = await api.post(`/predict/save/${predictionId}`);
  return response.data;
};

export const downloadPredictionReport = async (predictionId) => {
  const response = await api.get(`/predict/report/${predictionId}`, {
    responseType: 'blob'
  });
  return response.data;
};
