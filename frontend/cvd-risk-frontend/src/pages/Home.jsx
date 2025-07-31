import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="bg-[#0073B8] text-white font-bold text-xl rounded-lg w-10 h-10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">CardioGuard</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-[#0073B8] font-medium">
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-[#0073B8] text-white font-medium rounded-lg hover:bg-[#2199D6] transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-r from-[#0073B8] to-[#2199D6] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Take Control of Your Heart Health
              </h1>
              <p className="mt-4 text-xl max-w-3xl">
                CardioGuard helps you understand your cardiovascular risk with AI-powered predictions and personalized health insights.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="px-6 py-3 bg-white text-[#0073B8] font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-md"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-transparent border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#2199D6] rounded-full opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#2199D6] rounded-full opacity-30 animate-pulse delay-300"></div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl w-full h-96 flex items-center justify-center p-8 relative z-10">
                  <div className="bg-white rounded-full p-6 shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="w-48 h-48 text-[#0073B8]"
                      fill="currentColor"
                    >
                      <path d="M14 20.408c-.492.308-.903.546-1.192.709-.153.086-.308.17-.463.252h-.002a.75.75 0 01-.686 0 16.709 16.709 0 01-.465-.252 31.147 31.147 0 01-4.803-3.34C3.8 15.572 1 12.331 1 8.513 1 5.052 3.829 2.5 6.736 2.5 9.03 2.5 10.881 3.726 12 5.605 13.12 3.726 14.97 2.5 17.264 2.5 20.17 2.5 23 5.052 23 8.514c0 3.818-2.801 7.06-5.389 9.262A31.146 31.146 0 0114 20.408z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Understanding Cardiovascular Disease
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-600">
              Cardiovascular diseases (CVDs) are the leading cause of death globally, but many are preventable.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
              <div className="text-5xl font-bold text-blue-600 mb-4">17.9M</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Annual Deaths</h3>
              <p className="text-gray-600">
                CVDs account for an estimated 17.9 million deaths each year, representing 32% of all global deaths.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-red-500">
              <div className="text-5xl font-bold text-red-600 mb-4">85%</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Premature Deaths</h3>
              <p className="text-gray-600">
                Over 85% of CVD deaths are due to heart attacks and strokes, and one third occur prematurely in people under 70.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500">
              <div className="text-5xl font-bold text-green-600 mb-4">80%</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Preventable</h3>
              <p className="text-gray-600">
                At least 80% of premature heart disease and stroke is preventable through lifestyle changes and early detection.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">How CardioGuard Works</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              A simple, three-step process to understand and improve your cardiovascular health.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border-t-4 border-blue-500">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <div className="bg-blue-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  1
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center">Provide Health Information</h3>
              <p className="mt-4 text-gray-600 text-center">
                Securely share your health metrics like blood pressure, cholesterol levels, and lifestyle factors.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border-t-4 border-purple-500">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <div className="bg-purple-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  2
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center">AI Risk Assessment</h3>
              <p className="mt-4 text-gray-600 text-center">
                Our algorithm analyzes your data using clinical guidelines to assess your cardiovascular risk.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border-t-4 border-green-500">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <div className="bg-green-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  3
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center">Personalized Plan</h3>
              <p className="mt-4 text-gray-600 text-center">
                Receive actionable recommendations tailored to your specific risk factors and health profile.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#0073B8] to-[#2199D6] rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-12 sm:px-16 sm:py-16 lg:py-20 lg:px-24">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white">
                  Ready to take control of your heart health?
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-blue-100">
                  Get your personalized cardiovascular risk assessment in minutes.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Link
                    to="/register"
                    className="px-8 py-3 bg-white text-[#0073B8] font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-md"
                  >
                    Get Started Today
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-sm">© 2025 CardioGuard. All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
