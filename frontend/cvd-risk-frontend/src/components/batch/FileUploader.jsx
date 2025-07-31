import React, { useState, useRef } from 'react';
import { CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline';

const FileUploader = ({ onFileUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const validateFile = (file) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel'];
    const validExtensions = ['.csv'];
    const fileExtension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert('Please upload a CSV file only.');
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB.');
      return false;
    }
    
    return true;
  };

  const handleUpload = () => {
    if (selectedFile && onFileUpload) {
      onFileUpload(selectedFile);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
        <p className="text-sm text-gray-600">
          Upload a CSV file containing patient data. Required columns: sex, age, cigsPerDay, 
          totChol, sysBP, diaBP, glucose.
        </p>
      </div>

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : selectedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedFile ? (
          <div className="text-center">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <button
                type="button"
                onClick={openFileDialog}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Choose CSV File
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              or drag and drop your CSV file here
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Maximum file size: 10MB
            </p>
          </div>
        ) : (
          <div className="text-center">
            <DocumentIcon className="mx-auto h-12 w-12 text-green-500" />
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="mt-4 space-x-3">
              <button
                type="button"
                onClick={handleUpload}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Upload & Predict'
                )}
              </button>
              <button
                type="button"
                onClick={clearFile}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sample CSV Format */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Expected CSV Format:</h4>
        <div className="text-xs text-gray-600 font-mono bg-white p-2 rounded border">
          sex,age,cigsPerDay,totChol,sysBP,diaBP,glucose<br/>
          0,60,0,220,138,88,100<br/>
          1,50,15,240,150,95,110
        </div>
      </div>
    </div>
  );
};

export default FileUploader;