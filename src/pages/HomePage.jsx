import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  getUserQRCodes,
  getAllScanEvents,
  saveQRCode
} from '../services/storageService';
import { encodeQRContent, isDynamicSupported, getDynamicTarget, isStep1Filled, getStep1ValidationError } from '../utils/qrTypes';
import { QR_TEMPLATES } from '../utils/qrTemplates';
import { exportAsPNG, exportAsSVG, exportAsPDF, copyQRImageToClipboard } from '../utils/qrExport';
import { useAuth } from '../context/AuthContext';
import QRPreview from '../components/QRPreview';
import {
  Globe, FileText, Wifi, UserCheck, CreditCard, MessageCircle,
  Mail, Phone, MessageSquare, Share2, Calendar, MapPin,
  Download, Copy, BookmarkCheck, Check, Sparkles,
  Scan, ArrowRight, ArrowLeft, Zap, QrCode, Layers,
  BarChart3, ChevronRight, Eye, EyeOff, FolderKanban,
  CheckCircle2, Sliders, Palette, LayoutTemplate, RotateCcw, Lock, AlertCircle
} from 'lucide-react';

export default function HomePage({ onOpenScanner }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const previewRef = useRef(null);

  // Multi-Step Wizard State: 1 = Content, 2 = Design & Template, 3 = Save & Share
  const [currentStep, setCurrentStep] = useState(1);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [step1Error, setStep1Error] = useState(null);

  // QR Creator state
  const [qrType, setQrType] = useState('url');
  const [qrName, setQrName] = useState('My QR Code');
  const [formData, setFormData] = useState({
    url: '',
    text: '',
    ssid: '',
    password: '',
    encryption: 'WPA',
    firstName: '',
    lastName: '',
    organization: '',
    phone: '',
    email: '',
    subject: '',
    body: '',
    message: '',
    pa: '',
    pn: '',
    am: '',
    tn: '',
    platform: 'instagram',
    username: '',
    title: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    query: '',
  });

  const [isDynamic, setIsDynamic] = useState(true);
  const [shortCode, setShortCode] = useState(() => Math.random().toString(36).substring(2, 7));
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [dotsType, setDotsType] = useState('classy-rounded');
  const [cornersSquareType, setCornersSquareType] = useState('extra-rounded');
  const [templateConfig, setTemplateConfig] = useState({});

  // Custom Frame & Text State (User can write any text of their choice)
  const [frameType, setFrameType] = useState('none');
  const [frameTitle, setFrameTitle] = useState('SCAN CODE');
  const [frameText, setFrameText] = useState('SCAN ME');
  const [frameColor, setFrameColor] = useState('#4f46e5');

  // Action status
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [firestoreWarning, setFirestoreWarning] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // User Dashboard collections
  const [qrs, setQrs] = useState([]);
  const [totalScans, setTotalScans] = useState(0);

  const loadData = async () => {
    if (user?.uid) {
      const userCodes = await getUserQRCodes(user.uid);
      setQrs(userCodes);

      const scans = await getAllScanEvents();
      const userQRIds = new Set(userCodes.map(q => q.id));
      const relevantScans = scans.filter(s => userQRIds.has(s.qrId));
      setTotalScans(relevantScans.length);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle template or editQR passed via navigation state
  useEffect(() => {
    if (location.state?.template) {
      if (!user) {
        navigate('/login', { state: { from: '/', template: location.state.template } });
        return;
      }
      applyTemplate(location.state.template);
      setCurrentStep(2); // Jump straight to template & design step
    } else if (location.state?.editQR) {
      applyQRToEdit(location.state.editQR);
      setCurrentStep(1);
    }
  }, [location.state, user]);

  const applyTemplate = (template, forceData = false) => {
    // Only adopt template name if user hasn't given a custom name
    setQrName(prev => (!prev || prev === 'My QR Code' || prev === 'Custom QR' ? (template.name || 'Custom QR') : prev));

    const isCurrentFilled = isStep1Filled(qrType, formData);

    // If user has not filled data yet, or forceData is explicitly requested, sync type and template sample data
    if (!isCurrentFilled || forceData) {
      if (template.type) setQrType(template.type);
      setFormData(prev => ({ ...prev, ...(template.data || {}) }));
    } else {
      // PRESERVE user's entered data (e.g. url, text, ssid, etc.) - DO NOT OVERRIDE!
      setFormData(prev => {
        const updated = { ...prev };
        if (template.data) {
          Object.keys(template.data).forEach(key => {
            // Only populate fields that are currently empty
            if (!updated[key] || (typeof updated[key] === 'string' && !updated[key].trim())) {
              updated[key] = template.data[key];
            }
          });
        }
        return updated;
      });
    }

    if (template.config) {
      setTemplateConfig(template.config);
      if (template.config.fgColor) setFgColor(template.config.fgColor);
      if (template.config.bgColor) setBgColor(template.config.bgColor);
      if (template.config.dotsType) setDotsType(template.config.dotsType);
      if (template.config.cornersSquareType) setCornersSquareType(template.config.cornersSquareType);

      // Populate editable custom frame & text from template
      setFrameType(template.config.frame || 'none');
      setFrameTitle(template.config.frameTitle || 'SCAN CODE');
      setFrameText(template.config.frameText || 'SCAN ME');
      setFrameColor(template.config.frameColor || template.config.fgColor || '#4f46e5');
    } else {
      setTemplateConfig({});
      setFrameType('none');
      setFrameTitle('SCAN CODE');
      setFrameText('SCAN ME');
    }
  };

  const applyQRToEdit = (qr) => {
    setQrName(qr.name || 'My QR Code');
    setQrType(qr.type || 'url');
    if (qr.data) {
      setFormData(prev => ({ ...prev, ...qr.data }));
    } else if (qr.type === 'url' && qr.destinationUrl) {
      setFormData(prev => ({ ...prev, url: qr.destinationUrl }));
    }
    setIsDynamic(Boolean(qr.isDynamic));
    if (qr.shortCode) setShortCode(qr.shortCode);

    if (qr.config) {
      setTemplateConfig(qr.config);
      if (qr.config.fgColor) setFgColor(qr.config.fgColor);
      if (qr.config.bgColor) setBgColor(qr.config.bgColor);
      if (qr.config.dotsType) setDotsType(qr.config.dotsType);
      if (qr.config.cornersSquareType) setCornersSquareType(qr.config.cornersSquareType);
      setFrameType(qr.config.frame || 'none');
      setFrameTitle(qr.config.frameTitle || 'SCAN CODE');
      setFrameText(qr.config.frameText || 'SCAN ME');
      setFrameColor(qr.config.frameColor || qr.config.fgColor || '#4f46e5');
    }
  };

  // Compute final encoded payload & dynamic target
  // Guests get basic high-quality static QR codes; dynamic links require an account
  const canBeDynamic = isDynamicSupported(qrType);
  const isCurrentlyDynamic = Boolean(user) && isDynamic && canBeDynamic;
  const rawContent = encodeQRContent(qrType, formData);
  const dynamicTarget = getDynamicTarget(qrType, formData);
  const dynamicRedirectUrl = `${window.location.origin}/r/${shortCode}`;
  
  // Validate that required content is entered by the user
  const hasStep1Data = isStep1Filled(qrType, formData);
  const finalPayload = !hasStep1Data ? '' : (isCurrentlyDynamic ? dynamicRedirectUrl : rawContent);

  const validateStep1 = () => {
    const error = getStep1ValidationError(qrType, formData);
    if (error) {
      setStep1Error(error);
      return false;
    }
    setStep1Error(null);
    return true;
  };

  const handleGoToStep = (targetStep) => {
    if (targetStep > 1) {
      const isValid = validateStep1();
      if (!isValid) {
        setCurrentStep(1);
        return;
      }
    }
    setStep1Error(null);
    setCurrentStep(targetStep);
  };

  const handleFieldChange = (field, val) => {
    if (step1Error) setStep1Error(null);
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveQR = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    setSaving(true);
    setFirestoreWarning(null);
    try {
      const derivedName = (frameTitle && frameTitle !== 'SCAN CODE')
        ? frameTitle
        : (formData.title || (qrType === 'url' ? (formData.url ? new URL(formData.url).hostname : 'Website QR') : `${qrType.toUpperCase()} Code`));

      const record = {
        name: qrName || derivedName || 'My QR Code',
        type: qrType,
        data: formData,
        encodedContent: finalPayload,
        config: {
          ...templateConfig,
          fgColor,
          bgColor,
          dotsType,
          cornersSquareType,
          cornersDotType: templateConfig.cornersDotType || 'dot',
          frame: frameType,
          frameTitle,
          frameText,
          frameColor,
        },
        isDynamic: isCurrentlyDynamic,
        shortCode: isCurrentlyDynamic ? shortCode : null,
        destinationUrl: isCurrentlyDynamic ? dynamicTarget : null,
        active: true,
      };

      const result = await saveQRCode(record, user);
      if (result.firestoreError) {
        setFirestoreWarning(result.firestoreError);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      loadData();
    } catch (err) {
      console.error('Failed to save QR', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    const instance = previewRef.current?.getInstance();
    if (instance) {
      await exportAsPNG(instance, qrName || 'qr-code', 1024);
    }
  };

  const handleDownloadSVG = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    const instance = previewRef.current?.getInstance();
    if (instance) {
      await exportAsSVG(instance, qrName || 'qr-code');
    }
  };

  const handleDownloadPDF = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    const instance = previewRef.current?.getInstance();
    if (instance) {
      const details = isCurrentlyDynamic ? dynamicRedirectUrl : (formData.url || dynamicTarget || finalPayload);
      await exportAsPDF(instance, qrName || 'QR Code', details);
    }
  };

  const handleCopyImage = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    const instance = previewRef.current?.getInstance();
    if (instance) {
      const ok = await copyQRImageToClipboard(instance);
      if (ok) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  const handleShare = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    const link = isCurrentlyDynamic ? dynamicRedirectUrl : (formData.url || dynamicTarget || finalPayload);
    if (navigator.share) {
      try {
        await navigator.share({
          title: qrName || 'My QR Code',
          text: `Scan or open this QR code: ${qrName}`,
          url: link,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(link);
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 2000);
        }
      }
    } else {
      navigator.clipboard.writeText(link);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handleResetForm = () => {
    setQrName('My QR Code');
    setStep1Error(null);
    setFormData({
      url: '',
      text: '',
      ssid: '',
      password: '',
      encryption: 'WPA',
      firstName: '',
      lastName: '',
      organization: '',
      phone: '',
      email: '',
      subject: '',
      body: '',
      message: '',
      pa: '',
      pn: '',
      am: '',
      tn: '',
      platform: 'instagram',
      username: '',
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      query: '',
    });
    setFgColor('#0f172a');
    setBgColor('#ffffff');
    setDotsType('classy-rounded');
    setCornersSquareType('extra-rounded');
    setFrameType('none');
    setFrameTitle('SCAN CODE');
    setFrameText('SCAN ME');
    setShortCode(Math.random().toString(36).substring(2, 7));
    setCurrentStep(1);
  };

  // Supported QR Types
  const allTypes = [
    { id: 'url', label: 'Website', shortLabel: 'Web', icon: Globe },
    { id: 'text', label: 'Plain Text', shortLabel: 'Text', icon: FileText },
    { id: 'wifi', label: 'Wi-Fi Network', shortLabel: 'Wi-Fi', icon: Wifi },
    { id: 'vcard', label: 'Contact Card', shortLabel: 'Contact', icon: UserCheck },
    { id: 'upi', label: 'UPI Payment', shortLabel: 'UPI Pay', icon: CreditCard },
    { id: 'whatsapp', label: 'WhatsApp', shortLabel: 'WhatsApp', icon: MessageCircle },
    { id: 'email', label: 'Email Message', shortLabel: 'Email', icon: Mail },
    { id: 'phone', label: 'Phone Call', shortLabel: 'Call', icon: Phone },
    { id: 'sms', label: 'SMS Text', shortLabel: 'SMS', icon: MessageSquare },
    { id: 'social', label: 'Social Profile', shortLabel: 'Social', icon: Share2 },
    { id: 'event', label: 'Calendar Event', shortLabel: 'Event', icon: Calendar },
    { id: 'location', label: 'Location Map', shortLabel: 'Location', icon: MapPin },
  ];

  const colorPresets = [
    { name: 'Dark Slate', fg: '#0f172a', bg: '#ffffff' },
    { name: 'Royal Indigo', fg: '#4338ca', bg: '#ffffff' },
    { name: 'Emerald', fg: '#047857', bg: '#ffffff' },
    { name: 'Crimson', fg: '#b91c1c', bg: '#ffffff' },
    { name: 'Violet Luxe', fg: '#7c3aed', bg: '#ffffff' },
    { name: 'Midnight Dark', fg: '#f8fafc', bg: '#090d16' },
  ];

  const patternStyles = [
    { id: 'classy-rounded', label: 'Smooth' },
    { id: 'dots', label: 'Dots' },
    { id: 'rounded', label: 'Rounded' },
    { id: 'square', label: 'Square' },
  ];

  const frameOptions = [
    { id: 'none', label: 'No Frame', shortLabel: 'None', icon: EyeOff },
    { id: 'scan-me-bottom', label: 'Callout Pill', shortLabel: 'Pill', icon: ChevronRight },
    { id: 'promotional', label: 'Header Ribbon', shortLabel: 'Ribbon', icon: Sparkles },
    { id: 'table-tent', label: 'Table Stand', shortLabel: 'Stand', icon: Layers },
    { id: 'ticket', label: 'VIP Ticket', shortLabel: 'Ticket', icon: CreditCard },
    { id: 'social-badge', label: 'Creator Plaque', shortLabel: 'Badge', icon: Share2 },
    { id: 'card', label: 'Executive Card', shortLabel: 'Card', icon: FileText },
    { id: 'simple', label: 'Simple Border', shortLabel: 'Border', icon: QrCode },
  ];

  const wizardSteps = [
    { id: 1, title: 'Content & Type', shortTitle: 'Content', subtitle: 'Select type & data', icon: Sliders },
    { id: 2, title: 'Template & Design', shortTitle: 'Design', subtitle: 'Frames, colors & text', icon: Palette },
    { id: 3, title: 'Save & Share', shortTitle: 'Export', subtitle: 'Export & distribute', icon: Share2 },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8 theme-bg-page transition-colors duration-200">

      {/* ========================================================= */}
      {/* 1. TOP HEADER ROW — Responsive with icon/text collapse    */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between gap-2.5 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-0.5 min-w-0">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
            Create QR Code
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 truncate">
            Follow simple steps to design, customize, and export custom QR codes
          </p>
        </div>

        {/* Action Buttons: Clean icon buttons on mobile, full text on larger screens */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            to="/templates"
            className="h-8 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10 hover:bg-amber-100/70 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Browse QR Templates"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">Templates</span>
          </Link>

          {user ? (
            <button
              type="button"
              onClick={() => navigate('/library')}
              className="h-8 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Open QR Library"
            >
              <FolderKanban className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="hidden sm:inline">Library ({qrs.length})</span>
              <span className="sm:hidden text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-500/15 px-1 rounded text-indigo-600 dark:text-indigo-400">{qrs.length}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="h-8 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Sign In to access Cloud Library"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => navigate('/scanner')}
            className="h-8 sm:h-10 px-2.5 sm:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow"
            title="Open Scanner"
          >
            <Scan className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Scan</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. PROGRESSIVE WIZARD STEPPER BAR (Adaptive & Mobile)     */}
      {/* ========================================================= */}
      <div className="glass-panel p-1.5 sm:p-3 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800/80">
        <div className="grid grid-cols-3 gap-1 sm:gap-3">
          {wizardSteps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleGoToStep(step.id)}
                className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-3 p-1.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all cursor-pointer text-center sm:text-left min-w-0 ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500/50'
                    : isCompleted
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60 dark:hover:bg-indigo-500/20'
                      : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                  }`}
              >
                {/* Step badge icon / number */}
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 text-xs sm:text-sm font-bold transition-colors ${isActive
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : isCompleted
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : (
                    <>
                      <Icon className="w-3.5 h-3.5 sm:hidden" />
                      <span className="hidden sm:inline">{step.id}</span>
                    </>
                  )}
                </div>

                {/* Step title & subtitle */}
                <div className="min-w-0">
                  <span className={`text-[10px] sm:text-xs md:text-sm font-bold block truncate leading-tight ${isActive ? 'text-white' : ''}`}>
                    <span className="hidden sm:inline">{step.title}</span>
                    <span className="sm:hidden">{step.shortTitle}</span>
                  </span>
                  <span className={`text-[10px] hidden sm:block truncate mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                    {step.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. STEP CONTENT WORKSPACE & LIVE STAGE                    */}
      {/* ========================================================= */}
      <div className="glass-panel rounded-3xl p-4 sm:p-7 shadow-sm space-y-6">

        {/* Top Mini Toolbar for Active Step: Shows step badge & mobile preview toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px] shrink-0 border border-indigo-200/60 dark:border-indigo-500/30">
              Step {currentStep}/3
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
              {wizardSteps.find(s => s.id === currentStep)?.title}
            </span>
          </div>

          {/* Mobile Preview Toggle (Only on smaller screens for Step 1 & 2) */}
          {currentStep < 3 && (
            <button
              type="button"
              onClick={() => setMobilePreviewOpen(!mobilePreviewOpen)}
              className="lg:hidden h-8 px-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              title={mobilePreviewOpen ? 'Hide Preview' : 'Show Preview'}
            >
              {mobilePreviewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">{mobilePreviewOpen ? 'Hide' : 'Preview'}</span>
            </button>
          )}
        </div>

        {/* Collapsible Quick Preview Drawer for Mobile (Step 1 & 2) */}
        {currentStep < 3 && mobilePreviewOpen && (
          <div className="lg:hidden p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-800/60 flex flex-col items-center justify-center space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live Preview</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                Live
              </span>
            </div>
            <div
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs"
              style={{
                backgroundColor: bgColor === '#ffffff'
                  ? '#ffffff'
                  : (bgColor === '#090d16' || bgColor === '#022c22' || bgColor === '#0f172a' || bgColor === '#1e1b4b' || bgColor === '#0a0a14')
                    ? '#030712'
                    : bgColor
              }}
            >
              <QRPreview
                content={finalPayload}
                config={{
                  ...templateConfig,
                  fgColor,
                  bgColor,
                  dotsType,
                  cornersSquareType,
                  cornersDotType: templateConfig.cornersDotType || 'dot',
                  frame: frameType,
                  frameTitle,
                  frameText,
                  frameColor,
                }}
                size={180}
                showReliability={false}
              />
            </div>
          </div>
        )}

        {/* Main 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">

            {/* ========================================================= */}
            {/* STEP 1: CONTENT & TYPE SELECTION                          */}
            {/* ========================================================= */}
            {currentStep === 1 && (
              <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">

                {/* 1.1 Format Selector Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      1. Choose QR Code Type
                    </label>
                    <span className="text-[11px] text-slate-400">
                      12 formats
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2">
                    {allTypes.map(t => {
                      const Icon = t.icon;
                      const isSelected = qrType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            if (step1Error) setStep1Error(null);
                            setQrType(t.id);
                          }}
                          className={`h-12 sm:h-11 px-1 sm:px-2 rounded-xl text-xs font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${isSelected
                              ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500/50'
                              : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800'
                            }`}
                          title={t.label}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] sm:text-xs truncate max-w-full font-medium">
                            {t.shortLabel || t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1.2 Dynamic Tracking Toggle */}
                {canBeDynamic ? (
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5 sm:gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Zap className={`w-3.5 h-3.5 shrink-0 ${isDynamic ? 'text-indigo-600 dark:text-indigo-400 fill-indigo-500/30' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          Dynamic Tracking
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                          Editable
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block truncate">
                        Update destination anytime without changing the printed QR code
                      </p>
                    </div>

                    {user ? (
                      <button
                        type="button"
                        onClick={() => setIsDynamic(!isDynamic)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isDynamic ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title={isDynamic ? 'Dynamic tracking enabled' : 'Dynamic tracking disabled'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            isDynamic ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        state={{ from: '/' }}
                        className="h-8 px-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                        title="Sign in to activate dynamic links & analytics"
                      >
                        <Lock className="w-3 h-3 text-indigo-500" />
                        <span>Sign In</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Wifi className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Hardware connection format (Static Mode)</span>
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 shrink-0">
                      Static
                    </span>
                  </div>
                )}

                {/* 1.3 Form Fields by Format */}
                <div className="space-y-3.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      2. Enter Content & Information
                    </label>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold capitalize">
                      {qrType}
                    </span>
                  </div>

                  {/* Validation Error Alert if user attempts to proceed without filling details */}
                  {step1Error && (
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span className="truncate">{step1Error}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setStep1Error(null)}
                        className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 text-xs cursor-pointer font-bold px-1.5 shrink-0"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* 1. URL Input */}
                  {qrType === 'url' && (
                    <div className="space-y-1.5">
                      <div className={`flex items-center h-11 sm:h-12 rounded-2xl border ${
                        step1Error ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                      } bg-white dark:bg-slate-900/90 p-1 shadow-xs focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all min-w-0`}>
                        <div className="flex items-center h-full px-2 sm:px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 rounded-xl gap-1 shrink-0 select-none">
                          <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>https://</span>
                        </div>
                        <input
                          type="text"
                          value={(formData.url || '').replace(/^https?:\/\//i, '')}
                          onChange={(e) => {
                            const val = e.target.value.replace(/^https?:\/\//i, '');
                            handleFieldChange('url', val.trim() ? 'https://' + val : '');
                          }}
                          placeholder="yourwebsite.com/page"
                          className="flex-1 min-w-0 h-full bg-transparent px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-none selection:bg-indigo-600 selection:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. Plain Text Input */}
                  {qrType === 'text' && (
                    <div className="space-y-1.5">
                      <textarea
                        rows={4}
                        value={formData.text || ''}
                        onChange={(e) => handleFieldChange('text', e.target.value)}
                        placeholder="Enter any text, notes, coupon codes, or instructions here..."
                        className="w-full glass-input p-3.5 rounded-2xl text-xs sm:text-sm resize-none"
                      />
                      <div className="text-right text-[11px] text-slate-400">
                        {(formData.text || '').length} characters
                      </div>
                    </div>
                  )}

                  {/* 3. Wi-Fi Input */}
                  {qrType === 'wifi' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Network Name (SSID)</label>
                        <input
                          type="text"
                          value={formData.ssid || ''}
                          onChange={(e) => handleFieldChange('ssid', e.target.value)}
                          placeholder="MyHome_5G"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs sm:text-sm font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                        <input
                          type="text"
                          value={formData.password || ''}
                          onChange={(e) => handleFieldChange('password', e.target.value)}
                          placeholder="Wi-Fi Password"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs sm:text-sm font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Security Type</label>
                        <select
                          value={formData.encryption || 'WPA'}
                          onChange={(e) => handleFieldChange('encryption', e.target.value)}
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium cursor-pointer"
                        >
                          <option value="WPA" className="bg-white dark:bg-slate-900">WPA/WPA2/WPA3 (Standard)</option>
                          <option value="WEP" className="bg-white dark:bg-slate-900">WEP (Legacy)</option>
                          <option value="nopass" className="bg-white dark:bg-slate-900">Open (No Password)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 4. Contact / vCard Input */}
                  {qrType === 'vcard' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">First Name</label>
                        <input
                          type="text"
                          value={formData.firstName || ''}
                          onChange={(e) => handleFieldChange('firstName', e.target.value)}
                          placeholder="John"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Name</label>
                        <input
                          type="text"
                          value={formData.lastName || ''}
                          onChange={(e) => handleFieldChange('lastName', e.target.value)}
                          placeholder="Doe"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Organization</label>
                        <input
                          type="text"
                          value={formData.organization || ''}
                          onChange={(e) => handleFieldChange('organization', e.target.value)}
                          placeholder="Acme Corp"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email</label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          placeholder="john@example.com"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* 5. UPI Pay Input */}
                  {qrType === 'upi' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">UPI ID / VPA *</label>
                        <input
                          type="text"
                          value={formData.pa || ''}
                          onChange={(e) => handleFieldChange('pa', e.target.value)}
                          placeholder="merchant@okhdfcbank"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payee Name</label>
                        <input
                          type="text"
                          value={formData.pn || ''}
                          onChange={(e) => handleFieldChange('pn', e.target.value)}
                          placeholder="Store or Business Name"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Amount (Optional)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.am || ''}
                          onChange={(e) => handleFieldChange('am', e.target.value)}
                          placeholder="e.g. 250"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Note</label>
                        <input
                          type="text"
                          value={formData.tn || ''}
                          onChange={(e) => handleFieldChange('tn', e.target.value)}
                          placeholder="Order #1042"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* 6. WhatsApp Input */}
                  {qrType === 'whatsapp' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone with Country Code *</label>
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          placeholder="+1234567890 (no spaces or hyphens)"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pre-filled Message</label>
                        <textarea
                          rows={3}
                          value={formData.message || ''}
                          onChange={(e) => handleFieldChange('message', e.target.value)}
                          placeholder="Hello, I would like to inquire about..."
                          className="w-full glass-input p-3 rounded-xl text-xs resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 7. Email Input */}
                  {qrType === 'email' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Recipient Email *</label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          placeholder="contact@company.com"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject</label>
                        <input
                          type="text"
                          value={formData.subject || ''}
                          onChange={(e) => handleFieldChange('subject', e.target.value)}
                          placeholder="Inquiry from QR Studio"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Message Body</label>
                        <textarea
                          rows={3}
                          value={formData.body || ''}
                          onChange={(e) => handleFieldChange('body', e.target.value)}
                          placeholder="Type default email message..."
                          className="w-full glass-input p-3 rounded-xl text-xs resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 8. Phone Call Input */}
                  {qrType === 'phone' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number to Call</label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder="+1 (800) 555-0199"
                        className="w-full glass-input h-10 px-3 rounded-xl text-xs font-mono"
                      />
                    </div>
                  )}

                  {/* 9. SMS Input */}
                  {qrType === 'sms' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          placeholder="+1 (555) 019-2834"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">SMS Text Message</label>
                        <textarea
                          rows={3}
                          value={formData.message || ''}
                          onChange={(e) => handleFieldChange('message', e.target.value)}
                          placeholder="Pre-filled SMS text..."
                          className="w-full glass-input p-3 rounded-xl text-xs resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 10. Social Profile Input */}
                  {qrType === 'social' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Platform</label>
                        <select
                          value={formData.platform || 'instagram'}
                          onChange={(e) => handleFieldChange('platform', e.target.value)}
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs cursor-pointer font-medium"
                        >
                          <option value="instagram" className="bg-white dark:bg-slate-900">Instagram</option>
                          <option value="youtube" className="bg-white dark:bg-slate-900">YouTube</option>
                          <option value="linkedin" className="bg-white dark:bg-slate-900">LinkedIn</option>
                          <option value="twitter" className="bg-white dark:bg-slate-900">X (Twitter)</option>
                          <option value="github" className="bg-white dark:bg-slate-900">GitHub</option>
                          <option value="tiktok" className="bg-white dark:bg-slate-900">TikTok</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Username / Handle</label>
                        <input
                          type="text"
                          value={formData.username || ''}
                          onChange={(e) => handleFieldChange('username', e.target.value.replace(/^@/, ''))}
                          placeholder="e.g. username"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* 11. Event / Calendar Input */}
                  {qrType === 'event' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Event Title</label>
                        <input
                          type="text"
                          value={formData.title || ''}
                          onChange={(e) => handleFieldChange('title', e.target.value)}
                          placeholder="Annual Tech Summit 2026"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Event Location</label>
                        <input
                          type="text"
                          value={formData.location || ''}
                          onChange={(e) => handleFieldChange('location', e.target.value)}
                          placeholder="City Convention Hall, Room A"
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Time</label>
                        <input
                          type="datetime-local"
                          value={formData.startDate || ''}
                          onChange={(e) => handleFieldChange('startDate', e.target.value)}
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Time</label>
                        <input
                          type="datetime-local"
                          value={formData.endDate || ''}
                          onChange={(e) => handleFieldChange('endDate', e.target.value)}
                          className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* 12. Location / Maps Input */}
                  {qrType === 'location' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Place Name or Address</label>
                      <input
                        type="text"
                        value={formData.query || ''}
                        onChange={(e) => handleFieldChange('query', e.target.value)}
                        placeholder="e.g. Eiffel Tower, Paris or 1600 Amphitheatre Pkwy"
                        className="w-full glass-input h-10 px-3 rounded-xl text-xs font-medium"
                      />
                    </div>
                  )}

                </div>

                {/* Dynamic Tracking Status Banner */}
                {isCurrentlyDynamic && (
                  <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Dynamic short link: <strong className="font-mono">qrstudio.app/r/{shortCode}</strong></span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                      Live Tracking
                    </span>
                  </div>
                )}

                {/* Step 1 Navigation Action Bar */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) {
                        setCurrentStep(2);
                      }
                    }}
                    className="w-full sm:w-auto h-10 sm:h-11 px-4 sm:px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
                  >
                    <span>Next: Customize Design</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 2: TEMPLATE, FRAME & DESIGN CUSTOMIZATION            */}
            {/* ========================================================= */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">

                {/* 2.1 Quick Template Presets */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Choose Template Style</span>
                      {!user && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/20 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Sign In to Use
                        </span>
                      )}
                    </label>
                    <Link
                      to="/templates"
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Explore Gallery &rarr;</span>
                    </Link>
                  </div>

                  {!user && (
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>Curated templates are exclusive to registered accounts.</span>
                      </div>
                      <Link
                        to="/login"
                        state={{ from: '/' }}
                        className="font-bold underline hover:text-amber-900 dark:hover:text-amber-100 shrink-0"
                      >
                        Sign In
                      </Link>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {QR_TEMPLATES.slice(0, 6).map(tpl => {
                      const isCurrent = qrName === tpl.name;
                      const primaryColor = tpl.config.gradient?.colorStops?.[0]?.color || tpl.config.fgColor || '#4f46e5';

                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            if (!user) {
                              navigate('/login', { state: { from: '/', template: tpl } });
                              return;
                            }
                            applyTemplate(tpl);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${isCurrent
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 ring-1 ring-indigo-500/50'
                              : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-indigo-400 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                                style={{ backgroundColor: primaryColor }}
                              />
                              {!user && (
                                <Lock className="w-2.5 h-2.5 text-slate-400" />
                              )}
                            </div>
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {tpl.type}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-bold block truncate text-slate-900 dark:text-slate-100">
                              {tpl.name}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {tpl.category}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2.2 Frame Silhouette & Custom Text */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Frame Silhouette & Custom Text</span>
                    </label>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {frameType.replace(/-/g, ' ')}
                    </span>
                  </div>

                  {/* Frame Silhouette Selectors (Symmetric 4-column Grid with Icons) */}
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {frameOptions.map(opt => {
                      const Icon = opt.icon || Layers;
                      const isActive = frameType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFrameType(opt.id)}
                          className={`h-12 sm:h-10 px-1 sm:px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200/80 dark:border-slate-800'
                          }`}
                          title={opt.label}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] sm:text-xs truncate max-w-full font-medium">{opt.shortLabel || opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Text Inputs: Anyone can write custom text of their choice */}
                  {frameType !== 'none' && (
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">

                      {/* Frame Header Title Input */}
                      {['card', 'table-tent', 'ticket', 'social-badge', 'promotional'].includes(frameType) && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>Custom Header Title</span>
                            <span className="text-[10px] text-slate-400 font-normal">Top header text</span>
                          </label>
                          <input
                            type="text"
                            value={frameTitle}
                            onChange={(e) => setFrameTitle(e.target.value)}
                            placeholder="e.g. LE BISTRO • TABLE 14, VIP PASS, @myhandle"
                            className="w-full glass-input h-9 px-3 rounded-xl text-xs sm:text-sm font-medium"
                          />
                        </div>
                      )}

                      {/* Frame Callout / Subtext Input */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>Custom Callout / Subtext</span>
                          <span className="text-[10px] text-slate-400 font-normal">Ribbon or pill text</span>
                        </label>
                        <input
                          type="text"
                          value={frameText}
                          onChange={(e) => setFrameText(e.target.value)}
                          placeholder="e.g. SCAN ME, FOLLOW US, TAP TO ORDER, 50% OFF"
                          className="w-full glass-input h-9 px-3 rounded-xl text-xs sm:text-sm font-medium"
                        />
                      </div>

                      {/* Frame Accent Color Swatches */}
                      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Frame Accent Color
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['#4f46e5', '#06b6d4', '#d97706', '#e11d48', '#2563eb', '#059669', '#78350f', '#0f172a'].map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setFrameColor(c)}
                              className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                                frameColor === c ? 'ring-2 ring-indigo-500 scale-110' : 'border-black/20 dark:border-white/20'
                              }`}
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* 2.3 Color Theme & Pattern Styles */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-4">

                  {/* Color Palette (Clean Responsive Grid: 3 cols on mobile, 6 on desktop) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Color Palette</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
                      {colorPresets.map(preset => {
                        const isActive = fgColor === preset.fg && bgColor === preset.bg;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setFgColor(preset.fg);
                              setBgColor(preset.bg);
                              setTemplateConfig(prev => ({ ...prev, gradient: undefined, eyeColor: undefined }));
                            }}
                            className={`h-8 sm:h-9 px-1.5 sm:px-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer truncate ${
                              isActive
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs ring-1 ring-indigo-500/30'
                                : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-black/15 shrink-0 shadow-xs"
                              style={{ backgroundColor: preset.fg }}
                            />
                            <span className="text-[10px] sm:text-[11px] truncate">{preset.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pattern Styles (4-Column Symmetric Grid) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Pattern Dots Style
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {patternStyles.map(style => {
                        const isActive = dotsType === style.id;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setDotsType(style.id)}
                            className={`h-8 px-1.5 sm:px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center truncate ${
                              isActive
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold'
                                : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <span className="text-[11px] sm:text-xs truncate">{style.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Step 2 Navigation Action Bar */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) {
                        setCurrentStep(3);
                      } else {
                        setCurrentStep(1);
                      }
                    }}
                    className="h-10 sm:h-11 px-3.5 sm:px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
                  >
                    <span className="sm:hidden">Next: Export</span>
                    <span className="hidden sm:inline">Next: Save & Share</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 3: PREVIEW, SAVE & SHARE STATION                     */}
            {/* ========================================================= */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">

                {/* On mobile: Show hero preview prominently in Step 3 */}
                <div className="lg:hidden flex flex-col items-center justify-center space-y-3">
                  <div
                    className="p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md relative z-10 flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: bgColor === '#ffffff'
                        ? '#ffffff'
                        : (bgColor === '#090d16' || bgColor === '#022c22' || bgColor === '#0f172a' || bgColor === '#1e1b4b' || bgColor === '#0a0a14')
                          ? '#030712'
                          : bgColor
                    }}
                  >
                    <QRPreview
                      content={finalPayload}
                      config={{
                        ...templateConfig,
                        fgColor,
                        bgColor,
                        dotsType,
                        cornersSquareType,
                        cornersDotType: templateConfig.cornersDotType || 'dot',
                        frame: frameType,
                        frameTitle,
                        frameText,
                        frameColor,
                      }}
                      size={220}
                      showReliability={false}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      100% Scannable
                    </span>
                    {isCurrentlyDynamic && (
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                        Live Tracking
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Missing Alert */}
                {!hasStep1Data && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-medium min-w-0">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Details missing. Enter content in Step 1 to export or save.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 cursor-pointer self-start xs:self-auto flex items-center gap-1"
                    >
                      <span>Fill Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* QR Summary Overview Card */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Summary Overview
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                      {qrType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block font-medium">Design Style</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5 capitalize">
                        {frameType === 'none' ? 'Clean Frame' : frameType.replace(/-/g, ' ')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block font-medium">Tracking Mode</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                        {isCurrentlyDynamic ? 'Dynamic (Live Scans)' : 'Direct Static'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {isCurrentlyDynamic ? 'Dynamic Link & Target' : 'Encoded Destination / Data'}
                    </span>
                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate block mt-0.5">
                      {hasStep1Data 
                        ? (isCurrentlyDynamic ? `${dynamicRedirectUrl} ➔ ${dynamicTarget}` : finalPayload)
                        : '(Awaiting Step 1 Information)'}
                    </span>
                  </div>
                </div>

                {/* Primary Action 1: Save QR to Library (Requires Login) */}
                <div className="space-y-2">
                  {user ? (
                    <button
                      type="button"
                      onClick={handleSaveQR}
                      disabled={saving}
                      className="w-full h-11 sm:h-12 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      {saveSuccess ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Saved Successfully to Library!</span>
                        </>
                      ) : (
                        <>
                          <BookmarkCheck className="w-4 h-4" />
                          <span>{saving ? 'Saving...' : 'Save QR to Library'}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/login', { state: { from: '/' } })}
                      className="w-full h-11 sm:h-12 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Lock className="w-4 h-4 text-indigo-500" />
                      <span>Sign In to Save QR to Library</span>
                    </button>
                  )}

                  {/* Firestore Cloud Status Note */}
                  {firestoreWarning && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
                      Saved locally. <span className="font-semibold">Cloud sync note:</span> {firestoreWarning}.
                    </div>
                  )}
                </div>

                {/* Primary Action 2: High Resolution Downloads */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Download High-Resolution Formats
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadPNG}
                      className="h-10 sm:h-11 px-2 sm:px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>PNG</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadSVG}
                      className="h-10 sm:h-11 px-2 sm:px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>SVG</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      className="h-10 sm:h-11 px-2 sm:px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {/* Primary Action 3: Quick Share & Copy */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Quick Share & Copy
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyImage}
                      className="h-10 px-2 sm:px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="truncate">{copySuccess ? 'Copied!' : 'Copy Image'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="h-10 px-2 sm:px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      {shareSuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span className="truncate">{shareSuccess ? 'Copied!' : 'Share QR'}</span>
                    </button>
                  </div>
                </div>

                {/* Step 3 Navigation Action Bar */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="h-10 sm:h-11 px-2.5 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="Create Another QR Code"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">New QR</span>
                    </button>

                    {user ? (
                      <button
                        type="button"
                        onClick={() => navigate('/library')}
                        className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <FolderKanban className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">Library</span>
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        state={{ from: '/' }}
                        className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Lock className="w-3.5 h-3.5 text-indigo-200" />
                        <span>Sign In</span>
                      </Link>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Right Column: Live Sticky Preview Stage (Visible on Desktop across all steps) */}
          <div className="hidden lg:block lg:col-span-5 space-y-4 lg:sticky lg:top-6">

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Live Studio Stage
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Scannable
              </span>
            </div>

            {/* Elevated Studio Canvas with Ambient Radial Glow */}
            <div className="relative rounded-3xl p-6 bg-gradient-to-b from-slate-100/90 via-white to-slate-50 dark:from-slate-900/90 dark:via-slate-950 dark:to-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-radial from-indigo-500/8 to-transparent pointer-events-none" />

              <div
                className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative z-10 flex items-center justify-center transition-all duration-300"
                style={{
                  backgroundColor: bgColor === '#ffffff'
                    ? '#ffffff'
                    : (bgColor === '#090d16' || bgColor === '#022c22' || bgColor === '#0f172a' || bgColor === '#1e1b4b' || bgColor === '#0a0a14')
                      ? '#030712'
                      : bgColor
                }}
              >
                <QRPreview
                  ref={previewRef}
                  content={finalPayload}
                  config={{
                    ...templateConfig,
                    fgColor,
                    bgColor,
                    dotsType,
                    cornersSquareType,
                    cornersDotType: templateConfig.cornersDotType || 'dot',
                    frame: frameType,
                    frameTitle,
                    frameText,
                    frameColor,
                  }}
                  size={220}
                  showReliability={false}
                />
              </div>

              {isCurrentlyDynamic && (
                <div className="mt-3.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-[11px] text-indigo-700 dark:text-indigo-300 font-mono flex items-center gap-1.5 relative z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>qrstudio.app/r/{shortCode}</span>
                </div>
              )}
            </div>

            {/* Step Helper Tip */}
            <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/70 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>{currentStep === 1 ? 'Configure your content and proceed to design.' : currentStep === 2 ? 'Customized frames update live here.' : 'Ready to export in high-res.'}</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Step {currentStep}/3</span>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* 4. OVERVIEW & STATISTICS (Only for logged in users)       */}
      {/* ========================================================= */}
      {user ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Metric 1 */}
            <div className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-500/20">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">Created Codes</span>
                <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">{qrs.length}</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200/60 dark:border-sky-500/20">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">Dynamic Links</span>
                <span className="text-lg sm:text-xl font-extrabold font-mono text-sky-600 dark:text-sky-400">
                  {qrs.filter(q => q.isDynamic).length}
                </span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-500/20">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">Recorded Scans</span>
                <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{totalScans}</span>
              </div>
            </div>

            {/* Metric 4 */}
            <div 
              onClick={() => navigate('/scanner')}
              className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center justify-between shadow-xs cursor-pointer hover:border-indigo-400/50 transition-all group"
              title="Open QR Scanner"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-500/20 group-hover:scale-105 transition-transform">
                  <Scan className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">Scanner</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate group-hover:text-indigo-600 transition-colors">Scan Codes</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </div>

          {/* 5. RECENT CREATIONS COLLECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Recent Creations</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Quick access to your latest saved QR codes</p>
              </div>
              <Link
                to="/library"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span className="hidden xs:inline">View All Library</span>
                <span>({qrs.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {qrs.length === 0 ? (
              <div className="glass-panel p-8 rounded-3xl text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200/60 dark:border-indigo-500/20">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No saved QR codes yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Configure your payload and style in the studio steps above, then save or export to start your collection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {qrs.slice(0, 4).map(qr => (
                  <div
                    key={qr.id}
                    onClick={() => navigate(`/analytics?id=${qr.id}`)}
                    className="glass-panel p-4 rounded-2xl space-y-3 hover:border-indigo-400/50 dark:hover:border-indigo-500/40 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-500/20">
                          {qr.type || 'URL'}
                        </span>
                        {qr.isDynamic && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                            {qr.scansCount || 0} scans
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {qr.name}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {qr.destinationUrl || qr.encodedContent}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <span className="text-[10px]">View Analytics</span>
                      <BarChart3 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Guest Banner: Informs unauthenticated users about account benefits */
        <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-indigo-200/80 dark:border-indigo-800/80 bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/20 dark:from-indigo-950/20 dark:via-slate-900/60 dark:to-slate-900/40 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2 text-center md:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Unlock Cloud Library & Dynamic Tracking</span>
            </span>
            <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Create an account to track scans and save your QR codes
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              You can create and download standard QR codes for free without signing in. To unlock editable dynamic links, real-time scan analytics, and saving codes to your personal library, please sign in.
            </p>
          </div>

          <div className="flex flex-col xs:flex-row items-center gap-2 sm:gap-2.5 w-full xs:w-auto shrink-0">
            <Link
              to="/login"
              className="w-full xs:w-auto h-9 sm:h-10 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="w-full xs:w-auto h-9 sm:h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-1.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
