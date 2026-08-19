import { useMemo, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useQRCodes } from '../hooks/useQRCodes';
import { useAuth } from '../hooks/useAuth';
import {
  formatUrl,
  formatWifi,
  formatEmail,
  formatPhone,
  formatSMS,
  formatVCard,
  formatMeCard,
  formatGeo,
  formatGoogleMaps,
  formatAppleMaps,
  formatCalendarEvent,
  formatWhatsApp,
  formatTelegram,
  formatFacebook,
  formatInstagram,
  formatTwitter,
  formatLinkedIn,
  formatYouTube,
  formatTikTok,
  formatUPI,
  formatBitcoin,
  formatEthereum,
  formatCrypto,
  formatOTPAuth,
  formatDeepLink,
  formatCustomScheme,
  formatAddress,
  formatGoogleSearch,
  formatGoogleReview,
  formatGoogleForm,
  formatGoogleDrive,
  formatJson,
  QR_TYPES,
} from '../utils/qrHelpers';

import Card from '../components/ui/Card';
import InputField from '../components/ui/InputField';
import Button from '../components/ui/Button';
import QRCodePreview from '../components/qr/QRCodePreview';


/* =========================================================
   DESIGN
========================================================= */

const INITIAL_DESIGN = {
  // Export resolution, NOT preview size
  size: 500,

  fgColor: '#000000',
  bgColor: '#ffffff',

  logo: '',
  logoSize: 0.20,

  errorLevel: 'H',

  includeMargin: true,
  marginSize: 4,

  title: '',
  subtitle: '',

  frame: false,
  frameColor: '#ffffff',
  frameRadius: 'rounded',

  // Preview only
  previewMaxSize: 340,
};


/* =========================================================
   DESIGN PRESETS
========================================================= */

const DESIGN_PRESETS = {
  classic: {
    label: 'Classic',
    fgColor: '#000000',
    bgColor: '#ffffff',
    errorLevel: 'M',
    marginSize: 4,
    includeMargin: true,
    frame: false,
    frameRadius: 'rounded',
  },

  professional: {
    label: 'Professional',
    fgColor: '#111827',
    bgColor: '#ffffff',
    errorLevel: 'H',
    marginSize: 4,
    includeMargin: true,
    frame: true,
    frameColor: '#ffffff',
    frameRadius: 'rounded',
  },

  modern: {
    label: 'Modern',
    fgColor: '#2563eb',
    bgColor: '#ffffff',
    errorLevel: 'H',
    marginSize: 4,
    includeMargin: true,
    frame: true,
    frameColor: '#ffffff',
    frameRadius: 'rounded',
  },

  dark: {
    label: 'Dark',
    fgColor: '#ffffff',
    bgColor: '#111827',
    errorLevel: 'H',
    marginSize: 4,
    includeMargin: true,
    frame: true,
    frameColor: '#111827',
    frameRadius: 'rounded',
  },
};


/* =========================================================
   DATA
========================================================= */

const INITIAL_DATA = {
  URL: {
    url: '',
  },

  TEXT: {
    text: '',
  },

  WIFI: {
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
  },

  EMAIL: {
    email: '',
    subject: '',
    body: '',
    cc: '',
    bcc: '',
  },

  PHONE: {
    phone: '',
  },

  SMS: {
    phone: '',
    message: '',
  },

  VCARD: {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    company: '',
    title: '',
    website: '',
    address: '',
  },

  MECARD: {
    name: '',
    phone: '',
    email: '',
    address: '',
    note: '',
  },

  GEO: {
    latitude: '',
    longitude: '',
    altitude: '',
  },

  GOOGLE_MAPS: {
    latitude: '',
    longitude: '',
    label: '',
  },

  EVENT: {
    title: '',
    start: '',
    end: '',
    description: '',
    location: '',
    url: '',
  },

  WHATSAPP: {
    phone: '',
    message: '',
  },

  TELEGRAM: {
    username: '',
    message: '',
  },

  FACEBOOK: {
    username: '',
  },

  INSTAGRAM: {
    username: '',
  },

  TWITTER: {
    username: '',
  },

  LINKEDIN: {
    username: '',
  },

  YOUTUBE: {
    url: '',
  },

  TIKTOK: {
    username: '',
  },

  UPI: {
    vpa: '',
    name: '',
    amount: '',
    currency: 'INR',
    note: '',
    transactionId: '',
  },

  CRYPTO: {
    scheme: 'bitcoin',
    address: '',
    amount: '',
    label: '',
    message: '',
  },

  ADDRESS: {
    name: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  },
};


/* =========================================================
   TYPE GROUPS
========================================================= */

const TYPE_GROUPS = {
  General: [
    'TEXT',
    'URL',
    'ADDRESS',
  ],

  Connectivity: [
    'WIFI',
  ],

  Communication: [
    'EMAIL',
    'PHONE',
    'SMS',
  ],

  Contact: [
    'VCARD',
    'MECARD',
  ],

  Location: [
    'GEO',
    'GOOGLE_MAPS',
  ],

  Events: [
    'EVENT',
  ],

  Social: [
    'WHATSAPP',
    'TELEGRAM',
    'FACEBOOK',
    'INSTAGRAM',
    'TWITTER',
    'LINKEDIN',
    'YOUTUBE',
    'TIKTOK',
  ],

  Payments: [
    'UPI',
    'CRYPTO',
  ],
};


/* =========================================================
   COMPONENT
========================================================= */

export default function GenerateStudio() {
  const { user } = useAuth();

  const {
    addQRCode,
  } = useQRCodes(user?.uid);

  const [activeTab, setActiveTab] = useState('URL');

  const [data, setData] = useState(INITIAL_DATA);

  const [design, setDesign] = useState(INITIAL_DESIGN);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');


  /* =======================================================
     DATA HELPERS
  ======================================================= */

  const updateData = (field, value) => {
    setData((previous) => ({
      ...previous,

      [activeTab]: {
        ...previous[activeTab],
        [field]: value,
      },
    }));
  };

  const handleSaveToCollection = async () => {
    if (!user) {
      setSaveMessage(
        'Please sign in before saving QR codes.'
      );
      return;
    }

    if (!qrValue) {
      setSaveMessage(
        'Please enter data for the QR code first.'
      );
      return;
    }

    try {
      setSaving(true);
      setSaveMessage('');

      await addQRCode({
        title:
          design.title?.trim() ||
          `${getTypeName()} QR`,

        qrData: qrValue,

        type: activeTab,

        design: {
          ...design,
        },

        sourceData: {
          ...currentData,
        },
      });

      setSaveMessage(
        'QR code saved to your collection!'
      );
    } catch (error) {
      console.error(
        'Save QR error:',
        error
      );

      setSaveMessage(
        error?.message ||
        'Failed to save QR code.'
      );
    } finally {
      setSaving(false);
    }
  };


  const currentData = data[activeTab];


  /* =======================================================
     QR VALUE
  ======================================================= */

  const qrValue = useMemo(() => {
    const d = currentData;

    try {
      switch (activeTab) {
        case 'TEXT':
          return d.text;

        case 'URL':
          return d.url ? formatUrl(d.url) : '';

        case 'WIFI':
          return d.ssid
            ? formatWifi(
              d.ssid,
              d.password,
              d.encryption,
              d.hidden
            )
            : '';

        case 'EMAIL':
          return d.email
            ? formatEmail(
              d.email,
              d.subject,
              d.body,
              d.cc,
              d.bcc
            )
            : '';

        case 'PHONE':
          return d.phone
            ? formatPhone(d.phone)
            : '';

        case 'SMS':
          return d.phone
            ? formatSMS(d.phone, d.message)
            : '';

        case 'VCARD':
          return (
            d.firstName ||
            d.lastName ||
            d.phone ||
            d.email
          )
            ? formatVCard(
              d.firstName,
              d.lastName,
              d.phone,
              d.email,
              d.company,
              d.title,
              d.website,
              d.address
            )
            : '';

        case 'MECARD':
          return d.name
            ? formatMeCard(d)
            : '';

        case 'GEO':
          return d.latitude && d.longitude
            ? formatGeo(
              d.latitude,
              d.longitude,
              d.altitude || null
            )
            : '';

        case 'GOOGLE_MAPS':
          return d.latitude && d.longitude
            ? formatGoogleMaps(
              d.latitude,
              d.longitude,
              d.label
            )
            : '';

        case 'APPLE_MAPS':
          return d.latitude && d.longitude
            ? formatAppleMaps(
              d.latitude,
              d.longitude,
              d.label
            )
            : '';

        case 'EVENT':
          return d.title && d.start && d.end
            ? formatCalendarEvent(d)
            : '';

        case 'WHATSAPP':
          return d.phone
            ? formatWhatsApp(d.phone, d.message)
            : '';

        case 'TELEGRAM':
          return d.username
            ? formatTelegram(d.username, d.message)
            : '';

        case 'FACEBOOK':
          return d.username
            ? formatFacebook(d.username)
            : '';

        case 'INSTAGRAM':
          return d.username
            ? formatInstagram(d.username)
            : '';

        case 'TWITTER':
          return d.username
            ? formatTwitter(d.username)
            : '';

        case 'LINKEDIN':
          return d.username
            ? formatLinkedIn(d.username)
            : '';

        case 'YOUTUBE':
          return d.url
            ? formatYouTube(d.url)
            : '';

        case 'TIKTOK':
          return d.username
            ? formatTikTok(d.username)
            : '';

        case 'UPI':
          return d.vpa
            ? formatUPI(d)
            : '';

        case 'BITCOIN':
          return d.address
            ? formatBitcoin(d)
            : '';

        case 'ETHEREUM':
          return d.address
            ? formatEthereum(d)
            : '';

        case 'CRYPTO':
          return d.address
            ? formatCrypto(d)
            : '';

        case 'OTPAUTH':
          return d.secret && d.account
            ? formatOTPAuth(d)
            : '';

        case 'DEEPLINK':
          return d.scheme
            ? formatDeepLink(d.scheme, d.path)
            : '';

        case 'CUSTOM':
          return d.scheme
            ? formatCustomScheme(d.scheme, d.value)
            : '';

        case 'ADDRESS':
          return d.street ||
            d.city ||
            d.postalCode
            ? formatAddress(d)
            : '';

        case 'GOOGLE_SEARCH':
          return d.query
            ? formatGoogleSearch(d.query)
            : '';

        case 'GOOGLE_REVIEW':
          return d.placeId
            ? formatGoogleReview(d.placeId)
            : '';

        case 'GOOGLE_FORM':
          return d.url
            ? formatGoogleForm(d.url)
            : '';

        case 'GOOGLE_DRIVE':
          return d.url
            ? formatGoogleDrive(d.url)
            : '';

        case 'JSON':
          return d.json
            ? formatJson(d.json)
            : '';

        default:
          return '';
      }
    } catch (error) {
      console.error('QR formatting error:', error);

      return '';
    }
  }, [activeTab, currentData]);


  /* =======================================================
     TYPE NAME
  ======================================================= */

  const getTypeName = () => {
    const type = QR_TYPES.find(
      (item) =>
        item.id?.toUpperCase() === activeTab
    );

    return type?.name || activeTab;
  };


  /* =======================================================
     FORM INPUT
  ======================================================= */

  const renderInput = (
    field,
    label,
    options = {}
  ) => {
    return (
      <InputField
        label={label}
        value={currentData[field] ?? ''}
        onChange={(e) =>
          updateData(
            field,
            e.target.value
          )
        }
        {...options}
      />
    );
  };


  /* =======================================================
     FORM
  ======================================================= */

  const renderForm = () => {
    switch (activeTab) {
      case 'TEXT':
        return (
          <textarea
            value={currentData.text}
            onChange={(e) =>
              updateData(
                'text',
                e.target.value
              )
            }
            placeholder="Enter any text..."
            rows={6}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        );


      case 'URL':
        return renderInput(
          'url',
          'Website URL',
          {
            placeholder:
              'https://your-website.com',
            type: 'url',
          }
        );


      case 'WIFI':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {renderInput(
                'ssid',
                'Network Name (SSID)',
                {
                  placeholder: 'My Wi-Fi',
                }
              )}

              {renderInput(
                'password',
                'Password',
                {
                  type: 'password',
                  placeholder:
                    'Wi-Fi password',
                }
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Encryption
              </label>

              <select
                value={currentData.encryption}
                onChange={(e) =>
                  updateData(
                    'encryption',
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              >
                <option value="WPA">
                  WPA / WPA2 / WPA3
                </option>

                <option value="WEP">
                  WEP
                </option>

                <option value="nopass">
                  Open / No Password
                </option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={currentData.hidden}
                onChange={(e) =>
                  updateData(
                    'hidden',
                    e.target.checked
                  )
                }
              />

              Hidden network
            </label>
          </div>
        );


      case 'EMAIL':
        return (
          <div className="space-y-4">
            {renderInput(
              'email',
              'Email Address',
              {
                type: 'email',
                placeholder:
                  'hello@example.com',
              }
            )}

            {renderInput(
              'subject',
              'Subject',
              {
                placeholder: 'Hello',
              }
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Message
              </label>

              <textarea
                value={currentData.body}
                onChange={(e) =>
                  updateData(
                    'body',
                    e.target.value
                  )
                }
                rows={4}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                placeholder="Email message..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {renderInput('cc', 'CC')}
              {renderInput('bcc', 'BCC')}
            </div>
          </div>
        );


      case 'PHONE':
        return renderInput(
          'phone',
          'Phone Number',
          {
            type: 'tel',
            placeholder:
              '+91 9876543210',
          }
        );


      case 'SMS':
        return (
          <div className="space-y-4">
            {renderInput(
              'phone',
              'Phone Number',
              {
                type: 'tel',
                placeholder:
                  '+91 9876543210',
              }
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Message
              </label>

              <textarea
                value={currentData.message}
                onChange={(e) =>
                  updateData(
                    'message',
                    e.target.value
                  )
                }
                rows={4}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm"
              />
            </div>
          </div>
        );


      case 'VCARD':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {renderInput(
                'firstName',
                'First Name'
              )}

              {renderInput(
                'lastName',
                'Last Name'
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {renderInput(
                'phone',
                'Phone',
                {
                  type: 'tel',
                }
              )}

              {renderInput(
                'email',
                'Email',
                {
                  type: 'email',
                }
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {renderInput(
                'company',
                'Company'
              )}

              {renderInput(
                'title',
                'Job Title'
              )}
            </div>

            {renderInput(
              'website',
              'Website'
            )}

            {renderInput(
              'address',
              'Address'
            )}
          </div>
        );


      case 'MECARD':
        return (
          <div className="space-y-4">
            {renderInput(
              'name',
              'Full Name'
            )}

            {renderInput(
              'phone',
              'Phone'
            )}

            {renderInput(
              'email',
              'Email'
            )}

            {renderInput(
              'address',
              'Address'
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Note
              </label>

              <textarea
                value={currentData.note}
                onChange={(e) =>
                  updateData(
                    'note',
                    e.target.value
                  )
                }
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm"
              />
            </div>
          </div>
        );


      case 'GEO':
      case 'GOOGLE_MAPS':
      case 'APPLE_MAPS':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {renderInput(
                'latitude',
                'Latitude',
                {
                  type: 'number',
                  placeholder:
                    '28.6139',
                }
              )}

              {renderInput(
                'longitude',
                'Longitude',
                {
                  type: 'number',
                  placeholder:
                    '77.2090',
                }
              )}
            </div>

            {activeTab === 'GEO' &&
              renderInput(
                'altitude',
                'Altitude (optional)',
                {
                  type: 'number',
                }
              )}

            {activeTab !== 'GEO' &&
              renderInput(
                'label',
                'Location Label',
                {
                  placeholder:
                    'My Location',
                }
              )}
          </div>
        );


      case 'EVENT':
        return (
          <div className="space-y-4">
            {renderInput(
              'title',
              'Event Title',
              {
                placeholder:
                  'Team Meeting',
              }
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {renderInput(
                'start',
                'Start',
                {
                  type:
                    'datetime-local',
                }
              )}

              {renderInput(
                'end',
                'End',
                {
                  type:
                    'datetime-local',
                }
              )}
            </div>

            {renderInput(
              'location',
              'Location'
            )}

            {renderInput(
              'url',
              'Event URL'
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                value={
                  currentData.description
                }
                onChange={(e) =>
                  updateData(
                    'description',
                    e.target.value
                  )
                }
                rows={4}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm"
              />
            </div>
          </div>
        );


      case 'WHATSAPP':
        return (
          <div className="space-y-4">
            {renderInput(
              'phone',
              'WhatsApp Number',
              {
                type: 'tel',
                placeholder:
                  '919876543210',
              }
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Message
              </label>

              <textarea
                value={currentData.message}
                onChange={(e) =>
                  updateData(
                    'message',
                    e.target.value
                  )
                }
                rows={4}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm"
              />
            </div>
          </div>
        );


      case 'TELEGRAM':
        return (
          <div className="space-y-4">
            {renderInput(
              'username',
              'Telegram Username',
              {
                placeholder:
                  '@username',
              }
            )}

            {renderInput(
              'message',
              'Message',
              {
                placeholder:
                  'Hello!',
              }
            )}
          </div>
        );


      case 'FACEBOOK':
      case 'INSTAGRAM':
      case 'TWITTER':
      case 'LINKEDIN':
      case 'TIKTOK':
        return renderInput(
          'username',
          'Username',
          {
            placeholder:
              '@username',
          }
        );


      case 'YOUTUBE':
        return renderInput(
          'url',
          'YouTube URL',
          {
            placeholder:
              'https://youtube.com/watch?v=...',
          }
        );


      case 'UPI':
        return (
          <div className="space-y-4">
            {renderInput(
              'vpa',
              'UPI ID / VPA',
              {
                placeholder:
                  'name@upi',
              }
            )}

            {renderInput(
              'name',
              'Payee Name'
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {renderInput(
                'amount',
                'Amount',
                {
                  type: 'number',
                  placeholder:
                    '100',
                }
              )}

              {renderInput(
                'currency',
                'Currency',
                {
                  placeholder:
                    'INR',
                }
              )}
            </div>

            {renderInput(
              'transactionId',
              'Transaction ID'
            )}

            {renderInput(
              'note',
              'Payment Note'
            )}
          </div>
        );


      case 'BITCOIN':
        return (
          <div className="space-y-4">
            {renderInput(
              'address',
              'Bitcoin Address',
              {
                placeholder:
                  'bc1...',
              }
            )}

            {renderInput(
              'amount',
              'Amount',
              {
                type: 'number',
              }
            )}

            {renderInput(
              'label',
              'Label'
            )}

            {renderInput(
              'message',
              'Message'
            )}
          </div>
        );


      case 'ETHEREUM':
        return (
          <div className="space-y-4">
            {renderInput(
              'address',
              'Ethereum Address',
              {
                placeholder:
                  '0x...',
              }
            )}

            {renderInput(
              'value',
              'Value',
              {
                type: 'number',
              }
            )}
          </div>
        );


      case 'CRYPTO':
        return (
          <div className="space-y-4">
            {renderInput(
              'scheme',
              'Crypto Scheme',
              {
                placeholder:
                  'bitcoin',
              }
            )}

            {renderInput(
              'address',
              'Wallet Address'
            )}

            {renderInput(
              'amount',
              'Amount'
            )}

            {renderInput(
              'label',
              'Label'
            )}

            {renderInput(
              'message',
              'Message'
            )}
          </div>
        );


      case 'OTPAUTH':
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Type
              </label>

              <select
                value={currentData.type}
                onChange={(e) =>
                  updateData(
                    'type',
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              >
                <option value="totp">
                  TOTP
                </option>

                <option value="hotp">
                  HOTP
                </option>
              </select>
            </div>

            {renderInput(
              'secret',
              'Secret Key'
            )}

            {renderInput(
              'issuer',
              'Issuer',
              {
                placeholder:
                  'My Company',
              }
            )}

            {renderInput(
              'account',
              'Account',
              {
                placeholder:
                  'user@example.com',
              }
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {renderInput(
                'algorithm',
                'Algorithm'
              )}

              {renderInput(
                'digits',
                'Digits',
                {
                  type: 'number',
                }
              )}

              {renderInput(
                'period',
                'Period',
                {
                  type: 'number',
                }
              )}
            </div>
          </div>
        );


      case 'DEEPLINK':
        return (
          <div className="space-y-4">
            {renderInput(
              'scheme',
              'App Scheme',
              {
                placeholder:
                  'myapp',
              }
            )}

            {renderInput(
              'path',
              'Path',
              {
                placeholder:
                  'products/123',
              }
            )}
          </div>
        );


      case 'CUSTOM':
        return (
          <div className="space-y-4">
            {renderInput(
              'scheme',
              'URI Scheme',
              {
                placeholder:
                  'myapp',
              }
            )}

            {renderInput(
              'value',
              'Value'
            )}
          </div>
        );


      case 'ADDRESS':
        return (
          <div className="space-y-4">
            {renderInput(
              'name',
              'Name'
            )}

            {renderInput(
              'street',
              'Street'
            )}

            {renderInput(
              'city',
              'City'
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {renderInput(
                'state',
                'State'
              )}

              {renderInput(
                'postalCode',
                'Postal Code'
              )}
            </div>

            {renderInput(
              'country',
              'Country'
            )}
          </div>
        );


      case 'GOOGLE_SEARCH':
        return renderInput(
          'query',
          'Search Query',
          {
            placeholder:
              'Best restaurants near me',
          }
        );


      case 'GOOGLE_REVIEW':
        return renderInput(
          'placeId',
          'Google Place ID',
          {
            placeholder:
              'ChIJ...',
          }
        );


      case 'GOOGLE_FORM':
      case 'GOOGLE_DRIVE':
        return renderInput(
          'url',
          'URL',
          {
            type: 'url',
            placeholder:
              'https://...',
          }
        );


      case 'JSON':
        return (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              JSON Data
            </label>

            <textarea
              value={currentData.json}
              onChange={(e) =>
                updateData(
                  'json',
                  e.target.value
                )
              }
              rows={8}
              placeholder={`{
  "name": "John",
  "id": 123
}`}
              className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm"
            />
          </div>
        );


      default:
        return null;
    }
  };


  /* =======================================================
     DESIGN HELPERS
  ======================================================= */

  const applyPreset = (preset) => {
    setDesign((previous) => ({
      ...previous,
      ...preset,
    }));
  };


  const applyColors = (fgColor, bgColor) => {
    setDesign((previous) => ({
      ...previous,
      fgColor,
      bgColor,
    }));
  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="mx-auto max-w-7xl min-w-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          QR Studio
        </h1>

        <p className="mt-2 text-gray-600">
          Create, customize, and generate QR codes
          for links, payments, contacts, Wi-Fi,
          events, social media, and more.
        </p>
      </div>


      <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-12">


        {/* =================================================
            LEFT CONFIGURATION
        ================================================= */}

        <div className="min-w-0 space-y-6 lg:col-span-7">


          {/* =================================================
              DATA TYPE
          ================================================= */}

          <Card className="min-w-0 p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                1. Choose Data Type
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select what you want your QR code
                to contain.
              </p>
            </div>


            <div className="mb-5 overflow-x-auto border-b border-gray-200 pb-2">
              <div className="flex min-w-max gap-4">
                {Object.keys(TYPE_GROUPS).map(
                  (category) => (
                    <span
                      key={category}
                      className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400"
                    >
                      {category}
                    </span>
                  )
                )}
              </div>
            </div>


            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(TYPE_GROUPS).flatMap(
                ([category, types]) =>
                  types.map((type) => {
                    const item =
                      QR_TYPES.find(
                        (x) =>
                          x.id?.toUpperCase() ===
                          type
                      );

                    const label =
                      item?.name ||
                      type.replaceAll(
                        '_',
                        ' '
                      );

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setActiveTab(type)
                        }
                        className={[
                          'rounded-xl border p-3 text-left',
                          'transition-all',
                          activeTab === type
                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                        ].join(' ')}
                      >
                        <div className="text-sm font-medium">
                          {label}
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          {category}
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </Card>


          {/* =================================================
              DATA FORM
          ================================================= */}

          <Card className="min-w-0 p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                2. {getTypeName()}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter the information you want
                to encode.
              </p>
            </div>

            {renderForm()}
          </Card>


          {/* =================================================
              DESIGN
          ================================================= */}

          <Card className="min-w-0 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                3. Customize Design
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose a style first, then fine-tune
                colors, quality, logo, and scanning
                settings.
              </p>
            </div>


            <div className="space-y-8">


              {/* =================================================
                  PRESETS
              ================================================= */}

              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Design Style
                </label>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(
                    DESIGN_PRESETS
                  ).map(
                    ([key, preset]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          applyPreset(
                            preset
                          )
                        }
                        className="rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-gray-300 hover:bg-gray-50"
                      >
                        <div
                          className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border"
                          style={{
                            backgroundColor:
                              preset.bgColor,
                            borderColor:
                              preset.fgColor,
                          }}
                        >
                          <div
                            className="h-4 w-4 rounded-sm"
                            style={{
                              backgroundColor:
                                preset.fgColor,
                            }}
                          />
                        </div>

                        <div className="text-sm font-semibold text-gray-800">
                          {preset.label}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>


              {/* =================================================
                  COLORS
              ================================================= */}

              <div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">


                  {/* Foreground */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      QR Color
                    </label>

                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={design.fgColor}
                        onChange={(e) =>
                          setDesign({
                            ...design,
                            fgColor:
                              e.target.value,
                          })
                        }
                        className="h-10 w-10 cursor-pointer rounded border-0 p-0"
                      />

                      <span className="font-mono text-sm text-gray-500">
                        {design.fgColor}
                      </span>
                    </div>
                  </div>


                  {/* Background */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Background
                    </label>

                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={design.bgColor}
                        onChange={(e) =>
                          setDesign({
                            ...design,
                            bgColor:
                              e.target.value,
                          })
                        }
                        className="h-10 w-10 cursor-pointer rounded border-0 p-0"
                      />

                      <span className="font-mono text-sm text-gray-500">
                        {design.bgColor}
                      </span>
                    </div>
                  </div>
                </div>


                {/* Quick colors */}
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-gray-500">
                    Quick combinations
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {[
                      [
                        '#000000',
                        '#ffffff',
                      ],
                      [
                        '#111827',
                        '#ffffff',
                      ],
                      [
                        '#2563eb',
                        '#ffffff',
                      ],
                      [
                        '#166534',
                        '#ffffff',
                      ],
                      [
                        '#ffffff',
                        '#111827',
                      ],
                    ].map(
                      ([fg, bg]) => (
                        <button
                          key={`${fg}-${bg}`}
                          type="button"
                          onClick={() =>
                            applyColors(
                              fg,
                              bg
                            )
                          }
                          className="h-9 w-9 rounded-full border border-gray-300 p-1"
                          title={`${fg} on ${bg}`}
                        >
                          <span
                            className="flex h-full w-full items-center justify-center rounded-full"
                            style={{
                              backgroundColor:
                                bg,
                            }}
                          >
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor:
                                  fg,
                              }}
                            />
                          </span>
                        </button>
                      )
                    )}
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    Strong contrast gives the most
                    reliable scanning.
                  </p>
                </div>
              </div>


              {/* =================================================
                  EXPORT QUALITY
              ================================================= */}

              <div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Export Quality
                  </label>

                  <p className="mt-1 text-xs text-gray-500">
                    This controls the downloaded image
                    resolution. The live preview stays
                    responsive.
                  </p>
                </div>


                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    {
                      value: 300,
                      label: 'Small',
                      description:
                        '300px',
                    },

                    {
                      value: 500,
                      label: 'Standard',
                      description:
                        '500px',
                    },

                    {
                      value: 1000,
                      label: 'High',
                      description:
                        '1000px',
                    },

                    {
                      value: 2000,
                      label: 'Print',
                      description:
                        '2000px',
                    },
                  ].map(
                    (option) => {
                      const active =
                        design.size ===
                        option.value;

                      return (
                        <button
                          key={
                            option.value
                          }
                          type="button"
                          onClick={() =>
                            setDesign({
                              ...design,
                              size:
                                option.value,
                            })
                          }
                          className={[
                            'rounded-xl border p-3 text-left transition-all',
                            active
                              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                          ].join(' ')}
                        >
                          <div
                            className={[
                              'text-sm font-semibold',
                              active
                                ? 'text-blue-700'
                                : 'text-gray-800',
                            ].join(' ')}
                          >
                            {
                              option.label
                            }
                          </div>

                          <div className="mt-1 text-xs text-gray-500">
                            {
                              option.description
                            }
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>


              {/* =================================================
                  SCANNING
              ================================================= */}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">


                {/* Error correction */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Error Correction
                  </label>

                  <select
                    value={
                      design.errorLevel
                    }
                    onChange={(e) =>
                      setDesign({
                        ...design,
                        errorLevel:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  >
                    <option value="L">
                      L — Low
                    </option>

                    <option value="M">
                      M — Medium
                    </option>

                    <option value="Q">
                      Q — Quartile
                    </option>

                    <option value="H">
                      H — High
                    </option>
                  </select>

                  <p className="mt-2 text-xs text-gray-400">
                    High is recommended when using a
                    center logo.
                  </p>
                </div>


                {/* Margin */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Quiet Zone
                  </label>

                  <select
                    value={
                      design.marginSize
                    }
                    onChange={(e) =>
                      setDesign({
                        ...design,
                        marginSize:
                          Number(
                            e.target.value
                          ),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  >
                    <option value="0">
                      None
                    </option>

                    <option value="2">
                      Small
                    </option>

                    <option value="4">
                      Normal
                    </option>

                    <option value="6">
                      Large
                    </option>
                  </select>
                </div>
              </div>


              {/* =================================================
                  LOGO
              ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Center Logo
                </label>

                <InputField
                  label=""
                  value={design.logo}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      logo: e.target.value,
                    })
                  }
                  placeholder="https://example.com/logo.png"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Use a square PNG with a transparent
                  background for best results.
                </p>
              </div>


              {/* Logo size */}
              {design.logo && (
                <div>
                  <div className="mb-2 flex justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Logo Size
                    </label>

                    <span className="text-sm text-gray-500">
                      {Math.round(
                        design.logoSize *
                        100
                      )}
                      %
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.10"
                    max="0.25"
                    step="0.01"
                    value={
                      design.logoSize
                    }
                    onChange={(e) =>
                      setDesign({
                        ...design,
                        logoSize:
                          Number(
                            e.target.value
                          ),
                      })
                    }
                    className="w-full accent-blue-600"
                  />

                  <div className="mt-1 flex justify-between text-[11px] text-gray-400">
                    <span>10%</span>
                    <span>
                      Recommended: 20%
                    </span>
                    <span>25%</span>
                  </div>
                </div>
              )}


              {/* =================================================
                  PRESENTATION
              ================================================= */}

              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Presentation
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Optional text and preview styling.
                  </p>
                </div>


                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {renderInput(
                    'title',
                    'Title',
                    {
                      value:
                        design.title,
                      onChange: (e) =>
                        setDesign({
                          ...design,
                          title:
                            e.target.value,
                        }),
                      placeholder:
                        'Scan to visit',
                    }
                  )}

                  {renderInput(
                    'subtitle',
                    'Subtitle',
                    {
                      value:
                        design.subtitle,
                      onChange: (e) =>
                        setDesign({
                          ...design,
                          subtitle:
                            e.target.value,
                        }),
                      placeholder:
                        'Open this QR code',
                    }
                  )}
                </div>


                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">


                  {/* Frame */}
                  <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <input
                      type="checkbox"
                      checked={
                        design.frame
                      }
                      onChange={(e) =>
                        setDesign({
                          ...design,
                          frame:
                            e.target
                              .checked,
                        })
                      }
                      className="mt-0.5"
                    />

                    <span>
                      <span className="block text-sm font-medium text-gray-700">
                        Preview frame
                      </span>

                      <span className="mt-0.5 block text-xs text-gray-400">
                        Adds a subtle container
                        around the QR preview.
                      </span>
                    </span>
                  </label>


                  {/* Frame radius */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Frame Style
                    </label>

                    <select
                      value={
                        design.frameRadius
                      }
                      onChange={(e) =>
                        setDesign({
                          ...design,
                          frameRadius:
                            e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                    >
                      <option value="square">
                        Square
                      </option>

                      <option value="rounded">
                        Rounded
                      </option>
                    </select>
                  </div>
                </div>
              </div>


              {/* =================================================
                  QUIET ZONE
              ================================================= */}

              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <input
                  type="checkbox"
                  checked={
                    design.includeMargin
                  }
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      includeMargin:
                        e.target.checked,
                    })
                  }
                  className="mt-0.5"
                />

                <span>
                  <span className="block text-sm font-medium text-gray-700">
                    Include QR quiet zone
                  </span>

                  <span className="mt-0.5 block text-xs text-gray-400">
                    Recommended for reliable scanning,
                    especially when printing.
                  </span>
                </span>
              </label>
            </div>
          </Card>
        </div>


        {/* =================================================
            RIGHT PREVIEW
        ================================================= */}

        <div className="min-w-0 lg:col-span-5">
          <div className="sticky top-8">
            <Card className="min-w-0 overflow-hidden p-4 sm:p-6">

              <div className="mb-5 text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Live Preview
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {getTypeName()}
                </p>
              </div>


              <QRCodePreview
                value={qrValue}
                design={design}
              />


              {/* =================================================
                  ENCODED DATA
              ================================================= */}

              {qrValue && (
                <div className="mt-5 min-w-0">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Encoded Data
                  </label>

                  <div className="max-h-32 overflow-auto rounded-lg bg-gray-50 p-3">
                    <code className="break-all text-xs text-gray-600">
                      {qrValue}
                    </code>
                  </div>
                </div>
              )}


              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="mt-6 space-y-3">
                <Button
                  type="button"
                  className="w-full py-2.5"
                  disabled={!qrValue || saving}
                  onClick={handleSaveToCollection}
                >
                  {saving ? 'Saving...' : 'Save to Collection'}
                </Button>


                {saveMessage && (
                  <p
                    className={[
                      'mt-2 text-center text-sm',
                      saveMessage.includes('saved')
                        ? 'text-green-600'
                        : 'text-red-600',
                    ].join(' ')}
                  >
                    {saveMessage}
                  </p>)}
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}