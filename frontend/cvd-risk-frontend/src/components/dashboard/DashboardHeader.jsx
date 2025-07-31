import React from 'react';
import { useAuth } from '../../context/AuthContext';

const DashboardHeader = () => {
  const { user } = useAuth();

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.full_name}</h1>
      <p className="mt-2 text-lg text-gray-600">
        {user.role === 'doctor'
          ? 'Review patient insights and clinical data'
          : 'Track your heart health and risk factors'}
      </p>
    </div>
  );
};

export default DashboardHeader;
