import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase';

const LOCAL_QRS_KEY = 'qr_studio_codes';
const LOCAL_USERS_KEY = 'qr_studio_users';
const LOCAL_SCANS_KEY = 'qr_studio_scan_events';
const LOCAL_ACTIVITY_KEY = 'qr_studio_activity_logs';
const LOCAL_SCAN_HISTORY_KEY = 'qr_studio_scanner_history';

// Recursive sanitizer: removes undefined values which cause Firestore setDoc() to fail
export function cleanForFirestore(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      out[key] = cleanForFirestore(val);
    }
  }
  return out;
}

// Helper to get local data safely
function getLocal(key, defaultValue = []) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setLocal(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to set local storage ${key}`, e);
  }
}

// Initialize storage (cleans up any legacy demo data)
export function initSeedData() {
  const existing = getLocal(LOCAL_QRS_KEY, []);
  if (existing.length > 0) {
    const cleaned = existing.filter(item => item.userId !== 'demo-user-1');
    if (cleaned.length !== existing.length) {
      setLocal(LOCAL_QRS_KEY, cleaned);
    }
  }
}

// ----------------- QR Code Operations -----------------

export async function saveQRCode(qrData, user) {
  const isOnline = isFirebaseConfigured() && db;
  const qrId = qrData.id || ('qr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36));
  const now = new Date().toISOString();

  const record = {
    ...qrData,
    id: qrId,
    userId: user?.uid || null,
    userEmail: user?.email || null,
    createdAt: qrData.createdAt || now,
    updatedAt: now,
    scansCount: qrData.scansCount || 0,
    favorite: qrData.favorite || false,
    active: qrData.active !== undefined ? qrData.active : true,
  };

  let firestoreSaved = false;
  let firestoreError = null;

  if (isOnline) {
    try {
      const sanitizedRecord = cleanForFirestore(record);
      const docRef = doc(db, 'qr_codes', qrId);
      await setDoc(docRef, sanitizedRecord, { merge: true });
      firestoreSaved = true;
      console.log('✅ QR Code saved to Cloud Firestore:', qrId);
    } catch (e) {
      firestoreError = e.code || e.message;
      console.error('❌ Firestore save failed:', e.code, e.message);
    }
  }

  // Always update local storage for offline continuity
  const localList = getLocal(LOCAL_QRS_KEY, []);
  const index = localList.findIndex(item => item.id === qrId);
  if (index >= 0) {
    localList[index] = record;
  } else {
    localList.unshift(record);
  }
  setLocal(LOCAL_QRS_KEY, localList);

  // Log activity
  logActivity({
    userId: record.userId,
    userEmail: record.userEmail,
    type: qrData.id ? 'QR_UPDATED' : 'QR_CREATED',
    details: `${record.name} (${record.type.toUpperCase()})`,
    qrId: record.id,
  });

  return { ...record, firestoreSaved, firestoreError };
}

export async function getUserQRCodes(userId) {
  const isOnline = isFirebaseConfigured() && db;

  if (isOnline && userId) {
    try {
      const q = query(
        collection(db, 'qr_codes'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      items.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
      if (items.length > 0) {
        // Sync to local storage
        const localList = getLocal(LOCAL_QRS_KEY, []);
        const otherUsersQrs = localList.filter(item => item.userId !== userId);
        setLocal(LOCAL_QRS_KEY, [...items, ...otherUsersQrs]);
        return items;
      }
    } catch (e) {
      console.warn('Firestore read error, using local storage cache', e);
    }
  }

  // Local storage fallback
  const list = getLocal(LOCAL_QRS_KEY, []);
  if (!userId) return [];
  return list.filter(item => item.userId === userId);
}

export async function getAllQRCodesAdmin() {
  const isOnline = isFirebaseConfigured() && db;
  if (isOnline) {
    try {
      const snapshot = await getDocs(collection(db, 'qr_codes'));
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (e) {
      console.warn('Admin fetch Firestore error', e);
    }
  }
  return getLocal(LOCAL_QRS_KEY, []);
}

// Synchronous local cache check for zero-latency instant redirects
export function getQRCodeByIdSync(id) {
  if (!id) return null;
  const list = getLocal(LOCAL_QRS_KEY, []);
  return list.find(item => item.id === id || item.shortCode === id) || null;
}

export async function getQRCodeById(id) {
  if (!id) return null;

  // 1. Instant check from local cache (0ms latency)
  const localMatch = getQRCodeByIdSync(id);
  if (localMatch) {
    return localMatch;
  }

  // 2. Online Firestore Lookup
  const isOnline = isFirebaseConfigured() && db;
  if (isOnline) {
    try {
      // First try direct document lookup
      const docRef = doc(db, 'qr_codes', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const item = { ...snap.data(), id: snap.id };
        // Cache to local storage
        const list = getLocal(LOCAL_QRS_KEY, []);
        if (!list.some(q => q.id === item.id)) {
          list.unshift(item);
          setLocal(LOCAL_QRS_KEY, list);
        }
        return item;
      }

      // If id is a shortCode, query by shortCode field
      const q = query(
        collection(db, 'qr_codes'),
        where('shortCode', '==', id),
        limit(1)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const firstDoc = querySnap.docs[0];
        const item = { ...firstDoc.data(), id: firstDoc.id };
        // Cache to local storage
        const list = getLocal(LOCAL_QRS_KEY, []);
        if (!list.some(q => q.id === item.id)) {
          list.unshift(item);
          setLocal(LOCAL_QRS_KEY, list);
        }
        return item;
      }
    } catch (e) {
      console.warn('Firestore getQRCodeById error', e);
    }
  }

  return null;
}

export async function deleteQRCode(id, user) {
  const isOnline = isFirebaseConfigured() && db;
  if (isOnline) {
    try {
      await deleteDoc(doc(db, 'qr_codes', id));
    } catch (e) {
      console.warn('Firestore delete error', e);
    }
  }

  const list = getLocal(LOCAL_QRS_KEY, []);
  const updated = list.filter(item => item.id !== id);
  setLocal(LOCAL_QRS_KEY, updated);

  logActivity({
    userId: user?.uid || 'guest-user',
    userEmail: user?.email || 'guest@qrstudio.app',
    type: 'QR_DELETED',
    details: `Deleted QR ID ${id}`,
    qrId: id,
  });

  return true;
}

export async function toggleQRCodeFavorite(id) {
  const list = getLocal(LOCAL_QRS_KEY, []);
  const item = list.find(q => q.id === id);
  if (!item) return null;

  item.favorite = !item.favorite;
  item.updatedAt = new Date().toISOString();
  setLocal(LOCAL_QRS_KEY, list);

  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'qr_codes', id), {
        favorite: item.favorite,
        updatedAt: item.updatedAt
      });
    } catch (e) {
      console.warn('Firestore favorite update failed', e);
    }
  }

  return item.favorite;
}

export async function updateDynamicDestination(id, newDestination, user) {
  const list = getLocal(LOCAL_QRS_KEY, []);
  const item = list.find(q => q.id === id);
  if (!item) return false;

  item.destinationUrl = newDestination;
  item.data = { ...item.data, url: newDestination };
  item.updatedAt = new Date().toISOString();
  setLocal(LOCAL_QRS_KEY, list);

  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'qr_codes', id), {
        destinationUrl: newDestination,
        data: item.data,
        updatedAt: item.updatedAt
      });
    } catch (e) {
      console.warn('Firestore destination update failed', e);
    }
  }

  logActivity({
    userId: user?.uid || item.userId,
    userEmail: user?.email || item.userEmail || 'guest@qrstudio.app',
    type: 'DYNAMIC_DESTINATION_UPDATED',
    details: `${item.name} -> ${newDestination}`,
    qrId: id,
  });

  return true;
}

export async function toggleQRCodeStatus(id, active, user) {
  const list = getLocal(LOCAL_QRS_KEY, []);
  const item = list.find(q => q.id === id);
  if (!item) return false;

  item.active = active;
  item.updatedAt = new Date().toISOString();
  setLocal(LOCAL_QRS_KEY, list);

  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'qr_codes', id), {
        active: active,
        updatedAt: item.updatedAt
      });
    } catch (e) {
      console.warn('Firestore status toggle failed', e);
    }
  }

  logActivity({
    userId: user?.uid || 'guest-user',
    userEmail: user?.email || 'guest@qrstudio.app',
    type: 'STATUS_TOGGLED',
    details: `${item.name} status changed to ${active ? 'Active' : 'Disabled'}`,
    qrId: id,
  });

  return true;
}

// ----------------- Dynamic Scan Event Tracking -----------------

export async function recordScanEvent(qrId, scanInfo = {}) {
  const now = new Date().toISOString();
  const eventId = 'scan_' + Math.random().toString(36).substring(2, 9) + Date.now();

  const scanRecord = {
    id: eventId,
    qrId,
    timestamp: now,
    device: scanInfo.device || detectDevice(),
    browser: scanInfo.browser || detectBrowser(),
    os: scanInfo.os || detectOS(),
    referrer: document.referrer || 'Direct',
  };

  // Update QR scan counter
  const list = getLocal(LOCAL_QRS_KEY, []);
  const item = list.find(q => q.id === qrId || q.shortCode === qrId);
  if (item) {
    item.scansCount = (item.scansCount || 0) + 1;
    setLocal(LOCAL_QRS_KEY, list);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'qr_codes', item.id), {
          scansCount: item.scansCount
        });
      } catch (e) {}
    }
  }

  // Store scan event
  const scanEvents = getLocal(LOCAL_SCANS_KEY, []);
  scanEvents.unshift(scanRecord);
  setLocal(LOCAL_SCANS_KEY, scanEvents.slice(0, 500)); // Keep up to 500 scans

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'scan_events', eventId), scanRecord);
    } catch (e) {}
  }

  return scanRecord;
}

export async function getQRScanEvents(qrId) {
  const scans = getLocal(LOCAL_SCANS_KEY, []);
  return scans.filter(s => s.qrId === qrId);
}

export async function getAllScanEvents() {
  const isOnline = isFirebaseConfigured() && db;
  if (isOnline) {
    try {
      const snapshot = await getDocs(collection(db, 'scan_events'));
      const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      if (items.length > 0) {
        setLocal(LOCAL_SCANS_KEY, items);
        return items;
      }
    } catch (e) {
      console.warn('Firestore read scan_events error, falling back to local', e);
    }
  }
  return getLocal(LOCAL_SCANS_KEY, []);
}

// ----------------- Activity Logs -----------------

export async function logActivity(activity) {
  const logId = 'log_' + Date.now() + Math.random().toString(36).substring(2, 6);
  const logItem = {
    id: logId,
    ...activity,
    timestamp: new Date().toISOString(),
  };

  const logs = getLocal(LOCAL_ACTIVITY_KEY, []);
  logs.unshift(logItem);
  setLocal(LOCAL_ACTIVITY_KEY, logs.slice(0, 200));

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'activity_logs', logId), logItem);
    } catch (e) {}
  }

  return logItem;
}

export async function getActivityLogs() {
  return getLocal(LOCAL_ACTIVITY_KEY, []);
}

// ----------------- Scanner History (Camera scans) -----------------

export function getScanHistory() {
  return getLocal(LOCAL_SCAN_HISTORY_KEY, []);
}

export function addScanHistoryItem(item) {
  const history = getLocal(LOCAL_SCAN_HISTORY_KEY, []);
  const newEntry = {
    id: 'scanned_' + Date.now(),
    content: item.content,
    type: item.type || 'text',
    timestamp: new Date().toISOString(),
  };
  history.unshift(newEntry);
  setLocal(LOCAL_SCAN_HISTORY_KEY, history.slice(0, 100));
  return newEntry;
}

export function deleteScanHistoryItem(id) {
  const history = getLocal(LOCAL_SCAN_HISTORY_KEY, []);
  const updated = history.filter(h => h.id !== id);
  setLocal(LOCAL_SCAN_HISTORY_KEY, updated);
  return updated;
}

export function clearScanHistory() {
  setLocal(LOCAL_SCAN_HISTORY_KEY, []);
}

// ----------------- User Management (Admin & Auth) -----------------

export function getAllUsers() {
  const existing = getLocal(LOCAL_USERS_KEY, []);
  return existing.filter(u => u.uid !== 'demo-user-1' && u.email !== 'alex.creator@qrstudio.app');
}

export async function saveUserRecord(userData) {
  const users = getAllUsers();
  const index = users.findIndex(u => u.uid === userData.uid);
  if (index >= 0) {
    users[index] = { ...users[index], ...userData };
  } else {
    users.unshift(userData);
  }
  setLocal(LOCAL_USERS_KEY, users);

  if (isFirebaseConfigured() && db && userData?.uid) {
    try {
      await setDoc(doc(db, 'users', userData.uid), userData, { merge: true });
    } catch (e) {
      console.warn('Failed to save user record to Firestore', e);
    }
  }
}

export function toggleUserActive(uid, active) {
  const users = getAllUsers();
  const target = users.find(u => u.uid === uid);
  if (target) {
    target.active = active;
    setLocal(LOCAL_USERS_KEY, users);
  }
}

export function toggleUserRole(uid, role) {
  const users = getAllUsers();
  const target = users.find(u => u.uid === uid);
  if (target) {
    target.role = role;
    setLocal(LOCAL_USERS_KEY, users);
  }
}

// ----------------- Device & Browser Detection -----------------

function detectDevice() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Trident')) return 'Internet Explorer';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Other';
}

function detectOS() {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'Windows';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Mac/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}
