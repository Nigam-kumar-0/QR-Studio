import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to login page and clear the history stack
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Failed to log out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Account Profile</h1>
        <p className="mt-2 text-gray-600">Manage your account details and active session.</p>
      </div>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          
          {/* Avatar Display */}
          <div className="flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full shrink-0 shadow-sm border border-blue-200">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-blue-600 uppercase">
                {user?.email?.charAt(0) || 'U'}
              </span>
            )}
          </div>

          {/* Core User Info */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.displayName || 'QR Studio User'}
            </h2>
            <p className="text-gray-500 mt-1">{user?.email}</p>
            <div className="inline-flex items-center px-2.5 py-0.5 mt-3 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              Active Session
            </div>
          </div>
        </div>

        {/* Technical Details Section */}
        <div className="pt-6 mt-8 border-t border-gray-100">
          <h3 className="mb-4 text-sm font-medium tracking-wider text-gray-500 uppercase">
            Technical Details
          </h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-xs font-mono text-gray-900 break-all bg-gray-50 p-2 rounded border border-gray-100">
                {user?.uid}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Authentication Provider</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user?.providerData?.[0]?.providerId === 'google.com' 
                  ? 'Google OAuth' 
                  : 'Email / Password'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Actions Area */}
        <div className="pt-6 mt-8 border-t border-gray-100 flex justify-end">
          <Button 
            variant="danger" 
            onClick={handleLogout}
            className="px-6"
          >
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}