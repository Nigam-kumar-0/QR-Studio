import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getQRCodeByIdSync, getQRCodeById, recordScanEvent } from '../services/storageService';
import { getDynamicTarget } from '../utils/qrTypes';
import { QrCode, AlertOctagon } from 'lucide-react';

function executeFastRedirect(target) {
  if (!target) return;
  // If web URL, use location.replace for instant redirect without intermediate history
  if (target.startsWith('http://') || target.startsWith('https://')) {
    window.location.replace(target);
  } else if (target.startsWith('data:text/vcard')) {
    // For vCard, trigger a download so mobile phones prompt "Save to Contacts"
    const link = document.createElement('a');
    link.href = target;
    link.download = 'contact.vcf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // For tel:, mailto:, sms:, upi://, data:text/plain
    window.location.href = target;
  }
}

export default function DynamicRedirect({ shortCode }) {
  const params = useParams();
  const effectiveCode = shortCode || params?.shortCode;
  const [errorState, setErrorState] = useState(null); // 'not_found' | 'disabled' | null

  useEffect(() => {
    if (!effectiveCode) {
      setErrorState('not_found');
      return;
    }

    // 1. Instant Synchronous Cache Check (0ms latency, zero flash!)
    const cached = getQRCodeByIdSync(effectiveCode);
    if (cached) {
      if (cached.active === false) {
        setErrorState('disabled');
        return;
      }

      // Non-blocking background scan logging
      recordScanEvent(cached.id).catch(() => {});

      const target = cached.destinationUrl || getDynamicTarget(cached.type, cached.data) || cached.encodedContent;
      if (target) {
        executeFastRedirect(target);
        return;
      }
    }

    // 2. Fast Network Lookup for first-time visitors / different devices
    let isCancelled = false;
    getQRCodeById(effectiveCode).then((found) => {
      if (isCancelled) return;
      if (!found) {
        setErrorState('not_found');
        return;
      }
      if (found.active === false) {
        setErrorState('disabled');
        return;
      }

      // Non-blocking background scan logging
      recordScanEvent(found.id).catch(() => {});

      const target = found.destinationUrl || getDynamicTarget(found.type, found.data) || found.encodedContent;
      if (target) {
        executeFastRedirect(target);
      } else {
        setErrorState('not_found');
      }
    }).catch(() => {
      if (!isCancelled) setErrorState('not_found');
    });

    return () => {
      isCancelled = true;
    };
  }, [effectiveCode]);

  // While redirecting or resolving, render NOTHING so there is ZERO intermediate screen flash
  if (!errorState) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 theme-bg-page text-slate-800 dark:text-slate-100">
      <div className="w-full max-w-md p-7 rounded-3xl glass-panel text-center flex flex-col items-center shadow-lg border border-slate-200 dark:border-slate-800">
        {errorState === 'disabled' ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold tracking-tight mb-1 text-slate-900 dark:text-slate-100">
              QR Code Inactive
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6">
              This dynamic QR code has been temporarily deactivated by its creator.
            </p>
            <a 
              href="/" 
              className="py-2.5 px-5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold transition-colors"
            >
              Go to QR Studio Home
            </a>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
              <QrCode className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold tracking-tight mb-1 text-slate-900 dark:text-slate-100">
              QR Code Not Found
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6">
              The dynamic link requested does not exist or has expired.
            </p>
            <a 
              href="/" 
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Open QR Studio
            </a>
          </>
        )}
      </div>
    </div>
  );
}
