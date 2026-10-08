import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getUserQRCodes, 
  getAllScanEvents, 
  getScanHistory 
} from '../services/storageService';
import { 
  Mail, QrCode, Scan, History, LogOut, 
  Edit3, Check, Layers, BarChart3, 
  ArrowRight, Copy, CheckCheck
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    createdCount: 0,
    dynamicCount: 0,
    totalScansReceived: 0,
    scansPerformed: 0,
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      if (user?.uid) {
        const codes = await getUserQRCodes(user.uid);
        const scans = await getAllScanEvents();
        const history = getScanHistory();

        const userCodes = new Set(codes.map(c => c.id));
        const userScans = scans.filter(s => userCodes.has(s.qrId));

        if (isMounted) {
          setStats({
            createdCount: codes.length,
            dynamicCount: codes.filter(c => c.isDynamic).length,
            totalScansReceived: userScans.length,
            scansPerformed: history.length,
          });
        }
      } else {
        const history = getScanHistory();
        if (isMounted) {
          setStats(prev => ({ ...prev, scansPerformed: history.length }));
        }
      }
    }
    fetchStats();
    return () => { isMounted = false; };
  }, [user]);

  const handleUpdateName = (e) => {
    e.preventDefault();
    if (displayName.trim()) {
      updateProfile(displayName.trim());
      setIsEditingName(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const initials = (user?.displayName || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 theme-bg-page transition-colors duration-200">
      
      {/* Top Header Row — Standard SPA Alignment */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
            User Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
            Manage your account and view your QR performance
          </p>
        </div>

        {/* Compact Sign Out Button (Icon on mobile, text on desktop) */}
        <button
          onClick={handleLogout}
          type="button"
          className="h-9 px-2.5 sm:px-3.5 rounded-xl border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
          title="Sign out of account"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Sign Out</span>
        </button>
      </div>

      {/* Main Profile Info Card */}
      <div className="glass-panel p-5 sm:p-7 rounded-3xl w-full space-y-6 shadow-sm">
        
        {/* User Identity Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            
            {/* Avatar with Ring */}
            <div className="relative shrink-0">
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-md shadow-indigo-600/25 ring-2 sm:ring-4 ring-indigo-50 dark:ring-indigo-500/10 shrink-0">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 flex items-center justify-center text-white" title="Active Account">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </div>

            {/* User Meta Information (Clean & Uncluttered: Name + Email only) */}
            <div className="min-w-0 space-y-1 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user?.displayName || 'QR Studio User'}
                </h2>
                <span className="badge-pill text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 leading-none shrink-0">
                  Member
                </span>
              </div>

              {/* Email with Quick Copy */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user?.email || 'user@qrstudio.app'}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user?.email, 'email')}
                  className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  title="Copy email address"
                >
                  {copiedField === 'email' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Edit Name Button — Compact */}
          <button
            type="button"
            onClick={() => {
              setIsEditingName(!isEditingName);
              setDisplayName(user?.displayName || '');
            }}
            className="h-8.5 px-2.5 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
            title={isEditingName ? 'Cancel editing' : 'Edit profile name'}
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden xs:inline">{isEditingName ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        {/* Edit Name Collapsible Drawer */}
        {isEditingName && (
          <form 
            onSubmit={handleUpdateName} 
            className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-500/30 flex flex-col sm:flex-row items-center gap-2.5 transition-all"
          >
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-indigo-600 dark:focus:border-indigo-500 transition-colors"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button
                type="submit"
                disabled={!displayName.trim()}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="h-9 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Update Success Banner */}
        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 border border-emerald-200 dark:border-emerald-500/20">
            <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">Name updated successfully</span>
          </div>
        )}

        {/* 4-Item Key Metrics Grid */}
        <div className="pt-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
            Activity Overview
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            
            {/* Created QRs */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Created QRs</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <QrCode className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">{stats.createdCount}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">In library</p>
              </div>
            </div>

            {/* Dynamic Links */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dynamic Links</span>
                <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-sky-600 dark:text-sky-400">{stats.dynamicCount}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Editable URLs</p>
              </div>
            </div>

            {/* Scans Received */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Scans Received</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{stats.totalScansReceived}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Link visits</p>
              </div>
            </div>

            {/* Camera Scans */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Device Scans</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Scan className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{stats.scansPerformed}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">In history</p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
          Quick Links
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          <Link
            to="/"
            className="glass-panel p-3.5 sm:p-4 rounded-2xl flex items-center justify-between hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-all group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Create QR</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500">Design codes</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/library"
            className="glass-panel p-3.5 sm:p-4 rounded-2xl flex items-center justify-between hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-all group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">My Library</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500">Saved QR codes</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/analytics"
            className="glass-panel p-3.5 sm:p-4 rounded-2xl flex items-center justify-between hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-all group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Analytics</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500">Scan metrics</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/history"
            className="glass-panel p-3.5 sm:p-4 rounded-2xl flex items-center justify-between hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-all group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Scan History</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500">Logged scans</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>

    </div>
  );
}
