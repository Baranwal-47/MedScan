import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isAuthReady, user } = useAuth();
  const [, navigate] = useLocation();

  React.useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthReady, isAuthenticated, navigate]);

  if (!isAuthReady || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
