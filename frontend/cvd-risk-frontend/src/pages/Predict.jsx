import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import RiskForm from '../components/predict/RiskForm';
import PredictionResult from '../components/predict/PredictionResult';
import { useAppContext } from '../context/AppContext';
import { predictCvdRisk } from '../services/predict';

const Predict = () => {
  const { predictionData, setPredictionData, resetPrediction } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to format error messages
  const formatErrorMessage = (error) => {
    // If it's a validation error array
    if (Array.isArray(error.response?.data?.detail)) {
      return error.response.data.detail
        .map(err => `${err.loc?.join(' -> ') || 'Field'}: ${err.msg}`)
        .join(', ');
    }
    
    // If it's a single validation error object
    if (error.response?.data?.detail && typeof error.response.data.detail === 'object') {
      const detail = error.response.data.detail;
      if (detail.msg) {
        return `${detail.loc?.join(' -> ') || 'Error'}: ${detail.msg}`;
      }
    }
    
    // If it's a string message
    if (typeof error.response?.data?.detail === 'string') {
      return error.response.data.detail;
    }
    
    // If there's a general message
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    // Fallback message
    return 'Failed to get prediction. Please try again.';
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Call the real API instead of mock data
      const prediction = await predictCvdRisk(formData);
      setPredictionData(prediction);
    } catch (error) {
      console.error('Prediction failed:', error);
      const errorMessage = formatErrorMessage(error);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cardiovascular Risk Assessment</h1>
          <p className="mt-2 text-lg text-gray-600">
            Enter your health information to calculate your risk of cardiovascular disease
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <RiskForm
              onSubmit={handleSubmit}
              initialData={predictionData?.formData || {}}
              isSubmitting={isSubmitting}
            />
          </div>
          <div>
            {predictionData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Prediction Results</h2>
                  <button
                    onClick={resetPrediction}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Reset Prediction
                  </button>
                </div>
                <PredictionResult prediction={predictionData} />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto" />
                <h3 className="mt-4 text-xl font-medium text-gray-900">No prediction yet</h3>
                <p className="mt-2 text-gray-500">
                  Fill out the form to see your cardiovascular risk assessment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Predict;