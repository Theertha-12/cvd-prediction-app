import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import FileUploader from '../components/batch/FileUploader';
import BatchResults from '../components/batch/BatchResults';
import { useAppContext } from '../context/AppContext';

const BatchPredict = () => {
  const { 
    batchResults, 
    batchFileName, 
    setBatchPredictionResults, 
    clearBatchResults 
  } = useAppContext();
  
  const [isLoading, setIsLoading] = useState(false);

  // No need for local state - using context for persistence
  const results = batchResults;
  const uploadedFileName = batchFileName;

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    
    try {
      // Process the uploaded file
      // This is where you'd call your API
      console.log('Processing file:', file.name);
      
      // For now, simulate processing
      setTimeout(() => {
        const mockResults = [
          { 
            id: 1, 
            name: 'John Doe', 
            age: 45, 
            risk: 'High', 
            score: 0.85,
            keyFactors: ['High cholesterol', 'Smoking', 'Age']
          },
          { 
            id: 2, 
            name: 'Jane Smith', 
            age: 38, 
            risk: 'Medium', 
            score: 0.62,
            keyFactors: ['Moderate BP', 'Family history']
          },
          { 
            id: 3, 
            name: 'Bob Johnson', 
            age: 52, 
            risk: 'Low', 
            score: 0.23,
            keyFactors: ['Good lifestyle', 'Regular exercise']
          },
          { 
            id: 4, 
            name: 'Alice Brown', 
            age: 60, 
            risk: 'High', 
            score: 0.78,
            keyFactors: ['Diabetes', 'High BP']
          },
          { 
            id: 5, 
            name: 'Charlie Wilson', 
            age: 29, 
            risk: 'Low', 
            score: 0.15,
            keyFactors: ['Young age', 'Active lifestyle']
          }
        ];
        
        // Save to persistent context
        setBatchPredictionResults(mockResults, file.name);
        setIsLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error processing file:', error);
      setIsLoading(false);
    }
  };

  const handleClearResults = () => {
    clearBatchResults();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Batch Prediction
          </h1>
          <p className="text-gray-600">
            Upload a CSV file to predict cardiovascular risk for multiple patients at once
          </p>
          
          {/* Show persistence status */}
          {results && (
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
              <p className="text-sm text-blue-800">
                📋 Results from "{uploadedFileName}" are saved and will persist across page navigation
              </p>
            </div>
          )}
        </div>

        {/* File Uploader */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <FileUploader 
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
          />
        </div>

        {/* Results */}
        {results ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Batch Results - {uploadedFileName}
              </h2>
              <div className="text-sm text-gray-500">
                Results will persist until manually cleared
              </div>
            </div>
            <BatchResults 
              results={results}
              onClear={handleClearResults}
              filename={uploadedFileName || 'batch_results.csv'}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
              <p className="text-gray-500">
                Upload a CSV file to see batch prediction results
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BatchPredict;