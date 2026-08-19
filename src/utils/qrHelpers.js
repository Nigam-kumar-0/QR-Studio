// =========================
// Generic
// =========================

export const formatText = (text) => String(text ?? '');

export const formatUrl = (url) =>
  /^https?:\/\//i.test(url) ? url : `https://${url}`;

export const formatJson = (data) =>
  JSON.stringify(data);


// =========================
// Wi-Fi
// =========================

const escapeWifi = (value = '') =>
  String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/:/g, '\\:');

export const formatWifi = (
  ssid,
  password = '',
  encryption = 'WPA',
  hidden = false
) =>
  `WIFI:T:${encryption};S:${escapeWifi(ssid)};P:${escapeWifi(password)};H:${hidden ? 'true' : 'false'};;`;


// =========================
// Email
// =========================

export const formatEmail = (
  email,
  subject = '',
  body = '',
  cc = '',
  bcc = ''
) => {
  const params = new URLSearchParams();

  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  if (cc) params.set('cc', cc);
  if (bcc) params.set('bcc', bcc);

  const query = params.toString();

  return `mailto:${email}${query ? `?${query}` : ''}`;
};


// =========================
// Phone
// =========================

export const formatPhone = (phone) =>
  `tel:${phone}`;


// =========================
// SMS
// =========================

export const formatSMS = (phone, message = '') =>
  `SMSTO:${phone}:${message}`;

export const formatSMSTel = (phone, message = '') =>
  `sms:${phone}${message ? `?body=${encodeURIComponent(message)}` : ''}`;


// =========================
// vCard Contact
// =========================

export const formatVCard = (
  firstName,
  lastName,
  phone = '',
  email = '',
  company = '',
  title = '',
  website = '',
  address = ''
) => {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${firstName} ${lastName}`.trim(),
    company && `ORG:${company}`,
    title && `TITLE:${title}`,
    phone && `TEL:${phone}`,
    email && `EMAIL:${email}`,
    website && `URL:${website}`,
    address && `ADR:;;${address};;;;`,
    'END:VCARD'
  ]
    .filter(Boolean)
    .join('\n');
};


// =========================
// MECARD Contact
// =========================

export const formatMeCard = ({
  name,
  phone = '',
  email = '',
  address = '',
  note = ''
}) => {
  const escape = (value) =>
    String(value)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/:/g, '\\:')
      .replace(/,/g, '\\,');

  return [
    'MECARD:',
    name && `N:${escape(name)};`,
    phone && `TEL:${escape(phone)};`,
    email && `EMAIL:${escape(email)};`,
    address && `ADR:${escape(address)};`,
    note && `NOTE:${escape(note)};`
  ]
    .filter(Boolean)
    .join('');
};


// =========================
// Location / Geo
// =========================

export const formatGeo = (
  latitude,
  longitude,
  altitude = null
) => {
  const altitudePart =
    altitude !== null ? `,${altitude}` : '';

  return `geo:${latitude},${longitude}${altitudePart}`;
};

export const formatGoogleMaps = (
  latitude,
  longitude,
  label = ''
) => {
  const query = label
    ? encodeURIComponent(label)
    : `${latitude},${longitude}`;

  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

export const formatAppleMaps = (
  latitude,
  longitude,
  label = ''
) => {
  const params = new URLSearchParams({
    ll: `${latitude},${longitude}`
  });

  if (label) params.set('q', label);

  return `https://maps.apple.com/?${params}`;
};


// =========================
// Calendar / Event
// =========================

const formatICSDate = (date) => {
  const d = new Date(date);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    `${d.getUTCFullYear()}` +
    `${pad(d.getUTCMonth() + 1)}` +
    `${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}` +
    `${pad(d.getUTCMinutes())}` +
    `${pad(d.getUTCSeconds())}Z`
  );
};

const escapeICS = (value = '') =>
  String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

export const formatCalendarEvent = ({
  title,
  start,
  end,
  description = '',
  location = '',
  url = '',
  organizer = '',
  uid = `${Date.now()}@qr`
}) => {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//QR Generator//EN',
    'BEGIN:VEVENT',
    `UID:${escapeICS(uid)}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${escapeICS(title)}`,
    description && `DESCRIPTION:${escapeICS(description)}`,
    location && `LOCATION:${escapeICS(location)}`,
    url && `URL:${escapeICS(url)}`,
    organizer && `ORGANIZER:${escapeICS(organizer)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ]
    .filter(Boolean)
    .join('\r\n');
};


// =========================
// Social / Messaging
// =========================

export const formatWhatsApp = (
  phone,
  message = ''
) => {
  const params = message
    ? `?text=${encodeURIComponent(message)}`
    : '';

  return `https://wa.me/${phone.replace(/\D/g, '')}${params}`;
};

export const formatTelegram = (
  username,
  message = ''
) => {
  const user = username.replace(/^@/, '');

  return message
    ? `https://t.me/${user}?text=${encodeURIComponent(message)}`
    : `https://t.me/${user}`;
};

export const formatFacebook = (urlOrUsername) =>
  /^https?:\/\//i.test(urlOrUsername)
    ? urlOrUsername
    : `https://facebook.com/${urlOrUsername.replace(/^@/, '')}`;

export const formatInstagram = (username) =>
  `https://instagram.com/${username.replace(/^@/, '')}`;

export const formatTwitter = (username) =>
  `https://twitter.com/${username.replace(/^@/, '')}`;

export const formatX = (username) =>
  `https://x.com/${username.replace(/^@/, '')}`;

export const formatLinkedIn = (urlOrUsername) =>
  /^https?:\/\//i.test(urlOrUsername)
    ? urlOrUsername
    : `https://linkedin.com/in/${urlOrUsername.replace(/^@/, '')}`;

export const formatYouTube = (url) =>
  formatUrl(url);

export const formatTikTok = (username) =>
  `https://www.tiktok.com/@${username.replace(/^@/, '')}`;


// =========================
// Payment
// =========================

// UPI
export const formatUPI = ({
  vpa,
  name = '',
  amount = '',
  currency = 'INR',
  note = '',
  transactionId = ''
}) => {
  const params = new URLSearchParams();

  params.set('pa', vpa);

  if (name) params.set('pn', name);
  if (amount !== '') params.set('am', amount);
  if (currency) params.set('cu', currency);
  if (note) params.set('tn', note);
  if (transactionId) params.set('tr', transactionId);

  return `upi://pay?${params}`;
};


// Bitcoin URI
export const formatBitcoin = ({
  address,
  amount = '',
  label = '',
  message = ''
}) => {
  const params = new URLSearchParams();

  if (amount) params.set('amount', amount);
  if (label) params.set('label', label);
  if (message) params.set('message', message);

  const query = params.toString();

  return `bitcoin:${address}${query ? `?${query}` : ''}`;
};


// Ethereum
export const formatEthereum = ({
  address,
  value = ''
}) => {
  return value
    ? `ethereum:${address}?value=${value}`
    : `ethereum:${address}`;
};


// =========================
// Cryptocurrency Generic
// =========================

export const formatCrypto = ({
  scheme,
  address,
  amount = '',
  label = '',
  message = ''
}) => {
  const params = new URLSearchParams();

  if (amount) params.set('amount', amount);
  if (label) params.set('label', label);
  if (message) params.set('message', message);

  const query = params.toString();

  return `${scheme}:${address}${query ? `?${query}` : ''}`;
};


// =========================
// App Deep Links
// =========================

export const formatDeepLink = (scheme, path = '') =>
  `${scheme}://${path}`;

export const formatCustomScheme = (scheme, value = '') =>
  `${scheme}:${value}`;


// =========================
// Authentication / OTP
// =========================

export const formatOTPAuth = ({
  type = 'totp',
  secret,
  issuer = '',
  account = '',
  algorithm = 'SHA1',
  digits = 6,
  period = 30
}) => {
  const label = issuer
    ? `${issuer}:${account}`
    : account;

  const params = new URLSearchParams({
    secret,
    algorithm,
    digits: String(digits),
    period: String(period)
  });

  if (issuer) params.set('issuer', issuer);

  return `otpauth://${type}/${encodeURIComponent(label)}?${params}`;
};


// =========================
// Phone Call / Conference
// =========================

export const formatDial = (phone) =>
  `tel:${phone}`;

export const formatConference = ({
  phone,
  pin = ''
}) => {
  return pin
    ? `tel:${phone},,,${pin}#`
    : `tel:${phone}`;
};


// =========================
// Wi-Fi Variants
// =========================

export const formatWifiOpen = (
  ssid,
  hidden = false
) =>
  formatWifi(ssid, '', 'nopass', hidden);

export const formatWifiWEP = (
  ssid,
  password,
  hidden = false
) =>
  formatWifi(ssid, password, 'WEP', hidden);

export const formatWifiWPA = (
  ssid,
  password,
  hidden = false
) =>
  formatWifi(ssid, password, 'WPA', hidden);


// =========================
// URLs / Websites
// =========================

export const formatWebsite = (url) =>
  formatUrl(url);

export const formatYouTubeVideo = (videoId) =>
  `https://www.youtube.com/watch?v=${videoId}`;

export const formatYouTubeChannel = (channel) =>
  `https://www.youtube.com/@${channel.replace(/^@/, '')}`;

export const formatGoogleSearch = (query) =>
  `https://www.google.com/search?q=${encodeURIComponent(query)}`;

export const formatGoogleReview = (placeId) =>
  `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;

export const formatGoogleForm = (url) =>
  formatUrl(url);

export const formatGoogleDrive = (url) =>
  formatUrl(url);


// =========================
// Address / Postal
// =========================

export const formatAddress = ({
  name = '',
  street = '',
  city = '',
  state = '',
  postalCode = '',
  country = ''
}) => {
  return [
    name,
    street,
    city,
    state,
    postalCode,
    country
  ]
    .filter(Boolean)
    .join('\n');
};


// =========================
// Email / Contact vCard
// =========================

export const formatBusinessCard = ({
  firstName,
  lastName,
  phone = '',
  email = '',
  company = '',
  title = '',
  website = '',
  address = ''
}) =>
  formatVCard(
    firstName,
    lastName,
    phone,
    email,
    company,
    title,
    website,
    address
  );


// =========================
// Wi-Fi + Contact + URL
// =========================

export const formatQR = {
  text: formatText,
  url: formatUrl,

  wifi: formatWifi,
  wifiOpen: formatWifiOpen,
  wifiWEP: formatWifiWEP,
  wifiWPA: formatWifiWPA,

  email: formatEmail,
  phone: formatPhone,
  sms: formatSMS,
  smsTel: formatSMSTel,

  vcard: formatVCard,
  mecard: formatMeCard,

  geo: formatGeo,
  googleMaps: formatGoogleMaps,
  appleMaps: formatAppleMaps,

  event: formatCalendarEvent,

  whatsapp: formatWhatsApp,
  telegram: formatTelegram,
  facebook: formatFacebook,
  instagram: formatInstagram,
  twitter: formatTwitter,
  x: formatX,
  linkedin: formatLinkedIn,
  youtube: formatYouTube,
  tiktok: formatTikTok,

  upi: formatUPI,
  bitcoin: formatBitcoin,
  ethereum: formatEthereum,
  crypto: formatCrypto,

  otpAuth: formatOTPAuth,

  deepLink: formatDeepLink,
  customScheme: formatCustomScheme,

  address: formatAddress,

  googleSearch: formatGoogleSearch,
  googleReview: formatGoogleReview,
  googleForm: formatGoogleForm,
  googleDrive: formatGoogleDrive,

  businessCard: formatBusinessCard,

  json: formatJson
};


// =========================
// QR TYPE REGISTRY
// =========================

export const QR_TYPES = [
  {
    id: 'text',
    name: 'Plain Text',
    category: 'General'
  },
  {
    id: 'url',
    name: 'Website URL',
    category: 'General'
  },
  {
    id: 'wifi',
    name: 'Wi-Fi',
    category: 'Connectivity'
  },
  {
    id: 'email',
    name: 'Email',
    category: 'Communication'
  },
  {
    id: 'phone',
    name: 'Phone',
    category: 'Communication'
  },
  {
    id: 'sms',
    name: 'SMS',
    category: 'Communication'
  },
  {
    id: 'vcard',
    name: 'Contact / vCard',
    category: 'Contact'
  },
  {
    id: 'mecard',
    name: 'MECARD',
    category: 'Contact'
  },
  {
    id: 'geo',
    name: 'Location',
    category: 'Location'
  },
  {
    id: 'googleMaps',
    name: 'Google Maps',
    category: 'Location'
  },
  {
    id: 'appleMaps',
    name: 'Apple Maps',
    category: 'Location'
  },
  {
    id: 'event',
    name: 'Calendar Event',
    category: 'Events'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'Social'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'Social'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'Social'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'Social'
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    category: 'Social'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'Social'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'Social'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'Social'
  },
  {
    id: 'upi',
    name: 'UPI Payment',
    category: 'Payments'
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    category: 'Payments'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    category: 'Payments'
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    category: 'Payments'
  },
  {
    id: 'otpAuth',
    name: 'Authenticator / OTP',
    category: 'Security'
  },
  {
    id: 'deepLink',
    name: 'App Deep Link',
    category: 'Apps'
  },
  {
    id: 'customScheme',
    name: 'Custom URI',
    category: 'Advanced'
  },
  {
    id: 'address',
    name: 'Address',
    category: 'General'
  },
  {
    id: 'googleSearch',
    name: 'Google Search',
    category: 'Web'
  },
  {
    id: 'googleReview',
    name: 'Google Review',
    category: 'Business'
  },
  {
    id: 'json',
    name: 'JSON Data',
    category: 'Developer'
  }
];