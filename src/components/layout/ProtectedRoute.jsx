import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  // If no user is logged in, send them to the login page 
  // but save the location they were trying to access
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated, render the child routes (Dashboard, Profile, etc.)
  return <Outlet />;
}