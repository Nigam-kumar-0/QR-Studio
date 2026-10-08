import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Scan, 
  History, 
  User, 
  Sun, 
  Moon, 
  LogOut,
  QrCode,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ onOpenScanner }) {
  const { user, role, logout } = useAuth();
  const { toggleTheme, activeTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home & Creator', icon: LayoutDashboard },
    { path: '/templates', label: 'QR Templates', icon: Sparkles },
    { path: '/library', label: 'QR Library', icon: FolderKanban },
    { path: '/scanner', label: 'Scan QR Code', icon: Scan },
    { path: '/history', label: 'Scan History', icon: History },
    { path: '/profile', label: 'User Profile', icon: User },
  ];

  const isCurrentActive = (itemPath) => {
    if (itemPath === '/') {
      return location.pathname === '/' || location.pathname === '/create' || location.pathname === '/dashboard';
    }
    return location.pathname === itemPath;
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen border-r border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl shrink-0 select-none transition-colors duration-200">
      
      {/* Brand Header */}
      <Link to="/" className="flex items-center gap-3 px-6 h-18 border-b border-slate-200 dark:border-slate-800/80 hover:opacity-90 transition-opacity">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
          <QrCode className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
            QR Studio
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">QR Code Studio</p>
        </div>
      </Link>

      {/* Navigation List */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isCurrentActive(item.path);

          if (item.isAction) {
            return (
              <button
                key={item.path}
                type="button"
                onClick={onOpenScanner}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/25 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Auth Navigation when unauthenticated */}
        {!user && (
          <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Account
            </div>
            <Link
              to="/login"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                location.pathname === '/login'
                  ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/25 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/signup"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                location.pathname === '/signup'
                  ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/25 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </Link>
          </div>
        )}
      </div>

      {/* User Session & Theme Control */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40">
        {user ? (
          <div className="flex items-center justify-between">
            <Link to="/profile" className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity flex-1 min-w-0 mr-1">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 flex items-center justify-center text-xs font-semibold text-indigo-700 dark:text-slate-300 shrink-0">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.displayName || 'User'}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email || 'user@qrstudio.app'}</div>
              </div>
            </Link>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={`Toggle Theme (${activeTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'})`}
                >
                  {activeTheme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Guest Mode</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={`Toggle Theme (${activeTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'})`}
            >
              {activeTheme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
