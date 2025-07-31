import React from 'react';
import { useChat } from '../../context/ChatContext';
import {
  CalculatorIcon,
  DocumentTextIcon,
  UserIcon,
  HeartIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const DoctorChatMenu = ({ onSelectAction }) => {
  const { currentPrediction } = useChat();

  // Generate dynamic patient summary action based on current prediction context
  const getPatientSummaryAction = () => {
    if (currentPrediction && currentPrediction.patientId) {
      return `Show patient summary for ${currentPrediction.patientId}`;
    }
    return "Show patient summary (select a patient first)";
  };

  const tools = [
    {
      title: "Risk Calculator",
      icon: <CalculatorIcon className="h-5 w-5" />,
      action: "Calculate CVD risk for a patient"
    },
    {
      title: "Guidelines",
      icon: <DocumentTextIcon className="h-5 w-5" />,
      action: "Show me the latest AHA/ACC guidelines"
    },
    {
      title: "Medication Guide",
      icon: <HeartIcon className="h-5 w-5" />,
      action: "Recommend medications for high cholesterol"
    },
    {
      title: "Patient Summary",
      icon: <UserIcon className="h-5 w-5" />,
      action: getPatientSummaryAction(),
      disabled: !currentPrediction?.patientId
    },
    {
      title: "Test Analysis",
      icon: <ChartBarIcon className="h-5 w-5" />,
      action: "Analyze these ECG results"
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Clinical Tools</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tools.map((tool, index) => (
          <button
            key={index}
            onClick={() => onSelectAction(tool.action)}
            disabled={tool.disabled}
            className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
              tool.disabled 
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className={`mb-1 ${tool.disabled ? 'text-gray-400' : 'text-primary-600'}`}>
              {tool.icon}
            </div>
            <span className="text-xs text-center">{tool.title}</span>
          </button>
        ))}
      </div>
      <div className="mt-4">
        <h4 className="font-medium text-gray-800 mb-2">Quick Resources</h4>
        <div className="flex flex-wrap gap-2">
          {["Hypertension", "Heart Failure", "Arrhythmia", "CAD", "Stroke"].map((topic, i) => (
            <button
              key={i}
              onClick={() => onSelectAction(`Show resources about ${topic}`)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorChatMenu;