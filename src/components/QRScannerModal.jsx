import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, Upload, X, Copy, Check, ExternalLink, Zap, 
  RotateCw, AlertTriangle, Sparkles, PlusCircle 
} from 'lucide-react';
import { addScanHistoryItem } from '../services/storageService';

export default function QRScannerModal({ isOpen, onClose, onUseScannedData }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'file'
  const [scanResult, setScanResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameras, setCameras] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clean up camera on close or tab switch
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const handleStartCamera = async () => {
    setErrorMsg('');
    const scannerId = 'qr-reader-viewport';
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setErrorMsg('No camera hardware detected on this device.');
        return;
      }

      setCameras(devices);
      const backCamera = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0];
      setCurrentCameraId(backCamera.id);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId);
      }

      await startScanningWithCamera(scannerRef.current, backCamera.id);
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg('Camera access was denied or is unavailable. You can use image upload instead.');
    }
  };

  const startScanningWithCamera = async (instance, cameraId) => {
    try {
      if (instance.isScanning) {
        await instance.stop();
      }

      await instance.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Frame error callback - ignore routine non-matches
        }
      );
      setIsScanning(true);
    } catch (e) {
      console.warn('Failed to start scanner with camera:', e);
      setErrorMsg('Could not initialize video feed.');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      setIsScanning(false);
      setTorchOn(false);
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current) return;
    const currentIndex = cameras.findIndex(c => c.id === currentCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    setCurrentCameraId(nextCamera.id);
    await startScanningWithCamera(scannerRef.current, nextCamera.id);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !isScanning) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Torch is not supported on this device/camera.');
    }
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

    // Stop active camera on hit
    stopCamera();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    try {
      const html5Qr = new Html5Qrcode('qr-reader-file-temp');
      const decodedText = await html5Qr.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err) {
      console.error('File scan error:', err);
      setErrorMsg('No readable QR code found in this image.');
    }
  };

  const detectType = (str) => {
    if (/^https?:\/\//i.test(str)) return 'url';
    if (/^WIFI:/i.test(str)) return 'wifi';
    if (/^tel:/i.test(str)) return 'phone';
    if (/^mailto:/i.test(str)) return 'email';
    if (/^sms:/i.test(str)) return 'sms';
    if (/^BEGIN:VCARD/i.test(str)) return 'vcard';
    if (/^upi:\/\//i.test(str)) return 'upi';
    return 'text';
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
    if (activeTab === 'camera' && scannerRef.current && currentCameraId) {
      startScanningWithCamera(scannerRef.current, currentCameraId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">QR Code Scanner</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Camera or image file</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        {!scanResult && (
          <div className="flex p-2 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex-1 py-2 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'camera' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm font-semibold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Camera</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('file');
                stopCamera();
              }}
              className={`flex-1 py-2 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'file' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm font-semibold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto">
          {scanResult ? (
            /* Result Card */
            <div className="flex flex-col items-center text-center py-2 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Check className="w-7 h-7" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Detected: {scanResult.type.toUpperCase()}
              </span>
              
              <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 my-4 text-left">
                <p className="text-sm font-mono text-slate-200 break-all select-all line-clamp-4">
                  {scanResult.content}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-2.5">
                {scanResult.type === 'url' && (
                  <a
                    href={scanResult.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <span>Open URL in Browser</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={copyToClipboard}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Content'}</span>
                </button>

                {onUseScannedData && (
                  <button
                    onClick={() => {
                      onUseScannedData(scanResult);
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-indigo-400 font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-indigo-500/20"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create QR With This Content</span>
                  </button>
                )}

                <button
                  onClick={resetForNextScan}
                  className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors mt-2"
                >
                  Scan Another Code
                </button>
              </div>
            </div>
          ) : activeTab === 'camera' ? (
            /* Live Camera Feed */
            <div className="flex flex-col items-center">
              {!isScanning ? (
                <div className="w-full aspect-square max-w-[280px] bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Camera is inactive. Click below to start scanning.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Camera</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative w-full aspect-square max-w-[280px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    <div id="qr-reader-viewport" className="w-full h-full" />
                    
                    {/* Target Finder Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-48 h-48 border-2 border-indigo-400/60 rounded-xl overflow-hidden">
                        {/* Animated scanline */}
                        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-scanline" />
                      </div>
                    </div>
                  </div>

                  {/* Controls bar (switch camera, torch, stop) */}
                  <div className="flex items-center gap-2 mt-4">
                    {cameras.length > 1 && (
                      <button
                        onClick={switchCamera}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 text-xs flex items-center gap-1.5"
                        title="Flip Camera"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Flip</span>
                      </button>
                    )}

                    <button
                      onClick={toggleTorch}
                      className={`p-2 rounded-xl transition-colors border text-xs flex items-center gap-1.5 ${
                        torchOn 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Flashlight"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Torch</span>
                    </button>

                    <button
                      onClick={stopCamera}
                      className="p-2 rounded-xl border border-rose-500/40 text-rose-400 bg-rose-500/10 text-xs flex items-center gap-1.5"
                    >
                      <span>Stop</span>
                    </button>
                  </div>
                </>
              )}

              {errorMsg && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          ) : (
            /* File Upload Scanner */
            <div className="flex flex-col items-center py-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square max-w-[280px] border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Select Image File</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Drop a PNG, JPG, or screenshot with a QR code
                </p>
              </div>

              {/* Hidden container for temp file decode */}
              <div id="qr-reader-file-temp" className="hidden" />

              {errorMsg && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
