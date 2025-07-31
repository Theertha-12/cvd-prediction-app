import React, { useState } from 'react';
import { formatDate } from '../../utils/helpers';
import { getRiskCategoryInfo } from '../../utils/helpers';

const PredictionHistory = ({ predictions }) => {
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  if (!predictions || predictions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No prediction history available</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {predictions.map((prediction) => {
              const categoryInfo = getRiskCategoryInfo(prediction.risk_category);
              return (
                <tr key={prediction.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(prediction.created_at)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {prediction.risk_percentage}%
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryInfo.bgColor} ${categoryInfo.color}`}
                    >
                      {categoryInfo.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    <button
                      className="text-primary-600 hover:text-primary-900"
                      onClick={() => setSelectedPrediction(prediction)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedPrediction && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPrediction(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Prediction Details</h3>
            <div className="space-y-2">
              <p><strong>Date:</strong> {formatDate(selectedPrediction.created_at)}</p>
              <p><strong>Risk Percentage:</strong> {selectedPrediction.risk_percentage}%</p>
              <p><strong>Risk Category:</strong> {selectedPrediction.risk_category}</p>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Features:</h4>
                <ul className="grid grid-cols-2 gap-2">
                  <li><strong>Age:</strong> {selectedPrediction.features?.age || 'N/A'}</li>
                  <li><strong>Sex:</strong> {selectedPrediction.features?.sex || 'N/A'}</li>
                  <li><strong>Cholesterol:</strong> {selectedPrediction.features?.totChol || 'N/A'}</li>
                  <li><strong>Systolic BP:</strong> {selectedPrediction.features?.sysBP || 'N/A'}</li>
                  <li><strong>Diastolic BP:</strong> {selectedPrediction.features?.diaBP || 'N/A'}</li>
                  <li><strong>Glucose:</strong> {selectedPrediction.features?.glucose || 'N/A'}</li>
                  <li><strong>Cigarettes/Day:</strong> {selectedPrediction.features?.cigsPerDay || 'N/A'}</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => setSelectedPrediction(null)}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PredictionHistory;

