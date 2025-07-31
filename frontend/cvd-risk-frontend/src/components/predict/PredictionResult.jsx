import React from 'react';
import { getRiskCategoryInfo } from '../../utils/helpers';

const PredictionResult = ({ prediction }) => {
  // Early return if prediction is not available
  if (!prediction) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
        <div className="text-center text-gray-500">
          No prediction data available
        </div>
      </div>
    );
  }

  const categoryInfo = getRiskCategoryInfo(prediction.risk_category);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className={`p-6 ${categoryInfo.bgColor} ${categoryInfo.borderColor} border-b-4`}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Risk Assessment Result</h2>
            <p className="mt-1 text-gray-600">Based on your input data</p>
          </div>
          <div className={`px-4 py-2 rounded-full ${categoryInfo.bgColor} ${categoryInfo.color} text-sm font-semibold`}>
            {categoryInfo.label}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Risk Probability</h3>
            <span className="text-3xl font-bold text-gray-900">
              {prediction.risk_percentage || 0}%
            </span>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-gray-600">
                  0%
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-gray-600">
                  100%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-200">
              <div
                style={{ width: `${prediction.risk_percentage || 0}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                  prediction.risk_category === 'Low'
                    ? 'bg-gradient-to-r from-green-400 to-green-500'
                    : prediction.risk_category === 'Moderate'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 px-1">
              <span>Low Risk</span>
              <span>Moderate</span>
              <span>High Risk</span>
            </div>
          </div>
        </div>

        {prediction.personalized_advice && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Personalized Advice</h3>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-gray-700">{prediction.personalized_advice}</p>
            </div>
          </div>
        )}

        {prediction.features_used && Object.keys(prediction.features_used).length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Features Used</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(prediction.features_used).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                  </div>
                  <div className="text-lg font-medium text-gray-900">
                    {value !== null && value !== undefined ? value : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionResult;

