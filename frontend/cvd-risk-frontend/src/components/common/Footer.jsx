import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-primary-700 to-primary-600 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <div className="bg-white rounded-full p-1">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full" />
              </div>
              <span className="ml-3 text-xl font-bold">CardioGuard</span>
            </div>
            <p className="mt-2 text-sm opacity-80">
              Cardiovascular Disease Risk Prediction System
            </p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-gray-200">
              About
            </a>
            <a href="#" className="hover:text-gray-200">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-gray-200">
              Terms
            </a>
            <a href="#" className="hover:text-gray-200">
              Contact
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-white/20 pt-4 text-center text-sm">
          <p>© {new Date().getFullYear()} CardioGuard. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
