import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  getScanHistory, 
  deleteScanHistoryItem, 
  clearScanHistory 
} from '../services/storageService';
import { 
  History, Copy, Check, ExternalLink, Trash2, PlusCircle, 
  Scan, Clock
} from 'lucide-react';

export default function HistoryPage({ onOpenScanner, onUseScannedData }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const loadHistory = () => {
    setHistory(getScanHistory());
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteItem = (id) => {
    deleteScanHistoryItem(id);
    loadHistory();
  };

  const handleClearAll = () => {
    if (confirm('Clear entire scan history?')) {
      clearScanHistory();
      loadHistory();
    }
  };

  const handleScanAction = () => {
    if (onOpenScanner) {
      onOpenScanner();
    } else {
      navigate('/scanner');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 theme-bg-page transition-colors duration-200">
      
      {/* Top Header Row — Standard SPA Alignment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Scan History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Past QR codes captured on this device ({history.length} scans logged)
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              type="button"
              className="h-10 px-3.5 rounded-xl border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              Clear History
            </button>
          )}

          <button
            onClick={handleScanAction}
            type="button"
            className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <Scan className="w-4 h-4" />
            <span>Scan QR Now</span>
          </button>
        </div>
      </div>

      {/* History Items List */}
      {history.length === 0 ? (
        <div className="glass-panel p-10 sm:p-14 rounded-3xl text-center flex flex-col items-center justify-center max-w-md mx-auto my-12 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
            <History className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No Scan History Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              QR codes you scan with your camera or upload will be stored here automatically.
            </p>
          </div>
          <button
            onClick={handleScanAction}
            className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            <span>Open Scanner</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(item => (
            <div 
              key={item.id}
              className="glass-panel p-4.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 hover:border-indigo-400/50 dark:hover:border-slate-700 transition-all shadow-sm"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                    {item.type || 'Text'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <p className="text-xs font-mono text-slate-900 dark:text-slate-100 break-all select-all line-clamp-2">
                  {item.content}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                {item.type === 'url' && (
                  <a
                    href={item.content}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                    title="Open Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={() => handleCopy(item.id, item.content)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
                  title="Copy Content"
                >
                  {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>

                {onUseScannedData && (
                  <button
                    onClick={() => onUseScannedData(item)}
                    className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 transition-colors cursor-pointer shadow-xs"
                    title="Create QR from this"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
