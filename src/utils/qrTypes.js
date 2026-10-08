export const QR_TYPES = [
  {
    id: 'url',
    name: 'Website URL',
    icon: 'Globe',
    description: 'Link to any website, landing page, or document',
    defaultData: { url: '' }
  },
  {
    id: 'text',
    name: 'Plain Text',
    icon: 'FileText',
    description: 'Display raw text, instructions, or notes',
    defaultData: { text: '' }
  },
  {
    id: 'wifi',
    name: 'Wi-Fi Network',
    icon: 'Wifi',
    description: 'Automatic connection to wireless network',
    defaultData: { ssid: '', password: '', encryption: 'WPA', hidden: false }
  },
  {
    id: 'email',
    name: 'Email Message',
    icon: 'Mail',
    description: 'Pre-addressed email with subject and body',
    defaultData: { email: '', subject: '', body: '' }
  },
  {
    id: 'phone',
    name: 'Phone Call',
    icon: 'Phone',
    description: 'Direct tap-to-call phone number',
    defaultData: { phone: '' }
  },
  {
    id: 'sms',
    name: 'SMS Text',
    icon: 'MessageSquare',
    description: 'Pre-filled text message to a specific number',
    defaultData: { phone: '', message: '' }
  },
  {
    id: 'vcard',
    name: 'Digital Contact (vCard)',
    icon: 'UserCheck',
    description: 'Save full contact card to phone address book',
    defaultData: {
      firstName: '',
      lastName: '',
      organization: '',
      title: '',
      phone: '',
      email: '',
      website: '',
      address: '',
    }
  },
  {
    id: 'location',
    name: 'Location / Maps',
    icon: 'MapPin',
    description: 'Geographic coordinates or destination query',
    defaultData: { latitude: '', longitude: '', query: '' }
  },
  {
    id: 'event',
    name: 'Calendar Event',
    icon: 'Calendar',
    description: 'Add event to Google Calendar, Apple, or Outlook',
    defaultData: {
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
    }
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Chat',
    icon: 'MessageCircle',
    description: 'Start instant WhatsApp conversation with preset message',
    defaultData: { phone: '', message: '' }
  },
  {
    id: 'upi',
    name: 'UPI Payment',
    icon: 'CreditCard',
    description: 'Direct payment via Google Pay, PhonePe, Paytm, BHIM',
    defaultData: { pa: '', pn: '', am: '', tn: '' }
  },
  {
    id: 'social',
    name: 'Social Profile',
    icon: 'Share2',
    description: 'Link directly to Instagram, X, LinkedIn, YouTube, or GitHub',
    defaultData: { platform: 'instagram', username: '' }
  }
];

// Format date for iCalendar VEVENT
function formatICalDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function encodeQRContent(type, data) {
  if (!data) return '';

  switch (type) {
    case 'url': {
      let url = (data.url || '').trim();
      if (!url) return '';
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      return url;
    }

    case 'text':
      return data.text || '';

    case 'wifi': {
      const ssid = (data.ssid || '').replace(/([\\;,:"])/g, '\\$1');
      const pass = (data.password || '').replace(/([\\;,:"])/g, '\\$1');
      const enc = data.encryption || 'WPA';
      const hidden = Boolean(data.hidden);
      return `WIFI:T:${enc};S:${ssid};P:${pass};H:${hidden ? 'true' : 'false'};;`;
    }

    case 'email': {
      const email = encodeURIComponent(data.email || '');
      const subject = encodeURIComponent(data.subject || '');
      const body = encodeURIComponent(data.body || '');
      let mailto = `mailto:${email}`;
      const params = [];
      if (subject) params.push(`subject=${subject}`);
      if (body) params.push(`body=${body}`);
      if (params.length) mailto += `?${params.join('&')}`;
      return mailto;
    }

    case 'phone': {
      const cleanPhone = (data.phone || '').replace(/[^\d+]/g, '');
      return `tel:${cleanPhone}`;
    }

    case 'sms': {
      const phone = (data.phone || '').replace(/[^\d+]/g, '');
      const msg = encodeURIComponent(data.message || '');
      return `sms:${phone}${msg ? `?body=${msg}` : ''}`;
    }

    case 'vcard': {
      const fn = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Contact';
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${data.lastName || ''};${data.firstName || ''};;;`,
        `FN:${fn}`,
        data.organization ? `ORG:${data.organization}` : '',
        data.title ? `TITLE:${data.title}` : '',
        data.phone ? `TEL;TYPE=CELL:${data.phone}` : '',
        data.email ? `EMAIL:${data.email}` : '',
        data.website ? `URL:${data.website}` : '',
        data.address ? `ADR;TYPE=WORK:;;${data.address};;;;` : '',
        'END:VCARD'
      ].filter(Boolean).join('\n');
    }

    case 'location': {
      if (data.query) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.query)}`;
      }
      const lat = (data.latitude || '').trim();
      const lng = (data.longitude || '').trim();
      if (lat && lng) {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
      return '';
    }

    case 'event': {
      const start = formatICalDate(data.startDate);
      const end = formatICalDate(data.endDate);
      return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//QR Studio//EN',
        'BEGIN:VEVENT',
        `SUMMARY:${data.title || 'Event'}`,
        data.location ? `LOCATION:${data.location}` : '',
        data.description ? `DESCRIPTION:${data.description}` : '',
        start ? `DTSTART:${start}` : '',
        end ? `DTEND:${end}` : '',
        'END:VEVENT',
        'END:VCALENDAR'
      ].filter(Boolean).join('\n');
    }

    case 'whatsapp': {
      const phone = (data.phone || '').replace(/[^\d]/g, '');
      const msg = encodeURIComponent(data.message || '');
      return `https://wa.me/${phone}${msg ? `?text=${msg}` : ''}`;
    }

    case 'upi': {
      const pa = (data.pa || '').trim();
      const pn = encodeURIComponent(data.pn || '');
      const am = (data.am || '').trim();
      const tn = encodeURIComponent(data.tn || '');
      let upiStr = `upi://pay?pa=${pa}`;
      if (pn) upiStr += `&pn=${pn}`;
      if (am) upiStr += `&am=${am}`;
      if (tn) upiStr += `&tn=${tn}`;
      upiStr += '&cu=INR';
      return upiStr;
    }

    case 'social': {
      const handle = (data.username || '').replace(/^@/, '').trim();
      if (!handle) return '';
      switch (data.platform) {
        case 'instagram': return `https://instagram.com/${handle}`;
        case 'twitter': return `https://x.com/${handle}`;
        case 'linkedin': return `https://linkedin.com/in/${handle}`;
        case 'github': return `https://github.com/${handle}`;
        case 'youtube': return `https://youtube.com/@${handle}`;
        case 'tiktok': return `https://tiktok.com/@${handle}`;
        default: return `https://${handle}`;
      }
    }

    default:
      return typeof data === 'string' ? data : JSON.stringify(data);
  }
}

// Types that can be dynamic with trackable redirection & editable destinations
export const DYNAMIC_CAPABLE_TYPES = [
  'url', 'social', 'whatsapp', 'location', 'upi', 
  'email', 'phone', 'sms', 'event', 'vcard', 'text'
];

export function isDynamicSupported(type) {
  return DYNAMIC_CAPABLE_TYPES.includes(type);
}

// Get the actual destination URL or action target for dynamic redirect
export function getDynamicTarget(type, data) {
  if (!data) return '';

  switch (type) {
    case 'url':
      return encodeQRContent('url', data);

    case 'social':
      return encodeQRContent('social', data);

    case 'whatsapp':
      return encodeQRContent('whatsapp', data);

    case 'location':
      return encodeQRContent('location', data);

    case 'upi':
      return encodeQRContent('upi', data);

    case 'email':
      return encodeQRContent('email', data);

    case 'phone':
      return encodeQRContent('phone', data);

    case 'sms':
      return encodeQRContent('sms', data);

    case 'event': {
      const title = encodeURIComponent(data.title || 'Event');
      const start = (data.startDate || '').replace(/[-:]/g, '');
      const end = (data.endDate || data.startDate || '').replace(/[-:]/g, '');
      const details = encodeURIComponent(data.description || '');
      const location = encodeURIComponent(data.location || '');
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    }

    case 'vcard': {
      const vcard = encodeQRContent('vcard', data);
      return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`;
    }

    case 'text':
      return `data:text/plain;charset=utf-8,${encodeURIComponent(data.text || '')}`;

    default:
      return encodeQRContent(type, data);
  }
}

/**
 * Validates whether the required content for a given QR type is filled by the user.
 */
export function isStep1Filled(type, data) {
  if (!data) return false;
  switch (type) {
    case 'url': {
      const clean = (data.url || '').replace(/^https?:\/\//i, '').trim();
      return clean.length > 0;
    }
    case 'text':
      return Boolean(data.text && data.text.trim().length > 0);
    case 'wifi':
      return Boolean(data.ssid && data.ssid.trim().length > 0);
    case 'email':
      return Boolean(data.email && data.email.trim().length > 0);
    case 'phone':
      return Boolean(data.phone && data.phone.trim().length > 0);
    case 'sms':
      return Boolean(data.phone && data.phone.trim().length > 0);
    case 'vcard':
      return Boolean(
        (data.firstName && data.firstName.trim().length > 0) ||
        (data.lastName && data.lastName.trim().length > 0) ||
        (data.phone && data.phone.trim().length > 0) ||
        (data.email && data.email.trim().length > 0) ||
        (data.organization && data.organization.trim().length > 0)
      );
    case 'whatsapp':
      return Boolean(data.phone && data.phone.trim().length > 0);
    case 'upi':
      return Boolean(data.pa && data.pa.trim().length > 0);
    case 'social':
      return Boolean(data.username && data.username.trim().length > 0);
    case 'location':
      return Boolean(
        (data.query && data.query.trim().length > 0) ||
        (data.latitude && data.longitude)
      );
    case 'event':
      return Boolean(data.title && data.title.trim().length > 0);
    default:
      return Boolean(data.url || data.text);
  }
}

/**
 * Returns a user-friendly validation error message if required content is missing.
 */
export function getStep1ValidationError(type, data) {
  if (isStep1Filled(type, data)) return null;
  switch (type) {
    case 'url':
      return 'Please enter a website URL before proceeding.';
    case 'text':
      return 'Please enter some text content before proceeding.';
    case 'wifi':
      return 'Please enter a Wi-Fi network name (SSID) before proceeding.';
    case 'email':
      return 'Please enter a recipient email address before proceeding.';
    case 'phone':
      return 'Please enter a phone number before proceeding.';
    case 'sms':
      return 'Please enter a recipient phone number for the SMS before proceeding.';
    case 'vcard':
      return 'Please enter at least a name, phone, or email for the contact card before proceeding.';
    case 'whatsapp':
      return 'Please enter a WhatsApp phone number with country code before proceeding.';
    case 'upi':
      return 'Please enter a UPI ID (VPA) before proceeding.';
    case 'social':
      return 'Please enter a username or profile link before proceeding.';
    case 'location':
      return 'Please enter a location or address before proceeding.';
    case 'event':
      return 'Please enter an event title before proceeding.';
    default:
      return 'Please fill in the required information before proceeding.';
  }
}

