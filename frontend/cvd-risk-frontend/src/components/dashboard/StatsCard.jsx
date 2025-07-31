import React from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { 
  BarChart3, 
  Clock, 
  Users, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Eye,
  Activity,
  Heart
} from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  trend, 
  icon, 
  isRisk = false, 
  valueSuffix = '', 
  onViewDetails,
  className = ''
}) => {
  const getIcon = (iconName) => {
    const iconProps = { className: "w-5 h-5 sm:w-6 sm:h-6" };
    
    switch (iconName) {
      case 'chartBar':
        return <BarChart3 {...iconProps} />;
      case 'clock':
        return <Clock {...iconProps} />;
      case 'userGroup':
        return <Users {...iconProps} />;
      case 'exclamation':
        return <AlertTriangle {...iconProps} />;
      case 'shieldExclamation':
        return <ShieldAlert {...iconProps} />;
      case 'activity':
        return <Activity {...iconProps} />;
      case 'heart':
        return <Heart {...iconProps} />;
      default:
        return <BarChart3 {...iconProps} />;
    }
  };

  const getTrendIcon = (trendValue) => {
    if (trendValue > 0) {
      return <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />;
    } else if (trendValue < 0) {
      return <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
    return null;
  };

  const getTrendColor = (trendValue, isRiskCard = false) => {
    if (trendValue > 0) {
      return isRiskCard ? 'text-red-600' : 'text-green-600';
    } else if (trendValue < 0) {
      return isRiskCard ? 'text-green-600' : 'text-red-600';
    }
    return 'text-gray-500';
  };

  const getCardColor = (isRiskCard = false) => {
    if (isRiskCard) {
      return 'border-l-red-500 bg-red-50/30';
    }
    return 'border-l-blue-500 bg-blue-50/30';
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      }
      return val.toString();
    }
    return val || '0';
  };

  return (
    <div className={`
      relative bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 
      ${getCardColor(isRisk)} 
      p-4 sm:p-6 
      transition-all duration-200 hover:shadow-md hover:scale-[1.02]
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`
          p-2 sm:p-3 rounded-lg 
          ${isRisk ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}
        `}>
          {getIcon(icon)}
        </div>
        
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1 sm:space-y-2">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">
          {title}
        </h3>
        
        <div className="flex items-end justify-between">
          <div className="flex items-baseline space-x-1">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              {formatValue(value)}
            </span>
            {valueSuffix && (
              <span className="text-sm sm:text-base text-gray-500 font-medium">
                {valueSuffix}
              </span>
            )}
          </div>
          
          {trend !== undefined && trend !== null && (
            <div className={`
              flex items-center space-x-1 text-xs sm:text-sm font-medium
              ${getTrendColor(trend, isRisk)}
            `}>
              {getTrendIcon(trend)}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>

        {/* Trend Description */}
        {trend !== undefined && trend !== null && (
          <p className="text-xs text-gray-500 mt-1">
            {trend > 0 ? 'Increased' : trend < 0 ? 'Decreased' : 'No change'} from last period
          </p>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none" />
    </div>
  );
};

export default StatsCard;
