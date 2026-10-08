import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QR_TEMPLATES } from '../utils/qrTemplates';
import { encodeQRContent } from '../utils/qrTypes';
import QRPreview from '../components/QRPreview';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, PlusCircle, ArrowRight, FolderKanban, 
  Wifi, UserCheck, Globe, CreditCard, MessageCircle, 
  Calendar, Phone, Share2, Layers, Palette, Check,
  Eye, X, Tag, ExternalLink, Lock
} from 'lucide-react';

export default function TemplatesPage({ onSelectTemplate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inspectModalTemplate, setInspectModalTemplate] = useState(null);

  const categories = [
    { id: 'all', label: 'All Presets (12)' },
    { id: 'hospitality', label: 'Dining & Hospitality' },
    { id: 'creator', label: 'Creators & Social' },
    { id: 'events', label: 'Events & Tickets' },
    { id: 'payments', label: 'Payments & UPI' },
    { id: 'professional', label: 'Executive vCard' },
    { id: 'retail', label: 'Retail & Offers' },
    { id: 'tech', label: 'Tech & Web3' },
    { id: 'care', label: 'Helpdesk & Health' },
  ];

  const filteredTemplates = QR_TEMPLATES.filter(t => {
    if (selectedCategory === 'all') return true;
    const cat = t.category.toLowerCase();
    if (selectedCategory === 'hospitality') return cat.includes('hospitality');
    if (selectedCategory === 'creator') return cat.includes('creator') || cat.includes('social');
    if (selectedCategory === 'events') return cat.includes('event');
    if (selectedCategory === 'payments') return cat.includes('payment');
    if (selectedCategory === 'professional') return cat.includes('professional');
    if (selectedCategory === 'retail') return cat.includes('retail') || cat.includes('offer');
    if (selectedCategory === 'tech') return cat.includes('tech') || cat.includes('crypto');
    if (selectedCategory === 'care') return cat.includes('care') || cat.includes('health') || cat.includes('customer');
    return true;
  });

  const handleUseTemplate = (template) => {
    if (!user) {
      navigate('/login', { state: { from: '/', template } });
      return;
    }
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
    navigate('/', { state: { template } });
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'wifi': return Wifi;
      case 'vcard': return UserCheck;
      case 'upi': return CreditCard;
      case 'whatsapp': return MessageCircle;
      case 'event': return Calendar;
      case 'phone': return Phone;
      case 'social': return Share2;
      default: return Globe;
    }
  };

  const getFrameLabel = (frame) => {
    switch (frame) {
      case 'table-tent': return 'Table Tent Stand';
      case 'ticket': return 'VIP Ticket Pass';
      case 'social-badge': return 'Creator Plaque';
      case 'promotional': return 'Header Banner';
      case 'scan-me-bottom': return 'Callout Pill';
      case 'simple': return 'Minimalist Border';
      case 'card': return 'Executive Card';
      default: return 'Standard Frame';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 theme-bg-page transition-colors duration-200">
      
      {/* Top Header Row — Standard SPA Alignment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span>Designer QR Templates</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Bespoke physical silhouettes: dining table stands, event ticket passes, creator plaques, payment ribbons, and executive cards.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {user && (
            <Link
              to="/library"
              className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden xs:inline">My Library</span>
            </Link>
          )}

          <Link
            to="/"
            className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Blank Studio</span>
          </Link>
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid with Bespoke Presentation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
        {filteredTemplates.map(template => {
          const Icon = getIconForType(template.type);
          const encoded = encodeQRContent(template.type, template.data);
          const colors = [
            template.config.bgColor,
            template.config.gradient?.colorStops?.[0]?.color || template.config.fgColor || '#4f46e5',
            template.config.gradient?.colorStops?.[1]?.color || template.config.eyeColor || '#06b6d4'
          ].filter(Boolean);

          return (
            <div
              key={template.id}
              className={`glass-panel p-5 rounded-3xl flex flex-col justify-between border border-slate-200 dark:border-slate-800 ${template.borderGlow || 'hover:border-indigo-400/50'} transition-all shadow-sm hover:shadow-lg space-y-4 group relative overflow-hidden`}
            >
              {/* Subtle ambient gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${template.themeGradient || 'from-indigo-500/10 to-transparent'} pointer-events-none opacity-80`} />

              <div className="space-y-3.5 relative z-10">
                {/* Header tags: Type, Theme Name, Badge */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                      <Icon className="w-3 h-3 text-indigo-500" />
                      <span>{template.type}</span>
                    </span>

                    {template.themeName && (
                      <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-200/80 dark:border-indigo-500/30">
                        {template.themeName}
                      </span>
                    )}
                  </div>

                  {template.badge && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-500/30">
                      {template.badge}
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Visual Palette & Frame Spec Strip */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 pb-0.5">
                  <div className="flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5 text-indigo-500" />
                    <span>{getFrameLabel(template.config.frame)}</span>
                  </div>

                  {/* Color Swatch Dots */}
                  <div className="flex items-center -space-x-1">
                    {colors.map((c, i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-xs"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Bespoke QR Stage Showcase Box */}
                <div 
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-inner min-h-[200px] transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{
                    backgroundColor: template.config.bgColor === '#ffffff' 
                      ? '#f8fafc' 
                      : (template.config.bgColor === '#090d16' || template.config.bgColor === '#022c22' || template.config.bgColor === '#0f172a' || template.config.bgColor === '#1e1b4b' || template.config.bgColor === '#0a0a14')
                      ? '#030712'
                      : '#ffffff'
                  }}
                >
                  <QRPreview
                    content={encoded}
                    config={template.config}
                    size={140}
                    showReliability={false}
                  />
                </div>
              </div>

              {/* Action Buttons: Use in Studio & Quick Inspect */}
              <div className="grid grid-cols-5 gap-2 relative z-10 pt-1">
                <button
                  type="button"
                  onClick={() => setInspectModalTemplate(template)}
                  className="col-span-2 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
                  title="Inspect Template Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUseTemplate(template)}
                  className="col-span-3 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs hover:shadow"
                >
                  {user ? (
                    <>
                      <span>Use Template</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-indigo-200" />
                      <span>Sign In to Use</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Inspect Modal */}
      {inspectModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setInspectModalTemplate(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="space-y-1 pr-8">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                  {inspectModalTemplate.category}
                </span>
                {inspectModalTemplate.badge && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">
                    {inspectModalTemplate.badge}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {inspectModalTemplate.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {inspectModalTemplate.description}
              </p>
            </div>

            {/* High-res Center Stage */}
            <div 
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-inner"
              style={{
                backgroundColor: inspectModalTemplate.config.bgColor === '#ffffff' ? '#f8fafc' : '#030712'
              }}
            >
              <QRPreview
                content={encodeQRContent(inspectModalTemplate.type, inspectModalTemplate.data)}
                config={inspectModalTemplate.config}
                size={220}
                showReliability={true}
              />
            </div>

            {/* Technical Configuration Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Frame Style</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {getFrameLabel(inspectModalTemplate.config.frame)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Dot Geometry</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {inspectModalTemplate.config.dotsType || 'Default'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Background</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {inspectModalTemplate.config.bgColor}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Pre-filled Format</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                  {inspectModalTemplate.type}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setInspectModalTemplate(null)}
                className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const tpl = inspectModalTemplate;
                  setInspectModalTemplate(null);
                  handleUseTemplate(tpl);
                }}
                className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                {user ? (
                  <>
                    <span>Customize in Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Sign In to Use Template</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
