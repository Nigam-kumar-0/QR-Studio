import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  QrCode,
  LayoutDashboard,
  Sparkles,
  FolderKanban,
  BarChart3,
  Scan,
  History,
  Sun,
  Moon,
  User,
  UserPlus,
  LogIn,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function TopBar() {
  const { user, logout } = useAuth();
  const { toggleTheme, activeTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isCurrentActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/create' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  // For logged out users, only show accessible public routes
  const navLinks = user
    ? [
        { path: '/', label: 'Creator', icon: LayoutDashboard },
        { path: '/templates', label: 'Templates', icon: Sparkles },
        { path: '/library', label: 'QR Library', icon: FolderKanban },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/scanner', label: 'Scan QR', icon: Scan },
        { path: '/history', label: 'Scan History', icon: History },
      ]
    : [
        { path: '/', label: 'Creator', icon: LayoutDashboard },
        { path: '/templates', label: 'Templates', icon: Sparkles },
        { path: '/scanner', label: 'Scan QR', icon: Scan },
      ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-14 sm:h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl flex items-center justify-between shrink-0 z-30 transition-colors duration-200 sticky top-0">

      {/* Left: Brand Logo (always visible on both phone & desktop) */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0 group"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100">
              QR Studio
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Desktop Top Navigation Bar (Hidden on phone, shown on larger screens instead of sidebar) */}
      <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = isCurrentActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 lg:gap-2 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${isActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/30 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-900/60 border border-transparent'
                }`}
            >
              <Icon className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right: Theme Toggle & User Auth (Shown on both phone & desktop) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          title={`Toggle Theme (${activeTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'})`}
        >
          {activeTheme === 'dark' ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Auth State Actions */}
        {user ? (
          <div className="flex items-center gap-1.5">
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/80 hover:bg-slate-200/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
              title="View Profile"
            >
              <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center text-xs sm:text-[10px] font-bold shrink-0">
                {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[110px] truncate">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              type="button"
              className="hidden md:flex p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {location.pathname !== '/login' && (
              <Link
                to="/login"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                Sign In
              </Link>
            )}

            {location.pathname !== '/signup' && (
              <Link
                to="/signup"
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 hidden xs:inline" />
                <span>Sign Up</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
