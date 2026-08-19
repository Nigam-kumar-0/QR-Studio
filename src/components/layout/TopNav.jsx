import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

export default function TopNav({ toggleSidebar }) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 sm:px-6 lg:px-8">
      {/* Mobile Menu Toggle */}
      <button
        onClick={toggleSidebar}
        className="p-2 text-gray-500 rounded-md md:hidden hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Right Side: Auth / Profile */}
      <div className="flex items-center justify-end flex-1">
        {user ? (
          <Link 
            to="/profile" 
            className="flex items-center space-x-3 transition-opacity hover:opacity-80 focus:outline-none"
          >
            {/* Name/Email (Hidden on small mobile screens) */}
            <div className="flex-col hidden text-right sm:flex">
              <span className="text-sm font-medium text-gray-900">
                {user.displayName || 'User'}
              </span>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>
            
            {/* Avatar */}
            <div className="flex items-center justify-center w-8 h-8 overflow-hidden font-bold text-blue-600 uppercase bg-blue-100 border border-blue-200 rounded-full">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Avatar" 
                  className="object-cover w-full h-full" 
                />
              ) : (
                user.email?.charAt(0) || 'U'
              )}
            </div>
          </Link>
        ) : (
          <Link to="/login">
            <Button className="px-4 py-1.5 text-sm">Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  );
}