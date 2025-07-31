import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HomeIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Navigation items with conditional rendering for Batch Predict
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Risk Prediction', href: '/predict', icon: ChartBarIcon },
    ...(user?.role === 'doctor' 
      ? [{ name: 'Batch Predict', href: '/batch-predict', icon: ClipboardDocumentListIcon }] 
      : []),
    { name: 'AI Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      <div className="flex items-center justify-center h-16 bg-gradient-to-r from-purple-600 to-blue-500">
        <h1 className="text-xl font-bold text-white">CVD Risk</h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-purple-100 text-purple-700 border-r-4 border-purple-500'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-purple-500' : 'text-gray-400'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          © 2024 CVD Risk Platform
        </div>
      </div>
    </div>
  );
};

export default Sidebar;