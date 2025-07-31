import React, { useState } from 'react';

const PatientChatMenu = ({ onSelectQuestion }) => {
  const [selectedRisk, setSelectedRisk] = useState(null);
  
  const riskCategories = [
    {
      level: 'low',
      label: 'Generally well',
      emoji: '😊',
      title: 'Heart Health Maintenance',
      icon: '💚',
      questions: [
        'What foods boost heart health?',
        'How much exercise is ideal?',
        'Is red wine beneficial?',
        'Stress management techniques'
      ]
    },
    {
      level: 'medium',
      label: 'Some concerns',
      emoji: '😟',
      title: 'Symptom Evaluation',
      icon: '🟠',
      questions: [
        'When to worry about chest discomfort?',
        'Is this fatigue heart-related?',
        'Managing high blood pressure',
        'Understanding cholesterol levels'
      ]
    },
    {
      level: 'high',
      label: 'Urgent symptoms',
      emoji: '😨',
      title: 'Critical Care Guidance',
      icon: '🔴',
      questions: [
        'Recognizing heart attack symptoms',
        'What to do during palpitations',
        'Emergency medication interactions',
        'When to call emergency services'
      ]
    }
  ];

  const handleRiskSelect = (level) => {
    setSelectedRisk(level === selectedRisk ? null : level);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 mb-4">
      {/* Emergency Banner */}
      <div className="emergency-banner bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-3 mb-5 animate-pulse">
        <div className="flex items-start">
          <span className="mr-2 text-xl">⚠️</span>
          <p className="text-sm">
            If experiencing <strong>chest pain</strong>, <strong>severe shortness of breath</strong>, 
            or <strong>sudden dizziness</strong>, call emergency services immediately
          </p>
        </div>
      </div>

      {/* Risk Selector */}
      <div className="risk-selector mb-5">
        <h3 className="text-lg font-medium text-gray-900 mb-3">How are you feeling today?</h3>
        <div className="grid grid-cols-3 gap-3">
          {riskCategories.map((category) => (
            <button
              key={category.level}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 ${
                selectedRisk === category.level
                  ? category.level === 'low' 
                    ? 'bg-green-100 border-2 border-green-300 scale-[1.03] shadow-sm' 
                    : category.level === 'medium' 
                    ? 'bg-yellow-100 border-2 border-yellow-300 scale-[1.03] shadow-sm' 
                    : 'bg-red-100 border-2 border-red-300 scale-[1.03] shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => handleRiskSelect(category.level)}
            >
              <span className="text-2xl mb-1">{category.emoji}</span>
              <span className="text-sm font-medium">{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Question Panels */}
      {selectedRisk && (
        <div className="question-panel bg-gray-50 rounded-xl p-4 animate-fadeIn">
          {riskCategories
            .filter(cat => cat.level === selectedRisk)
            .map(category => (
              <div key={category.level}>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <span className="mr-2 text-lg">{category.icon}</span>
                  {category.title}
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {category.questions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => onSelectQuestion(question)}
                      className="w-full text-left px-4 py-3 bg-white hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-start"
                    >
                      <span className="mr-2">•</span>
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
      
      {/* Quick Resources */}
      <div className="mt-5 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-800 mb-3">Quick Resources</h4>
        <div className="flex flex-wrap gap-2">
          {['Understanding ECGs', 'Blood pressure guide', 'Cholesterol explained', 'Heart-healthy recipes'].map((topic, i) => (
            <button
              key={i}
              onClick={() => onSelectQuestion(`Tell me about ${topic}`)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientChatMenu;
