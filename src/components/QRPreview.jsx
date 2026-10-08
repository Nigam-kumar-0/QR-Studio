import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { evaluateScanReliability } from '../utils/scanReliability';
import { ShieldCheck, AlertTriangle, AlertCircle, QrCode } from 'lucide-react';

const QRPreview = forwardRef(({ 
  content, 
  config = {}, 
  size = 280, 
  showReliability = true 
}, ref) => {
  const containerRef = useRef(null);
  const qrCodeRef = useRef(null);

  const hasContent = Boolean(content && content.trim());

  // Evaluate scan quality
  const reliability = evaluateScanReliability(hasContent ? content : '', config);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!hasContent) {
      // Do not destroy instance or container child nodes.
      // The container is hidden via CSS when !hasContent, and the placeholder is shown.
      return;
    }

    try {
      if (!qrCodeRef.current) {
        qrCodeRef.current = new QRCodeStyling({
          width: size,
          height: size,
          type: 'canvas',
          data: content,
          dotsOptions: {
            color: config.fgColor || '#0f172a',
            type: config.dotsType || 'classy-rounded',
            gradient: config.gradient || undefined,
          },
          backgroundOptions: {
            color: config.bgColor || '#ffffff',
          },
          cornersSquareOptions: {
            type: config.cornersSquareType || 'extra-rounded',
            color: config.eyeColor || config.fgColor || '#0f172a',
          },
          cornersDotOptions: {
            type: config.cornersDotType || 'dot',
            color: config.eyeColor || config.fgColor || '#0f172a',
          },
          image: config.logo || undefined,
          imageOptions: {
            crossOrigin: 'anonymous',
            margin: config.logoMargin || 6,
            imageSize: config.logoSize || 0.22,
            hideBackgroundDots: true,
          },
          qrOptions: {
            errorCorrectionLevel: reliability.errorCorrectionLevel,
          }
        });

        containerRef.current.innerHTML = '';
        qrCodeRef.current.append(containerRef.current);
      } else {
        if (!containerRef.current.hasChildNodes()) {
          qrCodeRef.current.append(containerRef.current);
        }

        qrCodeRef.current.update({
          width: size,
          height: size,
          data: content,
          dotsOptions: {
            color: config.fgColor || '#0f172a',
            type: config.dotsType || 'classy-rounded',
            gradient: config.gradient || undefined,
          },
          backgroundOptions: {
            color: config.bgColor || '#ffffff',
          },
          cornersSquareOptions: {
            type: config.cornersSquareType || 'extra-rounded',
            color: config.eyeColor || config.fgColor || '#0f172a',
          },
          cornersDotOptions: {
            type: config.cornersDotType || 'dot',
            color: config.eyeColor || config.fgColor || '#0f172a',
          },
          image: config.logo || undefined,
          imageOptions: {
            crossOrigin: 'anonymous',
            margin: config.logoMargin || 6,
            imageSize: config.logoSize || 0.22,
            hideBackgroundDots: true,
          },
          qrOptions: {
            errorCorrectionLevel: reliability.errorCorrectionLevel,
          }
        });
      }
    } catch (err) {
      console.warn('QR code update handled gracefully:', err);
      try {
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          qrCodeRef.current = new QRCodeStyling({
            width: size,
            height: size,
            type: 'canvas',
            data: content,
            dotsOptions: {
              color: config.fgColor || '#0f172a',
              type: config.dotsType || 'classy-rounded',
            },
            backgroundOptions: {
              color: config.bgColor || '#ffffff',
            },
          });
          qrCodeRef.current.append(containerRef.current);
        }
      } catch (retryErr) {
        console.error('QR code retry error:', retryErr);
      }
    }
  }, [content, hasContent, config, size, reliability.errorCorrectionLevel]);

  // Expose QR engine instance to parent for export operations
  useImperativeHandle(ref, () => ({
    getInstance: () => qrCodeRef.current,
  }));

  const isDark = (function(hex) {
    if (!hex || hex === 'transparent') return false;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return false;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })(config.bgColor);

  const frameType = config.frame || 'none';
  const frameText = config.frameText || 'SCAN ME';
  const frameColor = config.frameColor || config.fgColor || '#4f46e5';
  const frameTitle = config.frameTitle || 'SCAN CODE';

  return (
    <div className="flex flex-col items-center select-none">
      {/* QR Code with Frame */}
      <div className="relative transition-all duration-300">
        
        {/* Frame Style: Promotional Header Ribbon */}
        {frameType === 'promotional' && (
          <div 
            className="w-full h-8 flex items-center justify-center px-4 rounded-t-2xl font-bold tracking-wider text-[11px] sm:text-xs uppercase text-white shadow-sm leading-none"
            style={{ backgroundColor: frameColor }}
          >
            <span>{frameText}</span>
          </div>
        )}

        {/* Frame Outer Container */}
        <div 
          className={`relative p-4 transition-all duration-200 flex flex-col items-center justify-center ${
            frameType === 'simple' 
              ? 'border-4 rounded-2xl shadow-sm' 
              : frameType === 'card'
              ? `rounded-2xl shadow-lg border ${isDark ? 'border-white/10' : 'border-slate-200/90'}`
              : frameType === 'table-tent'
              ? `rounded-2xl shadow-xl border-2 ${isDark ? 'border-amber-500/30' : 'border-amber-600/20'}`
              : frameType === 'ticket'
              ? `rounded-2xl shadow-lg border border-dashed ${isDark ? 'border-purple-400/40' : 'border-purple-300'}`
              : frameType === 'social-badge'
              ? `rounded-2xl shadow-lg border ${isDark ? 'border-rose-500/30' : 'border-rose-200'}`
              : frameType === 'promotional'
              ? `rounded-b-2xl border-x-2 border-b-2 shadow-sm`
              : frameType === 'scan-me-bottom'
              ? `rounded-2xl shadow-sm border ${isDark ? 'border-white/10' : 'border-slate-200/80'}`
              : 'rounded-2xl'
          }`}
          style={{
            borderColor: ['simple', 'promotional'].includes(frameType) ? frameColor : undefined,
            backgroundColor: config.bgColor === 'transparent' ? 'transparent' : (config.bgColor || '#ffffff'),
          }}
        >
          {/* 1. Card Frame Header */}
          {frameType === 'card' && (
            <div className={`w-full flex items-center justify-between pb-2.5 mb-2 border-b text-[11px] font-bold uppercase tracking-wider ${
              isDark ? 'border-white/10 text-slate-200' : 'border-slate-200/80 text-slate-700'
            }`}>
              <span className="truncate">{frameTitle}</span>
              <span 
                className="w-2 h-2 rounded-full shrink-0 shadow-xs animate-pulse"
                style={{ backgroundColor: frameColor }}
              />
            </div>
          )}

          {/* 2. Table Tent Header */}
          {frameType === 'table-tent' && (
            <div className="w-full flex flex-col items-center pb-2 mb-2 border-b border-amber-500/20 text-center">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                {frameTitle}
              </span>
            </div>
          )}

          {/* 3. Ticket Header */}
          {frameType === 'ticket' && (
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-dashed border-slate-300 dark:border-white/20 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="truncate">{frameTitle}</span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">PASS</span>
            </div>
          )}

          {/* 4. Social Badge Header */}
          {frameType === 'social-badge' && (
            <div className="w-full flex items-center justify-center gap-1.5 pb-2 mb-2 border-b border-rose-500/20 text-center">
              <span className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {frameTitle}
              </span>
              <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold">✓</span>
            </div>
          )}

          {/* QR Canvas & Placeholder Container */}
          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* Live Canvas Element (Always present in DOM to prevent detachment) */}
            <div 
              ref={containerRef} 
              className={`flex items-center justify-center overflow-hidden rounded-lg transition-opacity duration-150 ${
                hasContent ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
              }`}
              style={{ width: size, height: size }}
            />

            {/* Awaiting Details State Placeholder */}
            {!hasContent && (
              <div 
                className="flex flex-col items-center justify-center text-center p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40 select-none absolute inset-0 z-10"
                style={{ width: size, height: size }}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2 shadow-2xs">
                  <QrCode className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Awaiting Details
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[150px] leading-tight">
                  Fill in content in Step 1 to generate live QR code
                </span>
              </div>
            )}
          </div>

          {/* Frame Style: Scan Me Bottom Pill */}
          {frameType === 'scan-me-bottom' && (
            <div 
              className="mt-3 h-7 px-4 rounded-full font-bold text-[11px] uppercase tracking-wider text-white shadow-md inline-flex items-center justify-center leading-none shrink-0"
              style={{ backgroundColor: frameColor }}
            >
              <span>{frameText}</span>
            </div>
          )}

          {/* Card Frame Subtext */}
          {frameType === 'card' && (
            <div className={`w-full text-center pt-2.5 mt-2 border-t text-[11px] font-medium truncate ${
              isDark ? 'border-white/10 text-slate-300' : 'border-slate-200/80 text-slate-600'
            }`}>
              {frameText}
            </div>
          )}

          {/* Table Tent Subtext */}
          {frameType === 'table-tent' && (
            <div className={`w-full text-center pt-2 mt-2 border-t border-amber-500/20 text-[10px] font-semibold tracking-wide ${
              isDark ? 'text-amber-300/80' : 'text-amber-800'
            }`}>
              {frameText}
            </div>
          )}

          {/* Ticket Subtext */}
          {frameType === 'ticket' && (
            <div className="w-full text-center pt-2 mt-2 border-t border-dashed border-slate-300 dark:border-white/20 text-[10px] font-mono tracking-wider text-slate-400">
              {frameText}
            </div>
          )}

          {/* Social Badge Subtext */}
          {frameType === 'social-badge' && (
            <div 
              className="mt-2.5 h-6 px-3.5 rounded-full font-bold text-[10px] uppercase tracking-wider text-white shadow-sm inline-flex items-center justify-center leading-none"
              style={{ backgroundColor: frameColor }}
            >
              <span>{frameText}</span>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Scan Reliability Status */}
      {showReliability && (
        <div className="mt-4 w-full max-w-xs">
          {!hasContent ? (
            <div className="flex items-center justify-between px-3 h-9 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400">
              <div className="flex items-center gap-2">
                <QrCode className="w-3.5 h-3.5 text-slate-400" />
                <span>Enter details to test reliability</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Draft</span>
            </div>
          ) : (
            <>
              <div className={`flex items-center justify-between px-3 h-9 rounded-xl text-xs font-medium border ${reliability.badgeColor}`}>
                <div className="flex items-center gap-2">
                  {reliability.status === 'excellent' && <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {reliability.status === 'moderate' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                  {reliability.status === 'critical' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                  <span className="leading-none">{reliability.label}</span>
                </div>
                <span className="badge-pill font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 leading-none">
                  {reliability.contrastRatio}:1 ratio
                </span>
              </div>

              {reliability.issues.length > 0 && reliability.status !== 'excellent' && (
                <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-300 px-1 leading-snug">
                  {reliability.issues[0]}
                </p>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
});

export default QRPreview;
