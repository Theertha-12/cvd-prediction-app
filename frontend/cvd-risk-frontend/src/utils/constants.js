export const RISK_CATEGORIES = {
  Low: {
    label: 'Low Risk',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300'
  },
  Moderate: {
    label: 'Moderate Risk',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300'
  },
  High: {
    label: 'High Risk',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300'
  }
};

export const PREDICTION_FIELDS = [
  { id: 'sex', label: 'Sex', type: 'radio', options: [{ value: 0, label: 'Female' }, { value: 1, label: 'Male' }] },
  { id: 'age', label: 'Age', type: 'number', min: 18, max: 120, unit: 'years' },
  { id: 'cigsPerDay', label: 'Cigarettes per Day', type: 'number', min: 0, max: 100 },
  { id: 'totChol', label: 'Total Cholesterol', type: 'number', min: 100, max: 600, unit: 'mg/dL' },
  { id: 'sysBP', label: 'Systolic BP', type: 'number', min: 80, max: 300, unit: 'mmHg' },
  { id: 'diaBP', label: 'Diastolic BP', type: 'number', min: 40, max: 200, unit: 'mmHg' },
  { id: 'glucose', label: 'Glucose Level', type: 'number', min: 50, max: 500, unit: 'mg/dL' }
];

export const DASHBOARD_STATS = {
  patient: [
    { id: 'total_predictions', label: 'Total Predictions', icon: '📊' },
    { id: 'recent_predictions', label: 'Recent Activity', icon: '🔄' },
    { id: 'current_risk', label: 'Current Risk', icon: '⚠️' }
  ],
  doctor: [
    { id: 'total_patients', label: 'Total Patients', icon: '👥' },
    { id: 'total_predictions', label: 'Total Predictions', icon: '📊' },
    { id: 'recent_activity', label: 'Recent Activity', icon: '🔄' },
    { id: 'high_risk', label: 'High Risk Patients', icon: '⚠️' }
  ]
};
