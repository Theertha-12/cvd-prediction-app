import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Track unauthorized access attempts
  useEffect(() => {
    if (!loading && isAuthenticated && allowedRoles && !allowedRoles.includes(user?.role)) {
      console.warn(`Unauthorized access attempt to ${location.pathname} by ${user?.role} role`);
      toast.error("You don't have permission to access this page", {
        toastId: 'unauthorized-access'
      });
    }
  }, [loading, isAuthenticated, allowedRoles, user?.role, location.pathname]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

