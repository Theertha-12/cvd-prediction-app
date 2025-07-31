import React from 'react';

const RiskGauge = ({ value = 0, category = 'Low', size = 'medium' }) => {
  // Ensure value is a number and within 0-100 range
  const normalizedValue = Math.max(0, Math.min(100, typeof value === 'number' ? value : 0));
  
  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-32 h-32',
      strokeWidth: 8,
      fontSize: 'text-lg',
      labelSize: 'text-xs'
    },
    medium: {
      container: 'w-40 h-40 sm:w-48 sm:h-48',
      strokeWidth: 10,
      fontSize: 'text-xl sm:text-2xl',
      labelSize: 'text-sm'
    },
    large: {
      container: 'w-48 h-48 sm:w-56 sm:h-56',
      strokeWidth: 12,
      fontSize: 'text-2xl sm:text-3xl',
      labelSize: 'text-base'
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;
  
  // Calculate circle properties
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  // Get colors based on risk category
  const getRiskColors = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'high':
        return {
          primary: '#DC2626', // red-600
          secondary: '#FEE2E2', // red-100
          gradient: 'from-red-500 to-red-600',
          text: 'text-red-600',
          bg: 'bg-red-50'
        };
      case 'moderate':
      case 'medium':
        return {
          primary: '#D97706', // amber-600
          secondary: '#FEF3C7', // amber-100
          gradient: 'from-amber-500 to-orange-600',
          text: 'text-amber-600',
          bg: 'bg-amber-50'
        };
      case 'low':
      default:
        return {
          primary: '#059669', // emerald-600
          secondary: '#D1FAE5', // emerald-100
          gradient: 'from-emerald-500 to-green-600',
          text: 'text-emerald-600',
          bg: 'bg-emerald-50'
        };
    }
  };

  const colors = getRiskColors(category);

  // Animation duration based on value
  const animationDuration = Math.max(1, normalizedValue / 20); // 1-5 seconds

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Gauge Container */}
      <div className={`relative ${config.container} flex items-center justify-center`}>
        {/* Background Circle */}
        <svg
          className="absolute inset-0 w-full h-full transform -rotate-90"
          viewBox="0 0 160 160"
        >
          {/* Background track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={config.strokeWidth}
            className="opacity-50"
          />
          
          {/* Progress circle with gradient */}
          <defs>
            <linearGradient id={`riskGradient-${category}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.8" />
              <stop offset="100%" stopColor={colors.primary} stopOpacity="1" />
            </linearGradient>
          </defs>
          
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={`url(#riskGradient-${category})`}
            strokeWidth={config.strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.1))'
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className={`${config.fontSize} font-bold ${colors.text} mb-1`}>
            {normalizedValue}%
          </div>
          <div className={`${config.labelSize} font-medium text-gray-600 uppercase tracking-wide`}>
            Risk
          </div>
        </div>

        {/* Animated pulse effect for high risk */}
        {category?.toLowerCase() === 'high' && (
          <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping" />
        )}
      </div>

      {/* Risk Category Badge */}
      <div className={`
        px-4 py-2 rounded-full ${colors.bg} ${colors.text} 
        font-semibold text-sm border border-current border-opacity-20
        transition-all duration-200 hover:scale-105
      `}>
        {category?.charAt(0).toUpperCase() + category?.slice(1).toLowerCase() || 'Unknown'} Risk
      </div>

      {/* Risk Level Indicator */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Low</span>
          <span>Moderate</span>
          <span>High</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full flex">
            <div className="flex-1 bg-emerald-400"></div>
            <div className="flex-1 bg-amber-400"></div>
            <div className="flex-1 bg-red-400"></div>
          </div>
          {/* Current position indicator */}
          <div 
            className="relative -mt-2 h-2"
            style={{ marginLeft: `${normalizedValue}%`, transform: 'translateX(-50%)' }}
          >
            <div className={`w-1 h-4 ${colors.bg} border-2 border-current ${colors.text} rounded-full`}></div>
          </div>
        </div>
      </div>

      {/* Additional Risk Insights */}
      <div className="text-center space-y-1 max-w-xs">
        <div className="text-xs text-gray-600">
          {normalizedValue < 30 && "Maintain healthy lifestyle habits"}
          {normalizedValue >= 30 && normalizedValue < 70 && "Consider lifestyle improvements"}
          {normalizedValue >= 70 && "Consult healthcare provider immediately"}
        </div>
        
        {/* Risk trend indicator */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1 h-3 rounded-full transition-colors duration-300 ${
                  i < Math.floor(normalizedValue / 20) 
                    ? colors.primary.includes('red') ? 'bg-red-400' : 
                      colors.primary.includes('amber') ? 'bg-amber-400' : 'bg-emerald-400'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskGauge;

