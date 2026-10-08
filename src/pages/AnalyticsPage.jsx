import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getUserQRCodes, 
  getAllScanEvents, 
  updateDynamicDestination,
  toggleQRCodeStatus 
} from '../services/storageService';
import { 
  BarChart3, 
  TrendingUp, 
  Smartphone, 
  Laptop, 
  Globe, 
  Calendar, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  ToggleLeft, 
  ToggleRight, 
  Edit3, 
  CheckCircle2, 
  QrCode, 
  Filter, 
  Clock, 
  ArrowUpRight, 
  Layers,
  ChevronRight,
  ShieldCheck,
  Search,
  AlertCircle
} from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedQrId = searchParams.get('id') || 'all';

  const [qrList, setQrList] = useState([]);
  const [scanEvents, setScanEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [timeRange, setTimeRange] = useState('all'); // 'today' | '7d' | '30d' | 'all'
  const [logSearch, setLogSearch] = useState('');
  
  // Single QR actions state
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditingDest, setIsEditingDest] = useState(false);
  const [newDestination, setNewDestination] = useState('');
  const [statusToggling, setStatusToggling] = useState(false);

  // Load user's QR codes and all scans
  const loadData = async () => {
    setLoading(true);
    try {
      const [codes, allScans] = await Promise.all([
        getUserQRCodes(user?.uid),
        getAllScanEvents()
      ]);
      setQrList(codes);
      setScanEvents(allScans);
    } catch (e) {
      console.error('Failed to load analytics data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Currently focused QR code (if selectedQrId !== 'all')
  const focusedQR = useMemo(() => {
    if (selectedQrId === 'all') return null;
    return qrList.find(q => q.id === selectedQrId) || null;
  }, [selectedQrId, qrList]);

  useEffect(() => {
    if (focusedQR) {
      setNewDestination(focusedQR.destinationUrl || focusedQR.data?.url || '');
    }
  }, [focusedQR]);

  // Set selected QR in URL query param
  const handleSelectQR = (id) => {
    if (id === 'all') {
      searchParams.delete('id');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ id });
    }
  };

  // Filter scan events based on selected QR and time range
  const filteredScans = useMemo(() => {
    const userQrIds = new Set(qrList.map(q => q.id));
    
    // Filter by user ownership & specific QR selection
    let scans = scanEvents.filter(s => {
      if (selectedQrId === 'all') {
        return userQrIds.has(s.qrId);
      }
      return s.qrId === selectedQrId;
    });

    // Filter by time range
    if (timeRange !== 'all') {
      const now = new Date();
      let cutoff = new Date();
      if (timeRange === 'today') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (timeRange === '7d') {
        cutoff.setDate(now.getDate() - 7);
      } else if (timeRange === '30d') {
        cutoff.setDate(now.getDate() - 30);
      }
      scans = scans.filter(s => new Date(s.timestamp) >= cutoff);
    }

    return scans;
  }, [scanEvents, qrList, selectedQrId, timeRange]);

  // Calculated Metrics
  const metrics = useMemo(() => {
    const totalScans = filteredScans.length;
    const dynamicQRs = qrList.filter(q => q.isDynamic);
    
    // Unique devices
    const deviceSet = new Set(filteredScans.map(s => s.device || 'Unknown'));
    
    // Top performer
    const scanCountMap = {};
    scanEvents.forEach(s => {
      scanCountMap[s.qrId] = (scanCountMap[s.qrId] || 0) + 1;
    });
    
    let topQR = null;
    let maxScans = -1;
    qrList.forEach(q => {
      const count = scanCountMap[q.id] || q.scansCount || 0;
      if (count > maxScans) {
        maxScans = count;
        topQR = { ...q, calculatedScans: count };
      }
    });

    return {
      totalScans,
      dynamicCount: dynamicQRs.length,
      uniqueDevices: deviceSet.size || (totalScans > 0 ? 1 : 0),
      topQR: maxScans > 0 ? topQR : null,
    };
  }, [filteredScans, qrList, scanEvents]);

  // Device & OS Breakdown Calculations
  const deviceBreakdown = useMemo(() => {
    const counts = {};
    filteredScans.forEach(s => {
      const d = s.device || 'Mobile';
      counts[d] = (counts[d] || 0) + 1;
    });
    const total = filteredScans.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
    }));
  }, [filteredScans]);

  const osBreakdown = useMemo(() => {
    const counts = {};
    filteredScans.forEach(s => {
      const os = s.os || 'Other';
      counts[os] = (counts[os] || 0) + 1;
    });
    const total = filteredScans.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
    }));
  }, [filteredScans]);

  // 7-day Scan Activity Timeline Chart
  const timelineData = useMemo(() => {
    const days = [];
    const dayCounts = {};
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      days.push(dateKey);
      dayCounts[dateKey] = 0;
    }

    filteredScans.forEach(s => {
      const sDate = new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (dayCounts[sDate] !== undefined) {
        dayCounts[sDate] += 1;
      }
    });

    const maxCount = Math.max(...Object.values(dayCounts), 1);
    return days.map(label => ({
      label,
      count: dayCounts[label] || 0,
      heightPct: Math.round(((dayCounts[label] || 0) / maxCount) * 100),
    }));
  }, [filteredScans]);

  // Filtered Scan Event Logs (with text search)
  const displayLogs = useMemo(() => {
    if (!logSearch.trim()) return filteredScans;
    const term = logSearch.toLowerCase();
    return filteredScans.filter(s => 
      (s.device && s.device.toLowerCase().includes(term)) ||
      (s.browser && s.browser.toLowerCase().includes(term)) ||
      (s.os && s.os.toLowerCase().includes(term)) ||
      (s.referrer && s.referrer.toLowerCase().includes(term)) ||
      (s.timestamp && s.timestamp.toLowerCase().includes(term))
    );
  }, [filteredScans, logSearch]);

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredScans.length === 0) {
      alert('No scan events available to export.');
      return;
    }

    const headers = ['Timestamp', 'QR_ID', 'Device', 'Browser', 'OS', 'Referrer'];
    const rows = filteredScans.map(s => [
      `"${s.timestamp}"`,
      `"${s.qrId}"`,
      `"${s.device || 'Unknown'}"`,
      `"${s.browser || 'Unknown'}"`,
      `"${s.os || 'Unknown'}"`,
      `"${s.referrer || 'Direct'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const fileName = focusedQR 
      ? `${focusedQR.name.replace(/\s+/g, '_')}_scans.csv` 
      : `qr_studio_scans_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Actions for focused QR code
  const handleCopyShortLink = () => {
    if (!focusedQR?.shortCode) return;
    const link = `${window.location.origin}/r/${focusedQR.shortCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveDestination = async () => {
    if (!newDestination.trim() || !focusedQR) return;
    await updateDynamicDestination(focusedQR.id, newDestination.trim(), user);
    setIsEditingDest(false);
    await loadData();
  };

  const handleToggleStatus = async () => {
    if (!focusedQR || statusToggling) return;
    setStatusToggling(true);
    const nextStatus = !(focusedQR.active !== false);
    await toggleQRCodeStatus(focusedQR.id, nextStatus, user);
    await loadData();
    setStatusToggling(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 theme-bg-page transition-colors duration-200">
      
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>QR Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor scan volume, visitor devices, operating systems, and traffic trends.
          </p>
        </div>

        {/* Global Controls: Refresh & Export */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-xs transition-colors cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-500' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & QR Selector Bar */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        
        {/* QR Code Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 min-w-0">
          <label htmlFor="qr-selector" className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-indigo-500" />
            <span>Filter by QR:</span>
          </label>
          <div className="relative w-full sm:max-w-md">
            <select
              id="qr-selector"
              value={selectedQrId}
              onChange={(e) => handleSelectQR(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 cursor-pointer shadow-xs truncate"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1 font-semibold">
                All QR Codes ({qrList.length} total)
              </option>
              {qrList.map(q => (
                <option key={q.id} value={q.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1">
                  {q.name} ({q.scansCount || 0} scans) • {q.isDynamic ? 'Dynamic' : 'Static'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Range Pills */}
        <div className="flex items-center gap-1 self-start md:self-auto bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shrink-0">
          {[
            { id: 'all', label: 'All Time' },
            { id: '30d', label: 'Last 30D' },
            { id: '7d', label: 'Last 7D' },
            { id: 'today', label: 'Today' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTimeRange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === tab.id
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Focused QR Code Highlight Card (when a single QR code is selected) */}
      {focusedQR && (
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border-2 border-indigo-500/30 dark:border-indigo-500/20 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                    {focusedQR.name}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    focusedQR.active !== false 
                      ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {focusedQR.active !== false ? 'Live' : 'Paused'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {focusedQR.type} QR • Created {new Date(focusedQR.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Quick Actions for Selected QR */}
            <div className="flex items-center gap-2 shrink-0">
              {focusedQR.isDynamic && (
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    focusedQR.active !== false
                      ? 'border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                      : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {focusedQR.active !== false ? (
                    <ToggleRight className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{focusedQR.active !== false ? 'Pause QR' : 'Resume QR'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSelectQR('all')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕ Clear Selection
              </button>
            </div>
          </div>

          {/* Dynamic Link & Destination Row */}
          {focusedQR.isDynamic && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              
              {/* Short Trackable Link */}
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Dynamic Short Link
                  </span>
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 truncate block">
                    /r/{focusedQR.shortCode}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyShortLink}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Copy short link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`/r/${focusedQR.shortCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    title="Test dynamic redirect"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Destination URL */}
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Redirects To:
                  </span>
                  {isEditingDest ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="url"
                        value={newDestination}
                        onChange={(e) => setNewDestination(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs font-mono theme-input-base rounded-md border border-slate-300 dark:border-slate-700 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveDestination}
                        className="px-2 py-1 rounded bg-indigo-600 text-white font-semibold text-[11px]"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingDest(false)}
                        className="px-2 py-1 rounded text-slate-500 text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <a
                      href={focusedQR.destinationUrl || focusedQR.data?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono font-medium text-slate-800 dark:text-slate-200 hover:underline truncate block"
                    >
                      {focusedQR.destinationUrl || focusedQR.data?.url || '—'}
                    </a>
                  )}
                </div>

                {!isEditingDest && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDest(true)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                    title="Edit destination URL"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total Scans */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-1 shadow-xs border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Scans</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
            {metrics.totalScans}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {timeRange === 'all' ? 'All time' : timeRange}
            </span>
            <span>captured scans</span>
          </p>
        </div>

        {/* Card 2: Trackable Dynamic Codes */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-1 shadow-xs border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Dynamic Codes</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
            {metrics.dynamicCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Active trackable codes
          </p>
        </div>

        {/* Card 3: Unique Devices */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-1 shadow-xs border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Unique Devices</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-500/15 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
            {metrics.uniqueDevices}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Distinct visitor platforms
          </p>
        </div>

        {/* Card 4: Top Performing QR */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-1 shadow-xs border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Top Performer</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold truncate text-slate-900 dark:text-slate-100">
            {metrics.topQR ? metrics.topQR.name : 'None yet'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {metrics.topQR ? `${metrics.topQR.calculatedScans || 0} scans recorded` : 'No scans logged'}
          </p>
        </div>

      </div>

      {/* Main Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Scan Timeline Activity Bar Chart */}
        <div className="lg:col-span-2 glass-panel p-5 sm:p-6 rounded-2xl space-y-4 shadow-xs border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Scan Activity (Last 7 Days)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily volume distribution over recent days
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg">
              {metrics.totalScans} Total
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6 pb-2">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {timelineData.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-1.5 py-0.5 rounded shadow-sm mb-1 pointer-events-none">
                    {bar.count}
                  </div>
                  
                  {/* Bar Fill */}
                  <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800/60 rounded-t-lg h-full flex items-end overflow-hidden">
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        bar.count > 0 
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-300' 
                          : 'bg-transparent'
                      }`}
                      style={{ height: `${Math.max(bar.heightPct, bar.count > 0 ? 12 : 0)}%` }}
                    />
                  </div>

                  {/* Day Label */}
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-2 truncate max-w-full">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Device & OS Breakdown */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-5 shadow-xs border border-slate-200/80 dark:border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Visitor Technology
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Breakdown by devices and operating systems
            </p>
          </div>

          {/* Devices Section */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Device Types
            </span>
            {deviceBreakdown.length > 0 ? (
              deviceBreakdown.map(item => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{item.count} ({item.pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No device records yet.</p>
            )}
          </div>

          {/* Operating Systems Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Operating Systems
            </span>
            {osBreakdown.length > 0 ? (
              osBreakdown.map(item => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{item.count} ({item.pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No OS records yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* QR Code Performance Leaderboard (when 'all' is selected) */}
      {selectedQrId === 'all' && qrList.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-800/80 space-y-0">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                QR Codes Performance Ranking
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare scan performance across all your created codes
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {qrList.length} total codes
            </span>
          </div>

          {/* Mobile Card View (Zero horizontal scrollbar) */}
          <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800">
            {qrList.map(qr => (
              <div key={qr.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {qr.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Created {new Date(qr.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded uppercase font-semibold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {qr.type}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                      qr.active !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${qr.active !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {qr.active !== false ? 'Live' : 'Paused'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Total Scans:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {qr.scansCount || 0}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectQR(qr.id)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Filter & Inspect →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">QR Code Name</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Scans</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {qrList.map(qr => (
                  <tr key={qr.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">{qr.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded uppercase font-semibold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {qr.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                        qr.active !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${qr.active !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {qr.active !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(qr.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {qr.scansCount || 0}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSelectQR(qr.id)}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-xs cursor-pointer"
                      >
                        Filter & Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Scan Log Stream */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-800/80 space-y-0">
        
        {/* Stream Header & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Real-Time Scan Stream</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chronological log of verified visitor scans
            </p>
          </div>

          {/* Search bar inside scan log */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scan logs..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl theme-input-base text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Logs Table & Mobile Cards */}
        {displayLogs.length > 0 ? (
          <div>
            {/* Mobile Cards View (Zero horizontal scrollbar) */}
            <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {displayLogs.map(scan => (
                <div key={scan.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      {new Date(scan.timestamp).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      Success
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                      {scan.device || 'Mobile'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                      {scan.browser || 'Browser'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                      {scan.os || 'OS'}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] ml-auto">
                      Ref: {scan.referrer || 'Direct'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-2.5 px-4 font-semibold">Device</th>
                    <th className="py-2.5 px-4 font-semibold">Browser</th>
                    <th className="py-2.5 px-4 font-semibold">OS</th>
                    <th className="py-2.5 px-4 font-semibold">Referrer</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {displayLogs.map(scan => (
                    <tr key={scan.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap">
                        {new Date(scan.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-800 dark:text-slate-200">
                        {scan.device || 'Mobile'}
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-800 dark:text-slate-200">
                        {scan.browser || 'Browser'}
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-800 dark:text-slate-200">
                        {scan.os || 'OS'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {scan.referrer || 'Direct'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          Success
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-12 px-4 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Scan Events Found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {logSearch 
                ? `No scan logs match "${logSearch}". Try clearing your search query.` 
                : 'Share or test scanning dynamic QR codes to see live visitor events here.'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
