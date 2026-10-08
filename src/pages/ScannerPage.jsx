import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, Upload, Copy, Check, ExternalLink, 
  RotateCw, AlertCircle, CheckCircle2, History, 
  PlusCircle, StopCircle, ArrowRight, Sparkles,
  QrCode, FileText, Globe, Wifi, UserCheck
} from 'lucide-react';
import { addScanHistoryItem, getScanHistory } from '../services/storageService';

export default function ScannerPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'file'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [recentScans, setRecentScans] = useState([]);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadRecentScans = () => {
    const list = getScanHistory();
    setRecentScans(list.slice(0, 3));
  };

  useEffect(() => {
    loadRecentScans();
    return () => {
      stopCamera();
    };
  }, []);

  const detectType = (str) => {
    if (/^https?:\/\//i.test(str)) return 'url';
    if (/^WIFI:/i.test(str)) return 'wifi';
    if (/^tel:/i.test(str)) return 'phone';
    if (/^mailto:/i.test(str)) return 'email';
    if (/^BEGIN:VCARD/i.test(str)) return 'vcard';
    return 'text';
  };

  const handleScanSuccess = (text) => {
    const parsedType = detectType(text);
    const resultObj = {
      content: text,
      type: parsedType,
      timestamp: new Date().toISOString(),
    };
    setScanResult(resultObj);
    addScanHistoryItem(resultObj);
    loadRecentScans();
    stopCamera();
  };

  const startCamera = async () => {
    setErrorMsg('');
    const scannerId = 'page-qr-scanner-viewport';

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setErrorMsg('No camera hardware found on this device.');
        return;
      }

      setCameras(devices);
      const backCamera = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0];
      setCurrentCameraId(backCamera.id);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId);
      }

      await scannerRef.current.start(
        backCamera.id,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Ignore routine unmatched frames
        }
      );

      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera startup failed:', err);
      setErrorMsg('Camera access was denied or could not be opened. Please grant permission in your browser or upload an image file.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      setIsCameraActive(false);
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current) return;
    const currentIndex = cameras.findIndex(c => c.id === currentCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    setCurrentCameraId(nextCamera.id);

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.start(
        nextCamera.id,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.warn('Failed to switch camera:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    try {
      const html5Qr = new Html5Qrcode('page-qr-file-temp');
      const decodedText = await html5Qr.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err) {
      console.error('File scan error:', err);
      setErrorMsg('No readable QR code found in this image. Please upload a clear photo of a QR code.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const copyToClipboard = () => {
    if (!scanResult) return;
    navigator.clipboard.writeText(scanResult.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForNextScan = () => {
    setScanResult(null);
    setErrorMsg('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 theme-bg-page transition-colors duration-200">
      
      {/* Hidden file scanning DOM node required by html5-qrcode */}
      <div id="page-qr-file-temp" className="hidden" />

      {/* Top Header Row — Standard SPA Alignment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            QR Code Scanner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Scan any QR code using your device camera or upload an image file
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/history"
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Scan History</span>
          </Link>

          <Link
            to="/"
            className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create QR</span>
          </Link>
        </div>
      </div>

      {/* Main Scanner Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('camera');
                setErrorMsg('');
              }}
              className={`h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Scan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('file');
                setErrorMsg('');
              }}
              className={`h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>
          </div>

          {activeTab === 'camera' && isCameraActive && (
            <div className="flex items-center gap-2">
              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={switchCamera}
                  className="h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span className="hidden sm:inline">Flip Camera</span>
                </button>
              )}

              <button
                type="button"
                onClick={stopCamera}
                className="h-8 px-3 rounded-lg border border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1">
              <p className="font-medium">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Active Scan Result Card */}
        {scanResult ? (
          <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    QR Code Detected Successfully
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Saved to your local scan history
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400 bg-white/80 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                {scanResult.type}
              </span>
            </div>

            {/* Decoded content display */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
              {scanResult.content}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={copyToClipboard}
                className="h-9 px-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Content'}</span>
              </button>

              {scanResult.type === 'url' && (
                <a
                  href={scanResult.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open URL</span>
                </a>
              )}

              <button
                type="button"
                onClick={resetForNextScan}
                className="h-9 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 ml-auto cursor-pointer"
              >
                <span>Scan Another Code</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Tab 1: Camera Scanner Mode */}
            {activeTab === 'camera' && (
              <div className="space-y-4">
                
                {/* State: Camera is OFF (Default - doesn't auto open) */}
                {!isCameraActive ? (
                  <div className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-500/20 shadow-sm">
                      <Camera className="w-8 h-8" />
                    </div>

                    <div className="space-y-1 max-w-sm">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Camera Scanner Ready
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Click the button below to start your device camera and scan any QR code in real time.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={startCamera}
                      className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Camera Scanner</span>
                    </button>
                  </div>
                ) : (
                  /* State: Camera is ON (Stream Active) */
                  <div className="relative rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-center min-h-[300px] sm:min-h-[380px]">
                    <div id="page-qr-scanner-viewport" className="w-full max-w-md" />
                    
                    {/* Reticle / frame indicator */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                      <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-indigo-500/80 rounded-2xl relative shadow-2xl">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-400 -mt-0.5 -ml-0.5" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-400 -mt-0.5 -mr-0.5" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-400 -mb-0.5 -ml-0.5" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-400 -mb-0.5 -mr-0.5" />
                      </div>
                      <p className="mt-4 text-xs font-semibold text-white/90 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                        Align QR code inside the frame
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Image File Upload Mode */}
            {activeTab === 'file' && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-center flex flex-col items-center justify-center space-y-4 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-500/20 shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>

                <div className="space-y-1 max-w-sm">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Upload QR Code Image
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click to select an image from your device (PNG, JPG, WEBP)
                  </p>
                </div>

                <button
                  type="button"
                  className="h-10 px-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 shadow-xs pointer-events-none"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Image File</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Recent Scans Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent Scans</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Past QR codes scanned on this browser</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentScans.length === 0 ? (
          <div className="glass-panel p-6 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400">
            No scans recorded yet. Use the camera or image upload above to scan your first QR code.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {recentScans.map(item => (
              <div 
                key={item.id}
                className="glass-panel p-4 rounded-2xl space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                      {item.type || 'Text'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate">
                    {item.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(item.content);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
