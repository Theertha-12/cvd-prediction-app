import React from 'react';
import { getRiskCategoryInfo } from '../../utils/helpers';

const RiskIndicator = ({ category }) => {
  const categoryInfo = getRiskCategoryInfo(category);
  return (
    <div className="flex items-center">
      <div className={`w-3 h-3 rounded-full mr-2 ${categoryInfo.bgColor}`} />
      <span className={`text-sm font-medium ${categoryInfo.color}`}>
        {categoryInfo.label}
      </span>
    </div>
  );
};

export default RiskIndicator;
