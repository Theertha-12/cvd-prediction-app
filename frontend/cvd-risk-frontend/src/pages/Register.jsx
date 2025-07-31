import React from 'react';
import MainLayout from '../layouts/MainLayout';
import RegisterForm from '../components/auth/RegisterForm';

const Register = () => (
  <MainLayout>
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 flex items-center justify-center">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create a new account
          </h2>
        </div>
        <RegisterForm />
      </div>
    </div>
  </MainLayout>
);

export default Register;
