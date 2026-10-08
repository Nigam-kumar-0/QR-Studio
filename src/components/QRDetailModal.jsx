import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Copy, Share, Edit3, Trash2, Check, 
  ExternalLink, BarChart3, Clock, Eye, ToggleLeft, ToggleRight, 
  Sparkles, ShieldCheck, Globe
} from 'lucide-react';
import QRPreview from './QRPreview';
import { 
  updateDynamicDestination, 
  toggleQRCodeStatus, 
  deleteQRCode, 
  getQRScanEvents 
} from '../services/storageService';
import { exportAsPNG, exportAsPDF, exportAsSVG, copyQRImageToClipboard } from '../utils/qrExport';
import { useAuth } from '../context/AuthContext';

export default function QRDetailModal({ qrCode, isOpen, onClose, onEdit, onRefresh }) {
  const { user } = useAuth();
  const previewRef = useRef(null);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'analytics'
  const [isEditingDest, setIsEditingDest] = useState(false);
  const [newDestination, setNewDestination] = useState(qrCode?.destinationUrl || '');
  const [activeStatus, setActiveStatus] = useState(qrCode?.active !== false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [scanEvents, setScanEvents] = useState([]);

  useEffect(() => {
    if (qrCode) {
      setNewDestination(qrCode.destinationUrl || qrCode.data?.url || '');
      setActiveStatus(qrCode.active !== false);
      
      // Load real scan logs for this QR code
      getQRScanEvents(qrCode.id).then(logs => {
        setScanEvents(logs);
      });
    }
  }, [qrCode]);

  if (!isOpen || !qrCode) return null;

  const handleSaveDestination = async () => {
    if (!newDestination.trim()) return;
    await updateDynamicDestination(qrCode.id, newDestination.trim(), user);
    setIsEditingDest(false);
    if (onRefresh) onRefresh();
  };

  const handleToggleStatus = async () => {
    const next = !activeStatus;
    setActiveStatus(next);
    await toggleQRCodeStatus(qrCode.id, next, user);
    if (onRefresh) onRefresh();
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${qrCode.name}"?`)) {
      await deleteQRCode(qrCode.id, user);
      onClose();
      if (onRefresh) onRefresh();
    }
  };

  const copyShortLink = () => {
    const link = `${window.location.origin}/r/${qrCode.shortCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Device stats aggregation from real scan records
  const deviceCounts = scanEvents.reduce((acc, curr) => {
    acc[curr.device] = (acc[curr.device] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${activeStatus ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{qrCode.name}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                {qrCode.type} • {qrCode.isDynamic ? 'Dynamic QR' : 'Static QR'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex px-6 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Overview & Design
          </button>
          {qrCode.isDynamic && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Real Scan Analytics</span>
              <span className="text-[10px] px-1.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono">
                {qrCode.scansCount || scanEvents.length}
              </span>
            </button>
          )}
        </div>


        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* QR Preview Column */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <QRPreview
                  ref={previewRef}
                  content={qrCode.encodedContent}
                  config={qrCode.config}
                  size={200}
                  showReliability={false}
                />

                {/* Quick Export Buttons */}
                <div className="grid grid-cols-3 gap-2 w-full mt-4">
                  <button
                    onClick={() => exportAsPNG(previewRef.current?.getInstance(), qrCode.name, 1024)}
                    className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 text-center transition-colors cursor-pointer"
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => exportAsSVG(previewRef.current?.getInstance(), qrCode.name)}
                    className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 text-center transition-colors cursor-pointer"
                  >
                    SVG
                  </button>
                  <button
                    onClick={() => exportAsPDF(previewRef.current?.getInstance(), qrCode.name, qrCode.destinationUrl)}
                    className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 text-center transition-colors cursor-pointer"
                  >
                    PDF
                  </button>
                </div>
              </div>

              {/* Details & Controls Column */}
              <div className="space-y-4">
                
                {/* Dynamic Destination Management */}
                {qrCode.isDynamic ? (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Target Destination</span>
                      <button
                        onClick={() => setIsEditingDest(!isEditingDest)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditingDest ? 'Cancel' : 'Edit'}</span>
                      </button>
                    </div>

                    {isEditingDest ? (
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={newDestination}
                          onChange={(e) => setNewDestination(e.target.value)}
                          className="w-full glass-input px-3 py-1.5 rounded-xl text-xs"
                        />
                        <button
                          onClick={handleSaveDestination}
                          className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
                        >
                          Update Destination
                        </button>
                      </div>
                    ) : (
                      <a
                        href={qrCode.destinationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:underline flex items-center gap-1.5 break-all font-mono"
                      >
                        <span>{qrCode.destinationUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}

                    {/* Short Link */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Short Link:</span>
                      <button
                        onClick={copyShortLink}
                        className="flex items-center gap-1 font-mono text-[11px] text-slate-300 hover:text-white bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>/r/{qrCode.shortCode}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-slate-300">Encoded Content</span>
                    <p className="text-xs font-mono text-slate-400 break-all pt-1">
                      {qrCode.encodedContent}
                    </p>
                  </div>
                )}

                {/* Status Toggle & Dates */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">QR Code Status</span>
                    <button
                      onClick={handleToggleStatus}
                      className={`flex items-center gap-1 font-semibold cursor-pointer ${
                        activeStatus ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {activeStatus ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      <span>{activeStatus ? 'Active' : 'Disabled'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Created:</span>
                    <span className="font-mono text-slate-300">{new Date(qrCode.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Last Updated:</span>
                    <span className="font-mono text-slate-300">{new Date(qrCode.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Edit & Delete Primary Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(qrCode);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Open in Generator</span>
                  </button>

                  <button
                    onClick={handleDelete}
                    className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/20 transition-colors cursor-pointer"
                    title="Delete QR"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Analytics Tab */
            <div className="space-y-6 animate-fadeIn">
              
              {/* Scan Total KPI */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block font-medium">Total Scans</span>
                  <span className="text-2xl font-bold font-mono text-indigo-400 mt-1 block">
                    {qrCode.scansCount || 0}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block font-medium">Unique Devices</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                    {Object.keys(deviceCounts).length || 1}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block font-medium">State</span>
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-200 mt-2 block">
                    {activeStatus ? 'Live' : 'Paused'}
                  </span>
                </div>
              </div>

              {/* Device Category Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Device Breakdown</h4>
                {Object.keys(deviceCounts).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(deviceCounts).map(([device, count]) => {
                      const total = scanEvents.length || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={device} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-300">
                            <span>{device}</span>
                            <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">No device logs recorded yet.</p>
                )}
              </div>

              {/* Real Recorded Scan Events Table */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recent Scan Log</h4>
                {scanEvents.length > 0 ? (
                  <div className="overflow-x-auto max-h-48">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-2 font-medium">Timestamp</th>
                          <th className="pb-2 font-medium">Device</th>
                          <th className="pb-2 font-medium">Browser</th>
                          <th className="pb-2 font-medium">OS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {scanEvents.map(event => (
                          <tr key={event.id} className="text-slate-300">
                            <td className="py-2 text-[11px]">{new Date(event.timestamp).toLocaleString()}</td>
                            <td className="py-2 text-[11px]">{event.device}</td>
                            <td className="py-2 text-[11px]">{event.browser}</td>
                            <td className="py-2 text-[11px]">{event.os}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No scans recorded yet. Share or test scanning the QR code to see live events.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
