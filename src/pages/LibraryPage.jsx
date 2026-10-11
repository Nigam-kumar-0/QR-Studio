import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getUserQRCodes, 
  toggleQRCodeFavorite, 
  deleteQRCode, 
  saveQRCode 
} from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import QRPreview from '../components/QRPreview';
import { 
  exportAsPNG, 
  exportAsSVG, 
  exportAsPDF, 
  copyQRImageToClipboard 
} from '../utils/qrExport';
import { 
  Search, Filter, Star, MoreVertical, LayoutGrid, List, 
  PlusCircle, Trash2, Edit3, ExternalLink, Copy, Check, 
  Zap, ArrowUpDown, QrCode, X, BarChart3, Download, Share2, Eye, Sparkles,
  Globe, Wifi, UserCheck, CreditCard, MessageCircle, Mail, Phone, MessageSquare, MapPin, Calendar, Lock, AlertCircle, Save
} from 'lucide-react';
import { 
  encodeQRContent, 
  getDynamicTarget, 
  getStep1ValidationError 
} from '../utils/qrTypes';

export default function LibraryPage({ onEditQR, onNavigateCreate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrList, setQrList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'dynamic' | 'static' | 'favorites'
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'created' | 'scans' | 'name'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  
  const [copiedId, setCopiedId] = useState(null);
  const [selectedQRForModal, setSelectedQRForModal] = useState(null);
  const modalPreviewRef = useRef(null);
  const [modalCopiedImage, setModalCopiedImage] = useState(false);
  const [modalCopiedLink, setModalCopiedLink] = useState(false);

  // Quick Edit QR Data Modal State (Data-Only Edit)
  const [editingDataQR, setEditingDataQR] = useState(null);
  const [editDataForm, setEditDataForm] = useState({});
  const [editName, setEditName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  const loadQRs = async () => {
    setLoading(true);
    const codes = await getUserQRCodes(user?.uid);
    setQrList(codes);
    setLoading(false);
  };

  useEffect(() => {
    loadQRs();
  }, [user]);

  const handleFavoriteToggle = async (e, qrId) => {
    e.stopPropagation();
    await toggleQRCodeFavorite(qrId);
    loadQRs();
  };

  const handleDelete = async (e, qr) => {
    e.stopPropagation();
    if (confirm(`Delete "${qr.name}"?`)) {
      await deleteQRCode(qr.id, user);
      loadQRs();
    }
  };

  const handleDuplicate = async (e, qr) => {
    e.stopPropagation();
    const copy = {
      ...qr,
      id: undefined,
      name: `${qr.name} (Copy)`,
      shortCode: qr.isDynamic ? Math.random().toString(36).substring(2, 7) : null,
      scansCount: 0,
    };
    await saveQRCode(copy, user);
    loadQRs();
  };

  const handleCopyLink = (e, qr) => {
    e.stopPropagation();
    const link = qr.isDynamic 
      ? `${window.location.origin}/r/${qr.shortCode}`
      : qr.encodedContent;
    navigator.clipboard.writeText(link);
    setCopiedId(qr.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAnalytics = (e, qr) => {
    if (e) e.stopPropagation();
    navigate(`/analytics?id=${qr.id}`);
  };

  // Export handlers for the modal
  const handleDownloadPNG = async (qr) => {
    if (modalPreviewRef.current) {
      await exportAsPNG(modalPreviewRef.current, qr.name, 1024, qr.config);
    }
  };

  const handleDownloadSVG = async (qr) => {
    if (modalPreviewRef.current) {
      await exportAsSVG(modalPreviewRef.current, qr.name, qr.config);
    }
  };

  const handleDownloadPDF = async (qr) => {
    if (modalPreviewRef.current) {
      const details = qr.isDynamic ? `${window.location.origin}/r/${qr.shortCode}` : (qr.destinationUrl || qr.encodedContent);
      await exportAsPDF(modalPreviewRef.current, qr.name, details, qr.config);
    }
  };

  const handleCopyModalImage = async (qr) => {
    if (modalPreviewRef.current) {
      const ok = await copyQRImageToClipboard(modalPreviewRef.current, qr?.config || selectedQR?.config);
      if (ok) {
        setModalCopiedImage(true);
        setTimeout(() => setModalCopiedImage(false), 2000);
      }
    }
  };

  const handleShareNative = async (qr) => {
    const link = qr.isDynamic ? `${window.location.origin}/r/${qr.shortCode}` : (qr.destinationUrl || qr.encodedContent);
    if (navigator.share) {
      try {
        await navigator.share({
          title: qr.name,
          text: `Scan QR code for ${qr.name}`,
          url: link,
        });
      } catch (err) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(link);
      setModalCopiedLink(true);
      setTimeout(() => setModalCopiedLink(false), 2000);
    }
  };

  // Quick Edit QR Data handlers (Updates data only, preserves visual design)
  const handleOpenEditData = (e, qr) => {
    e.stopPropagation();
    setEditingDataQR(qr);
    setEditName(qr.name || '');
    const initialData = qr.data ? { ...qr.data } : {};
    if (qr.type === 'url' && !initialData.url && (qr.destinationUrl || qr.encodedContent)) {
      initialData.url = qr.destinationUrl || qr.encodedContent;
    }
    setEditDataForm(initialData);
    setEditError(null);
    setEditSuccessMsg('');
  };

  const handleEditFieldChange = (field, val) => {
    if (editError) setEditError(null);
    setEditDataForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveEditedData = async () => {
    if (!editingDataQR) return;
    setEditError(null);

    const validationError = getStep1ValidationError(editingDataQR.type, editDataForm);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setEditSaving(true);
    try {
      const isDynamic = Boolean(editingDataQR.isDynamic);
      const dynamicTarget = isDynamic ? getDynamicTarget(editingDataQR.type, editDataForm) : '';
      const staticPayload = encodeQRContent(editingDataQR.type, editDataForm);
      const finalEncoded = isDynamic ? (editingDataQR.encodedContent || `${window.location.origin}/r/${editingDataQR.shortCode}`) : staticPayload;

      const updatedRecord = {
        ...editingDataQR,
        name: editName.trim() || editingDataQR.name || 'My QR Code',
        data: editDataForm,
        encodedContent: finalEncoded,
        destinationUrl: isDynamic ? dynamicTarget : (editingDataQR.destinationUrl || ''),
        // Explicitly maintain existing config (frames, colors, dots, corners) 100% untouched
        config: editingDataQR.config,
      };

      await saveQRCode(updatedRecord, user);
      setEditSuccessMsg('QR Code data successfully updated!');
      await loadQRs();
      setTimeout(() => {
        setEditingDataQR(null);
        setEditSuccessMsg('');
      }, 700);
    } catch (err) {
      console.error('Failed to save QR data:', err);
      setEditError('Failed to save changes. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  // Filter and sort computation
  const filteredQRs = qrList
    .filter(qr => {
      // Search
      const matchesSearch = 
        qr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (qr.destinationUrl || qr.encodedContent || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Mode filter
      if (filterMode === 'dynamic' && !qr.isDynamic) return false;
      if (filterMode === 'static' && qr.isDynamic) return false;
      if (filterMode === 'favorites' && !qr.favorite) return false;

      // Type filter
      if (selectedTypeFilter !== 'all' && qr.type !== selectedTypeFilter) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'updated') return new Date(b.updatedAt) - new Date(a.updatedAt);
      if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'scans') return (b.scansCount || 0) - (a.scansCount || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 theme-bg-page transition-colors duration-200">
      
      {/* Top Header Row — Standard SPA Alignment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            QR Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your generated codes, copy links, or inspect scan metrics.
          </p>
        </div>

        {/* Action Buttons: View Analytics & Create New QR */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            to="/analytics"
            className="h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            title="Open Analytics Dashboard"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Analytics</span>
          </Link>

          {onNavigateCreate && (
            <button
              onClick={onNavigateCreate}
              type="button"
              className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New QR</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="glass-panel p-5 rounded-3xl h-48 animate-pulse bg-slate-100 dark:bg-slate-900/40" />
          ))}
        </div>
      ) : qrList.length === 0 ? (
        /* Empty State when NO QR codes exist at all: Do NOT show search bar */
        <div className="glass-panel p-10 sm:p-14 rounded-3xl text-center flex flex-col items-center justify-center max-w-md mx-auto my-12 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
            <QrCode className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Your Library is Empty
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              You haven't generated any QR codes yet. Create a QR code to save, customize, and track it here.
            </p>
          </div>
          <button
            onClick={onNavigateCreate}
            type="button"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate First QR Code</span>
          </button>
        </div>
      ) : (
        /* Controls & Filter Bar — Shown ONLY when user has QR codes in library */
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-3xl space-y-3 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, destination, content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl theme-input-base text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View & Sort Controls */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-medium theme-input-base text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="updated">Recently Updated</option>
                  <option value="created">Recently Created</option>
                  <option value="scans">Most Scanned</option>
                  <option value="name">Alphabetical (A-Z)</option>
                </select>

                {/* Grid / List toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'grid' 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list' 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
              <span className="text-slate-400 font-medium text-[11px] mr-1 hidden sm:inline">Filter:</span>
              {[
                { id: 'all', label: 'All Codes' },
                { id: 'dynamic', label: 'Dynamic (Trackable)' },
                { id: 'static', label: 'Static' },
                { id: 'favorites', label: 'Starred' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterMode(f.id)}
                  className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    filterMode === f.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>Showing <strong className="text-slate-800 dark:text-slate-200">{filteredQRs.length}</strong> of {qrList.length} codes</span>
          </div>

          {/* QR Cards Display */}
          {filteredQRs.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No QR codes match your filters</p>
              <button
                onClick={() => { setSearchQuery(''); setFilterMode('all'); setSelectedTypeFilter('all'); }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredQRs.map(qr => (
                <div
                  key={qr.id}
                  className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all hover:shadow-lg flex flex-col justify-between space-y-4 group"
                >
                  {/* Card Top: Name, Type & Favorite Star */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {qr.name}
                      </h3>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        {qr.type} format
                      </span>
                    </div>

                    {/* Favorite Star */}
                    <button
                      type="button"
                      onClick={(e) => handleFavoriteToggle(e, qr.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                        qr.favorite 
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' 
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                      title={qr.favorite ? 'Unstar' : 'Star'}
                    >
                      <Star className={`w-4 h-4 ${qr.favorite ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>

                  {/* Actual QR Visual Preview Canvas */}
                  <div 
                    onClick={() => setSelectedQRForModal(qr)}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-inner min-h-[175px] cursor-pointer group/preview relative overflow-hidden transition-all hover:scale-[1.01]"
                    style={{
                      backgroundColor: qr.config?.bgColor === '#ffffff' 
                        ? '#f8fafc' 
                        : (qr.config?.bgColor === '#090d16' || qr.config?.bgColor === '#022c22' || qr.config?.bgColor === '#0f172a' || qr.config?.bgColor === '#1e1b4b' || qr.config?.bgColor === '#0a0a14')
                        ? '#030712'
                        : (qr.config?.bgColor || '#ffffff')
                    }}
                    title="Click to view, download, or share"
                  >
                    <QRPreview
                      content={qr.encodedContent}
                      config={qr.config || {}}
                      size={135}
                      showReliability={false}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <span className="text-[11px] font-bold text-white bg-black/75 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Save & Share</span>
                      </span>
                    </div>
                  </div>

                  {/* Destination preview */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 truncate">
                    {qr.destinationUrl || qr.encodedContent}
                  </div>

                  {/* Card Bottom Meta & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      {qr.isDynamic ? (
                        <span className="badge-pill gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                          <Zap className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>{qr.scansCount || 0} scans</span>
                        </span>
                      ) : (
                        <span className="badge-pill text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                          Static
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Save & Share Modal trigger */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedQRForModal(qr); }}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                        title="Download & Share"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* View Dedicated Analytics */}
                      <button
                        onClick={(e) => handleOpenAnalytics(e, qr)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                        title="View Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>

                      {/* Copy Link */}
                      <button
                        onClick={(e) => handleCopyLink(e, qr)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Copy Link"
                      >
                        {copiedId === qr.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>

                      {/* Edit QR Data Only */}
                      <button
                        onClick={(e) => handleOpenEditData(e, qr)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                        title="Edit QR Data (Keep Design)"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => handleDelete(e, qr)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="glass-panel rounded-3xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800/80 shadow-sm">
              {filteredQRs.map(qr => (
                <div
                  key={qr.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors gap-4 group"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => handleFavoriteToggle(e, qr.id)}
                      className={`p-1 rounded transition-colors ${
                        qr.favorite ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${qr.favorite ? 'fill-amber-500' : ''}`} />
                    </button>

                    {/* Mini QR Design Thumbnail */}
                    <div 
                      onClick={() => setSelectedQRForModal(qr)}
                      className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-xs cursor-pointer hover:border-indigo-500 transition-colors"
                      style={{
                        backgroundColor: qr.config?.bgColor === '#ffffff' ? '#f8fafc' : (qr.config?.bgColor || '#ffffff')
                      }}
                      title="Click to view full design"
                    >
                      <QRPreview content={qr.encodedContent} config={qr.config || {}} size={40} showReliability={false} />
                    </div>

                    <div className="min-w-0">
                      <h4 
                        onClick={() => setSelectedQRForModal(qr)}
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        {qr.name}
                      </h4>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                        {qr.destinationUrl || qr.encodedContent}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {qr.type}
                    </span>
                    
                    {qr.isDynamic && (
                      <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 hidden sm:inline">
                        {qr.scansCount || 0} scans
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      {/* Save & Share Modal trigger */}
                      <button
                        onClick={() => setSelectedQRForModal(qr)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                        title="Download & Share"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleOpenAnalytics(e, qr)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                        title="View Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleCopyLink(e, qr)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Copy Link"
                      >
                        {copiedId === qr.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      
                      {/* Edit QR Data Only */}
                      <button
                        onClick={(e) => handleOpenEditData(e, qr)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                        title="Edit QR Data (Keep Design)"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(e, qr)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dedicated Save & Share Modal */}
          {selectedQRForModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto">
                {/* Modal Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedQRForModal(null)}
                  className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="space-y-1 pr-8">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                      {selectedQRForModal.type}
                    </span>
                    {selectedQRForModal.isDynamic && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                        Live Tracking
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                    {selectedQRForModal.name}
                  </h2>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                    {selectedQRForModal.destinationUrl || selectedQRForModal.encodedContent}
                  </p>
                </div>

                {/* High Resolution Live Preview */}
                <div 
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-inner"
                  style={{
                    backgroundColor: selectedQRForModal.config?.bgColor === '#ffffff' 
                      ? '#f8fafc' 
                      : (selectedQRForModal.config?.bgColor === '#090d16' || selectedQRForModal.config?.bgColor === '#022c22' || selectedQRForModal.config?.bgColor === '#0f172a' || selectedQRForModal.config?.bgColor === '#1e1b4b' || selectedQRForModal.config?.bgColor === '#0a0a14')
                      ? '#030712'
                      : (selectedQRForModal.config?.bgColor || '#ffffff')
                  }}
                >
                  <QRPreview
                    ref={modalPreviewRef}
                    content={selectedQRForModal.encodedContent}
                    config={selectedQRForModal.config || {}}
                    size={220}
                    showReliability={false}
                  />
                </div>

                {/* Download Formats Grid */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Save to Device
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadPNG(selectedQRForModal)}
                      className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PNG</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadSVG(selectedQRForModal)}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>SVG</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(selectedQRForModal)}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {/* Share & Copy Actions */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Share & Copy
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyModalImage}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {modalCopiedImage ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{modalCopiedImage ? 'Image Copied!' : 'Copy Image'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareNative(selectedQRForModal)}
                      className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {modalCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{modalCopiedLink ? 'Link Copied!' : 'Share / Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Analytics & Close */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedQRForModal.id;
                      setSelectedQRForModal(null);
                      navigate(`/analytics?id=${id}`);
                    }}
                    className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <span>View Analytics</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedQRForModal(null)}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Edit QR Data Modal (Data-Only Edit — Preserves Design) */}
          {editingDataQR && (
            <div 
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
              onClick={() => setEditingDataQR(null)}
            >
              <div 
                className="glass-panel w-full max-w-xl rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative my-auto bg-white/95 dark:bg-slate-900/95"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setEditingDataQR(null)}
                  className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="space-y-1.5 pr-8">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                      {editingDataQR.type}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Design & Colors Preserved
                    </span>
                    {editingDataQR.isDynamic && (
                      <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-500/20 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        Dynamic Redirect
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Edit QR Code Data
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update content and target destination. Frames, colors, dots, and corners remain 100% untouched.
                  </p>
                </div>

                {/* Feedback Alerts */}
                {editError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                {editSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{editSuccessMsg}</span>
                  </div>
                )}

                {/* Form Inputs Container */}
                <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      QR Code Label / Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="My QR Code"
                      className="w-full glass-input h-10 px-3 rounded-xl text-xs sm:text-sm font-medium"
                    />
                  </div>

                  {renderTypeDataInputs(editingDataQR.type, editDataForm, handleEditFieldChange)}
                </div>

                {/* Dynamic notice if applicable */}
                {editingDataQR.isDynamic && (
                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 text-[11px] text-indigo-800 dark:text-indigo-300 space-y-0.5">
                    <div className="font-semibold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Existing Printed Codes Keep Working</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Short link <code className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded">/r/{editingDataQR.shortCode}</code> is retained. Scanning your QR code immediately opens this newly updated data without reprinting.
                    </p>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 dark:border-slate-800/80">
                  {onEditQR ? (
                    <button
                      type="button"
                      onClick={() => {
                        const qr = editingDataQR;
                        setEditingDataQR(null);
                        onEditQR(qr);
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Need to edit frame or colors? Open Studio &rarr;</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingDataQR(null)}
                      className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={editSaving}
                      onClick={handleSaveEditedData}
                      className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
                    >
                      {editSaving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save QR Data</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

// Helper to render type-specific data input fields for Quick Edit
function renderTypeDataInputs(type, form, onChange) {
  switch (type) {
    case 'url':
      return (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Website URL *
          </label>
          <div className="flex items-center h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
            <span className="px-2.5 text-xs font-semibold text-slate-400 select-none">https://</span>
            <input
              type="text"
              value={(form.url || '').replace(/^https?:\/\//i, '')}
              onChange={e => {
                const val = e.target.value.replace(/^https?:\/\//i, '');
                onChange('url', val.trim() ? 'https://' + val : '');
              }}
              placeholder="yourwebsite.com/page"
              className="flex-1 h-full bg-transparent text-xs sm:text-sm font-medium outline-none text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Plain Text *
          </label>
          <textarea
            rows={4}
            value={form.text || ''}
            onChange={e => onChange('text', e.target.value)}
            placeholder="Enter raw text or notes..."
            className="w-full glass-input p-3 rounded-xl text-xs sm:text-sm resize-none"
          />
        </div>
      );

    case 'wifi':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Network Name (SSID) *</label>
            <input
              type="text"
              value={form.ssid || ''}
              onChange={e => onChange('ssid', e.target.value)}
              placeholder="Home_WiFi"
              className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
            <input
              type="text"
              value={form.password || ''}
              onChange={e => onChange('password', e.target.value)}
              placeholder="WiFi Password"
              className="w-full glass-input h-10 px-3 rounded-xl text-xs font-mono"
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Security Type</label>
            <select
              value={form.encryption || 'WPA'}
              onChange={e => onChange('encryption', e.target.value)}
              className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium cursor-pointer"
            >
              <option value="WPA">WPA/WPA2/WPA3 (Standard)</option>
              <option value="WEP">WEP (Legacy)</option>
              <option value="nopass">Open (No Password)</option>
            </select>
          </div>
        </div>
      );

    case 'upi':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              UPI ID / VPA *
            </label>
            <input
              type="text"
              value={form.pa || ''}
              onChange={e => onChange('pa', e.target.value)}
              placeholder="merchant@okhdfcbank"
              className="w-full glass-input h-10 px-3 rounded-xl text-xs sm:text-sm font-medium font-mono"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payee Name</label>
              <input
                type="text"
                value={form.pn || ''}
                onChange={e => onChange('pn', e.target.value)}
                placeholder="Merchant or Store Name"
                className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Requested Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={form.am || ''}
                onChange={e => onChange('am', e.target.value)}
                placeholder="Optional preset amount"
                className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Transaction Note</label>
            <input
              type="text"
              value={form.tn || ''}
              onChange={e => onChange('tn', e.target.value)}
              placeholder="e.g. Order #1042"
              className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
            />
          </div>
        </div>
      );

    case 'vcard':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">First Name</label>
              <input
                type="text"
                value={form.firstName || ''}
                onChange={e => onChange('firstName', e.target.value)}
                placeholder="John"
                className="w-full glass-input h-10 px-3 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Name</label>
              <input
                type="text"
                value={form.lastName || ''}
                onChange={e => onChange('lastName', e.target.value)}
                placeholder="Doe"
                className="w-full glass-input h-10 px-3 rounded-xl text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone</label>
              <input
                type="tel"
                value={form.phone || ''}
                onChange={e => onChange('phone', e.target.value)}
                placeholder="+1 555 123 4567"
                className="w-full glass-input h-10 px-3 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={e => onChange('email', e.target.value)}
                placeholder="john@company.com"
                className="w-full glass-input h-10 px-3 rounded-xl text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Organization</label>
              <input
                type="text"
                value={form.organization || ''}
                onChange={e => onChange('organization', e.target.value)}
                placeholder="Acme Corp"
                className="w-full glass-input h-10 px-3 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Title</label>
              <input
                type="text"
                value={form.title || ''}
                onChange={e => onChange('title', e.target.value)}
                placeholder="Product Director"
                className="w-full glass-input h-10 px-3 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>
      );

    case 'whatsapp':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number (with Country Code) *</label>
            <input
              type="tel"
              value={form.phone || ''}
              onChange={e => onChange('phone', e.target.value)}
              placeholder="+919876543210"
              className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pre-filled Message</label>
            <textarea
              rows={3}
              value={form.message || ''}
              onChange={e => onChange('message', e.target.value)}
              placeholder="Hi, I would like to inquire about..."
              className="w-full glass-input p-3 rounded-xl text-xs resize-none"
            />
          </div>
        </div>
      );

    case 'email':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Recipient Email *</label>
            <input
              type="email"
              value={form.email || ''}
              onChange={e => onChange('email', e.target.value)}
              placeholder="support@company.com"
              className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject</label>
            <input
              type="text"
              value={form.subject || ''}
              onChange={e => onChange('subject', e.target.value)}
              placeholder="Customer Inquiry"
              className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Body</label>
            <textarea
              rows={3}
              value={form.body || ''}
              onChange={e => onChange('body', e.target.value)}
              placeholder="Type message body..."
              className="w-full glass-input p-3 rounded-xl text-xs resize-none"
            />
          </div>
        </div>
      );

    case 'phone':
      return (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
          <input
            type="tel"
            value={form.phone || ''}
            onChange={e => onChange('phone', e.target.value)}
            placeholder="+1 800 555 0199"
            className="w-full glass-input h-10 px-3 rounded-xl text-xs sm:text-sm font-medium"
          />
        </div>
      );

    case 'sms':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
            <input
              type="tel"
              value={form.phone || ''}
              onChange={e => onChange('phone', e.target.value)}
              placeholder="+1 800 555 0199"
              className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Message</label>
            <textarea
              rows={3}
              value={form.message || ''}
              onChange={e => onChange('message', e.target.value)}
              placeholder="Type SMS text..."
              className="w-full glass-input p-3 rounded-xl text-xs resize-none"
            />
          </div>
        </div>
      );

    case 'social':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Platform</label>
            <select
              value={form.platform || 'instagram'}
              onChange={e => onChange('platform', e.target.value)}
              className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium cursor-pointer"
            >
              <option value="instagram">Instagram (@handle)</option>
              <option value="twitter">X / Twitter (@handle)</option>
              <option value="linkedin">LinkedIn (/in/handle)</option>
              <option value="youtube">YouTube (@handle)</option>
              <option value="github">GitHub (/username)</option>
              <option value="tiktok">TikTok (@handle)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Username / Handle *</label>
            <input
              type="text"
              value={form.username || ''}
              onChange={e => onChange('username', e.target.value)}
              placeholder="myhandle"
              className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
            />
          </div>
        </div>
      );

    case 'event':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Event Title *</label>
            <input
              type="text"
              value={form.title || ''}
              onChange={e => onChange('title', e.target.value)}
              placeholder="Product Launch 2026"
              className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location</label>
            <input
              type="text"
              value={form.location || ''}
              onChange={e => onChange('location', e.target.value)}
              placeholder="Convention Center Hall A"
              className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Time</label>
              <input
                type="datetime-local"
                value={form.startDate || ''}
                onChange={e => onChange('startDate', e.target.value)}
                className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Time</label>
              <input
                type="datetime-local"
                value={form.endDate || ''}
                onChange={e => onChange('endDate', e.target.value)}
                className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        </div>
      );

    case 'location':
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location Query / Address *</label>
            <input
              type="text"
              value={form.query || ''}
              onChange={e => onChange('query', e.target.value)}
              placeholder="Times Square, New York"
              className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Latitude (optional)</label>
              <input
                type="text"
                value={form.latitude || ''}
                onChange={e => onChange('latitude', e.target.value)}
                placeholder="40.7580"
                className="w-full glass-input h-10 px-3 rounded-xl text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Longitude (optional)</label>
              <input
                type="text"
                value={form.longitude || ''}
                onChange={e => onChange('longitude', e.target.value)}
                placeholder="-73.9855"
                className="w-full glass-input h-10 px-3 rounded-xl text-xs font-mono"
              />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
