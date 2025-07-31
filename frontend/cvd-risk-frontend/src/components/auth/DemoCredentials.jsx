import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const DemoCredentials = () => {
  const [showCredentials, setShowCredentials] = useState(false);
  const { login } = useAuth();

  const handleUseDemo = async (role) => {
    const credentials = role === 'doctor'
      ? { email: 'doctor@demo.com', password: 'doctor123' }
      : { email: 'patient@demo.com', password: 'patient123' };
    await login(credentials.email, credentials.password);
  };

  return (
    <div className="text-center">
      <button
        onClick={() => setShowCredentials(!showCredentials)}
        className="text-sm text-primary-600 hover:text-primary-800"
      >
        {showCredentials ? 'Hide Demo Credentials' : 'Use Demo Account'}
      </button>
      {showCredentials && (
        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Select a demo account to sign in:</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => handleUseDemo('patient')}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300"
            >
              Patient Demo
            </button>
            <button
              onClick={() => handleUseDemo('doctor')}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300"
            >
              Doctor Demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoCredentials;
