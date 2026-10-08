import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Sparkles, Scan, FolderKanban, User, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const isCurrentActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/create' || location.pathname === '/dashboard';
    }
    if (path === '/profile') {
      return location.pathname === '/profile' || location.pathname === '/settings';
    }
    return location.pathname === path;
  };

  // For logged out users, only show accessible public tabs (Home, Templates, Scan, Sign In)
  const items = user
    ? [
        { path: '/', label: 'Home', icon: LayoutDashboard },
        { path: '/templates', label: 'Templates', icon: Sparkles },
        { path: '/scanner', label: 'Scan', icon: Scan, isCenter: true },
        { path: '/library', label: 'Library', icon: FolderKanban },
        { path: '/profile', label: 'Profile', icon: User },
      ]
    : [
        { path: '/', label: 'Creator', icon: LayoutDashboard },
        { path: '/templates', label: 'Templates', icon: Sparkles },
        { path: '/scanner', label: 'Scan', icon: Scan, isCenter: true },
        { path: '/login', label: 'Sign In', icon: LogIn },
      ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/80 safe-bottom transition-colors duration-200">
      <div className="flex items-center justify-around h-16 px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isCurrentActive(item.path);

          if (item.isCenter) {
            return (
              <Link
                key={item.label}
                to="/scanner"
                className="relative -top-2 flex flex-col items-center justify-center group cursor-pointer focus:outline-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 group-active:scale-95 transition-transform border border-indigo-400/30">
                  <Scan className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1">Scan</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-all rounded-xl cursor-pointer ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/15' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
