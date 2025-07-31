import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', allowed: ['patient', 'doctor'] },
  { name: 'Predict', href: '/predict', allowed: ['patient', 'doctor'] },
  { name: 'Batch Predict', href: '/batch-predict', allowed: ['doctor'] },
  { name: 'Chat', href: '/chat', allowed: ['patient', 'doctor'] },
];

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const { resetChat, resetPrediction } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    // Reset context when navigating away from relevant pages
    if (location.pathname === '/chat' && path !== '/chat') {
      resetChat();
    }
    if (location.pathname === '/predict' && path !== '/predict') {
      resetPrediction();
    }
    navigate(path);
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <Disclosure as="nav" className="bg-gradient-to-r from-primary-700 to-primary-600 shadow-lg">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <div className="bg-white rounded-full p-1">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full" />
                  </div>
                  <span className="ml-3 text-white text-xl font-bold">CardioGuard</span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center">
                  <div className="flex space-x-4">
                    {navigation.map((item) => {
                      const shouldShow = isAuthenticated && item.allowed.includes(user?.role);
                      return shouldShow && (
                        <button
                          key={item.name}
                          onClick={() => handleNavigation(item.href)}
                          className="text-white hover:bg-primary-500 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {isAuthenticated ? (
                  <Menu as="div" className="ml-3 relative">
                    <div>
                      <Menu.Button className="flex text-sm rounded-full">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-primary-700 font-bold text-lg">
                          {user?.full_name?.charAt(0)}
                        </div>
                      </Menu.Button>
                    </div>
                    <Transition
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => handleNavigation('/profile')}
                              className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                            >
                              Your Profile
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleNavigation('/login')}
                      className="text-white hover:bg-primary-500 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sign in
                    </button>
                    <button
                      onClick={() => handleNavigation('/register')}
                      className="bg-white text-primary-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-primary-500 focus:outline-none">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const shouldShow = isAuthenticated && item.allowed.includes(user?.role);
                return shouldShow && (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className="text-white hover:bg-primary-500 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
            <div className="pt-4 pb-3 border-t border-primary-500">
              {isAuthenticated ? (
                <div className="flex items-center px-5">
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-primary-700 font-bold text-lg">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">{user?.full_name}</div>
                    <div className="text-sm font-medium text-primary-200">{user?.email}</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 px-2">
                  <button
                    onClick={() => handleNavigation('/login')}
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-500 w-full text-left"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => handleNavigation('/register')}
                    className="block px-3 py-2 rounded-md text-base font-medium text-primary-700 bg-white w-full text-left"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar;