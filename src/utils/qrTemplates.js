export const QR_TEMPLATES = [
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    category: 'Tech & Gaming',
    themeName: 'Neon Glow',
    type: 'url',
    description: 'Electric cyan-to-purple gradient on deep obsidian canvas with card frame',
    data: {
      url: 'https://discord.gg/creativelab',
    },
    config: {
      bgColor: '#090d16',
      gradient: {
        type: 'linear',
        rotation: 0.785,
        colorStops: [
          { offset: 0, color: '#06b6d4' },
          { offset: 1, color: '#a855f7' }
        ]
      },
      dotsType: 'dots',
      cornersSquareType: 'extra-rounded',
      cornersDotType: 'dot',
      eyeColor: '#22d3ee',
      frame: 'card',
      frameTitle: 'CYBER DISCORD HUD',
      frameText: 'JOIN COMMUNITY // 0101',
      frameColor: '#06b6d4',
    },
    badge: 'Trending',
    themeGradient: 'from-cyan-500/15 via-purple-500/10 to-transparent',
    borderGlow: 'hover:border-cyan-500/50 hover:shadow-cyan-500/15'
  },
  {
    id: 'emerald-gold-royale',
    name: 'Emerald & Gold Royale',
    category: 'Hospitality',
    themeName: 'Luxe Dining',
    type: 'url',
    description: 'Rich metallic gold gradient on dark forest emerald with table tent dining stand',
    data: {
      url: 'https://bistroluxe.menu/tasting-menu',
    },
    config: {
      bgColor: '#022c22',
      gradient: {
        type: 'linear',
        rotation: 0.52,
        colorStops: [
          { offset: 0, color: '#fbbf24' },
          { offset: 1, color: '#d97706' }
        ]
      },
      dotsType: 'classy',
      cornersSquareType: 'extra-rounded',
      cornersDotType: 'dot',
      eyeColor: '#f59e0b',
      frame: 'table-tent',
      frameTitle: 'LE BISTRO LUXE • TABLE 14',
      frameText: 'TASTING MENU & WINE LIST',
      frameColor: '#d97706',
    },
    badge: 'Luxury',
    themeGradient: 'from-emerald-500/15 via-amber-500/10 to-transparent',
    borderGlow: 'hover:border-amber-500/50 hover:shadow-amber-500/15'
  },
  {
    id: 'sunset-velvet',
    name: 'Sunset Velvet',
    category: 'Creator & Social',
    themeName: 'Creator Radiant',
    type: 'social',
    description: 'Radiant coral rose to violet gradient on warm pearl background',
    data: {
      platform: 'instagram',
      username: 'velvet.design',
    },
    config: {
      bgColor: '#fff7ed',
      gradient: {
        type: 'linear',
        rotation: 0.8,
        colorStops: [
          { offset: 0, color: '#f43f5e' },
          { offset: 1, color: '#8b5cf6' }
        ]
      },
      dotsType: 'rounded',
      cornersSquareType: 'extra-rounded',
      cornersDotType: 'dot',
      eyeColor: '#e11d48',
      frame: 'social-badge',
      frameTitle: '@velvet.design',
      frameText: 'FOLLOW ON INSTAGRAM',
      frameColor: '#e11d48',
    },
    badge: 'Creator Pick',
    themeGradient: 'from-rose-500/15 via-purple-500/10 to-transparent',
    borderGlow: 'hover:border-rose-500/50 hover:shadow-rose-500/15'
  },
  {
    id: 'fintech-cobalt-pay',
    name: 'Cobalt Instant Pay',
    category: 'Payments',
    themeName: 'Fintech Shield',
    type: 'upi',
    description: 'Royal cobalt blue with electric cyan gradient and instant payment checkout ribbon',
    data: {
      pa: 'merchant.pay@upi',
      pn: 'Studio Checkout',
      am: '999',
      tn: 'Order #4829',
    },
    config: {
      bgColor: '#ffffff',
      gradient: {
        type: 'linear',
        rotation: 0.785,
        colorStops: [
          { offset: 0, color: '#1d4ed8' },
          { offset: 1, color: '#06b6d4' }
        ]
      },
      dotsType: 'classy-rounded',
      cornersSquareType: 'extra-rounded',
      cornersDotType: 'dot',
      eyeColor: '#1e40af',
      frame: 'promotional',
      frameTitle: 'MERCHANT CHECKOUT',
      frameText: 'SCAN & PAY ANY UPI APP',
      frameColor: '#2563eb',
    },
    badge: 'Fintech',
    themeGradient: 'from-blue-500/15 via-cyan-500/10 to-transparent',
    borderGlow: 'hover:border-blue-500/50 hover:shadow-blue-500/15'
  },
  {
    id: 'nordic-coffee-roast',
    name: 'Nordic Artisan Roast',
    category: 'Hospitality',
    themeName: 'Cafe Warmth',
    type: 'wifi',
    description: 'Warm roasted oat background with rich espresso dots for instant guest Wi-Fi tent',
    data: {
      ssid: 'Artisan_Roasters_5G',
      password: 'FreshBrewCoffee',
      encryption: 'WPA',
    },
    config: {
      bgColor: '#fef3c7',
      fgColor: '#451a03',
      dotsType: 'classy',
      cornersSquareType: 'extra-rounded',
      cornersDotType: 'dot',
      eyeColor: '#78350f',
      frame: 'table-tent',
      frameTitle: 'ARTISAN ROASTERS • WI-FI',
      frameText: 'TAP TO CONNECT • NO PASSWORD',
      frameColor: '#78350f',
    },
    badge: 'Popular',
    themeGradient: 'from-amber-600/15 via-yellow-500/10 to-transparent',
    borderGlow: 'hover:border-amber-600/50 hover:shadow-amber-600/15'
  },
  {
    id: 'executive-obsidian-vcard',
    name: 'Executive Obsidian vCard',
    category: 'Professional',
    themeName: 'Boardroom Dark',
    type: 'vcard',
    description: 'Obsidian titanium canvas with ice platinum gradient and digital contact saving card',
    data: {
      firstName: 'Elena',
      lastName: 'Rostova',
      organization: 'Vanguard Partners',
      title: 'Managing Partner',
      phone: '+1 (415) 890-2134',
      email: 'elena@vanguard.vc',
      website: 'https://vanguard.vc',
      address: 'One Maritime Plaza, San Francisco, CA'
    },
    config: {
      bgColor: '#0f172a',
      gradient: {
        type: 'linear',
        rotation: 1.57,
        colorStops: [
          { offset: 0, color: '#f8fafc' },
          { offset: 1, color: '#94a3b8' }
        ]
      },
      dotsType: 'square',
      cornersSquareType: 'square',
      cornersDotType: 'square',
      eyeColor: '#38bdf8',
      frame: 'card',
      frameTitle: 'ELENA ROSTOVA • VC PARTNER',
      frameText: 'SCAN TO SAVE DIGITAL VCARD',
      frameColor: '#0284c7',
    },
    badge: 'Executive',
    themeGradient: 'from-slate-500/15 via-sky-500/10 to-transparent',
    borderGlow: 'hover:border-sky-500/50 hover:shadow-sky-500/15'
  },
  {
    id: 'solar-flare-event',
    name: 'Solar Flare Festival',
    category: 'Events',
    themeName: 'Midnight Neon',
    type: 'event',
    description: 'Neon amber & electric tangerine on deep violet with authentic VIP ticket pass notch',
    data: {
      title: 'Solaris Music Festival 2026',
      location: 'Bayside Park Arena, Gate 4',
      startDate: '2026-10-24T18:00',
      endDate: '2026-10-25T02:00',
      description: 'Electronic live sets, light installations, and food trucks.'
    },
    config: {
      bgColor: '#1e1b4b',
      gradient: {
        type: 'linear',
        rotation: 0.785,
        colorStops: [
          { offset: 0, color: '#f97316' },
          { offset: 1, color: '#eab308' }
        ]
      },
      dotsType: 'rounded',
      cornersSquareType: 'extra-rounded',
      cornersDotType: 'dot',
      eyeColor: '#fb923c',
      frame: 'ticket',
      frameTitle: 'SOLARIS 2026 // VIP PASS',
      frameText: 'GATE 4 • ADMIT ONE PASS',
      frameColor: '#ea580c',
    },
    badge: 'Event',
    themeGradient: 'from-orange-500/15 via-purple-500/10 to-transparent',
    borderGlow: 'hover:border-orange-500/50 hover:shadow-orange-500/15'
  },
  {
    id: 'whatsapp-emerald-desk',
    name: 'WhatsApp Support Desk',
    category: 'Customer Care',
    themeName: 'Emerald Chat',
    type: 'whatsapp',
    description: 'Clean mint green theme with verified badge to launch direct chat inquiry',
    data: {
      phone: '15550192834',
      message: 'Hi! I would like to book a private consultation.',
    },
    config: {
      bgColor: '#f0fdf4',
      fgColor: '#047857',
      dotsType: 'dots',
      cornersSquareType: 'extra-rounded',
      cornersDotType: 'dot',
      eyeColor: '#065f46',
      frame: 'social-badge',
      frameTitle: 'SUPPORT HELPDESK',
      frameText: 'CHAT ON WHATSAPP',
      frameColor: '#059669',
    },
    badge: 'Support',
    themeGradient: 'from-emerald-500/15 via-green-500/10 to-transparent',
    borderGlow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/15'
  },
  {
    id: 'swiss-bauhaus-mono',
    name: 'Swiss Bauhaus Minimal',
    category: 'Design & Art',
    themeName: 'Monochrome Grid',
    type: 'url',
    description: 'Ultra-crisp high-contrast architectural grid with geometric square frame',
    data: {
      url: 'https://bauhaus-archive.org/exhibitions',
    },
    config: {
      bgColor: '#fafafa',
      fgColor: '#000000',
      dotsType: 'square',
      cornersSquareType: 'square',
      cornersDotType: 'square',
      eyeColor: '#000000',
      frame: 'simple',
      frameTitle: 'BAUHAUS ARCHIV',
      frameText: 'EXHIBITION ACCESS',
      frameColor: '#000000',
    },
    badge: 'Minimalist',
    themeGradient: 'from-slate-300/15 via-slate-500/10 to-transparent',
    borderGlow: 'hover:border-slate-900/50 hover:shadow-slate-900/15'
  },
  {
    id: 'ruby-flash-sale',
    name: 'Ruby Flash Promotion',
    category: 'Retail & Offers',
    themeName: 'Crimson Spark',
    type: 'url',
    description: 'Vibrant crimson gradient with promotional discount banner for special deals',
    data: {
      url: 'https://mystore.shop/flash-deals-50',
    },
    config: {
      bgColor: '#ffffff',
      gradient: {
        type: 'linear',
        rotation: 0.785,
        colorStops: [
          { offset: 0, color: '#e11d48' },
          { offset: 1, color: '#be123c' }
        ]
      },
      dotsType: 'classy',
      cornersSquareType: 'extra-rounded',
      cornersDotType: 'dot',
      eyeColor: '#9f1239',
      frame: 'promotional',
      frameTitle: 'FLASH SALE TODAY',
      frameText: '50% OFF AT CHECKOUT',
      frameColor: '#e11d48',
    },
    badge: 'Hot Offer',
    themeGradient: 'from-rose-500/15 via-red-500/10 to-transparent',
    borderGlow: 'hover:border-rose-500/50 hover:shadow-rose-500/15'
  },
  {
    id: 'web3-solana-matrix',
    name: 'Solana Matrix Web3',
    category: 'Crypto & Tech',
    themeName: 'Cyber Matrix',
    type: 'text',
    description: 'Futuristic violet-to-emerald gradient on dark space background with wallet card',
    data: {
      text: 'solana:7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?amount=1.5',
    },
    config: {
      bgColor: '#0a0a14',
      gradient: {
        type: 'linear',
        rotation: 0.785,
        colorStops: [
          { offset: 0, color: '#8b5cf6' },
          { offset: 1, color: '#14f195' }
        ]
      },
      dotsType: 'dots',
      cornersSquareType: 'extra-rounded',
      cornersDotType: 'dot',
      eyeColor: '#14f195',
      frame: 'card',
      frameTitle: 'SOLANA PROTOCOL KEY',
      frameText: 'CONNECT WALLET // MINT',
      frameColor: '#8b5cf6',
    },
    badge: 'Web3',
    themeGradient: 'from-purple-500/15 via-emerald-500/10 to-transparent',
    borderGlow: 'hover:border-purple-500/50 hover:shadow-purple-500/15'
  },
  {
    id: 'medcare-hotline-clinic',
    name: 'MedCare Clinical Hotline',
    category: 'Health & Care',
    themeName: 'Sky Medical',
    type: 'phone',
    description: 'Reassuring sky-blue clean theme with direct 24/7 hotline dialer bottom badge',
    data: {
      phone: '+1 (800) 555-0199',
    },
    config: {
      bgColor: '#f0f9ff',
      fgColor: '#0369a1',
      dotsType: 'classy-rounded',
      cornersSquareType: 'extra-rounded',
      cornersDotType: 'dot',
      eyeColor: '#0284c7',
      frame: 'scan-me-bottom',
      frameTitle: 'EMERGENCY CARE',
      frameText: 'TAP 24/7 HELPLINE',
      frameColor: '#0284c7',
    },
    badge: 'Medical',
    themeGradient: 'from-sky-500/15 via-teal-500/10 to-transparent',
    borderGlow: 'hover:border-sky-500/50 hover:shadow-sky-500/15'
  }
];
