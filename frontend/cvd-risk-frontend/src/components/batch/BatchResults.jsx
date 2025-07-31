import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useChat } from '../../context/ChatContext';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

const BatchResults = ({ results, onClear, filename = 'batch_results.csv' }) => {
  const { setCurrentPrediction } = useChat();
  const { clearChatHistory } = useAppContext(); // For clearing chat when switching patients
  const navigate = useNavigate();

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No results to display</p>
      </div>
    );
  }

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return <XCircleIcon className="h-5 w-5" />;
      case 'medium':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'low':
        return <CheckCircleIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const downloadCSV = () => {
    const headers = ['ID', 'Name', 'Age', 'Risk Level', 'Risk Score', 'Key Factors'];
    const csvContent = [
      headers.join(','),
      ...results.map(row => [
        row.id || '',
        row.name || '',
        row.age || '',
        row.risk || '',
        row.score || '',
        (row.keyFactors || []).join(';') || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPatients = results.length;
  const highRisk = results.filter(r => r.risk?.toLowerCase() === 'high').length;
  const mediumRisk = results.filter(r => r.risk?.toLowerCase() === 'medium').length;
  const lowRisk = results.filter(r => r.risk?.toLowerCase() === 'low').length;

  // ENHANCED: Better chat integration with patient context switching
  const handleStartChat = (result) => {
    const patientContext = {
      patientId: result.id || result.name,
      patientName: result.name,
      age: result.age,
      riskScore: result.score || 0,
      riskCategory: result.risk || 'Unknown',
      keyFactors: result.keyFactors || [],
      // Add batch context
      source: 'batch_analysis',
      batchFile: filename
    };

    // Set the prediction context
    setCurrentPrediction(patientContext);
    
    // Clear any existing chat history to start fresh for this patient
    // This ensures clean context switching between patients
    clearChatHistory();
    
    // Navigate to chat
    navigate('/chat');
    
    console.log('🏥 Starting chat with patient context:', patientContext);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">Total Patients</h3>
          <p className="text-2xl font-bold text-blue-900">{totalPatients}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">High Risk</h3>
          <p className="text-2xl font-bold text-red-900">{highRisk}</p>
          <p className="text-xs text-red-600 mt-1">
            {totalPatients > 0 ? Math.round((highRisk / totalPatients) * 100) : 0}% of total
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800">Medium Risk</h3>
          <p className="text-2xl font-bold text-yellow-900">{mediumRisk}</p>
          <p className="text-xs text-yellow-600 mt-1">
            {totalPatients > 0 ? Math.round((mediumRisk / totalPatients) * 100) : 0}% of total
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Low Risk</h3>
          <p className="text-2xl font-bold text-green-900">{lowRisk}</p>
          <p className="text-xs text-green-600 mt-1">
            {totalPatients > 0 ? Math.round((lowRisk / totalPatients) * 100) : 0}% of total
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Prediction Results</h3>
          <p className="text-sm text-gray-500 mt-1">
            Click "Discuss" to start a focused conversation about any patient
          </p>
        </div>
        <div className="space-x-3">
          <button
            onClick={downloadCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Download CSV
          </button>
          <button
            onClick={onClear}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key Risk Factors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, index) => (
                <tr key={result.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {result.name || `Patient ${index + 1}`}
                      </div>
                      {result.id && (
                        <div className="text-xs text-gray-500 ml-2">
                          ID: {result.id}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.age || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(result.risk)}`}>
                      {getRiskIcon(result.risk)}
                      <span className="ml-1">{result.risk || 'Unknown'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="mr-2 font-medium">
                        {result.score ? (result.score * 100).toFixed(1) + '%' : 'N/A'}
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            result.risk?.toLowerCase() === 'high' ? 'bg-red-500' :
                            result.risk?.toLowerCase() === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(result.score || 0) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {result.keyFactors && result.keyFactors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {result.keyFactors.slice(0, 3).map((factor, idx) => (
                            <span 
                              key={idx}
                              className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                            >
                              {factor}
                            </span>
                          ))}
                          {result.keyFactors.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{result.keyFactors.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No factors listed</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleStartChat(result)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors"
                      title={`Start focused discussion about ${result.name || `Patient ${index + 1}`}`}
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                      Discuss
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Helper Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">Chat Integration</h4>
            <p className="text-sm text-blue-700 mt-1">
              When you click "Discuss" for a patient, the chat will automatically load their risk profile and key factors. 
              This allows for contextual medical discussions specific to each patient's cardiovascular risk assessment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchResults;