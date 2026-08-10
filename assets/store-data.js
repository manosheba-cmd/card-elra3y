// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗄️  طبقة البيانات المشتركة — Elra3y Store (مع Firebase)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STORAGE_KEYS = {
  settings: 'elra3y_store_settings',
  links: 'elra3y_social_links',
  password: 'elra3y_admin_password',
  visits: 'elra3y_visits',
  clicks: 'elra3y_clicks',
  auth: 'elra3y_admin_auth',
};

const DEFAULT_PASSWORD = '25817089';

const DEFAULT_SETTINGS = {
  name: 'Elra3y Store',
  description: 'أهلاً بيك 👋 تابعنا وتواصل معانا من هنا',
  phone: '',
  logo: '',       
  background: '', 
  vodafoneCashEnabled: false,
  vodafoneCashNumber: '01008800558',
};

const PLATFORM_DEFS = [
  { id: 'facebook', label: 'Facebook', color: '#1877F2', gradient: 'linear-gradient(135deg, #1877F2 0%, #0d5abf 100%)' },
  { id: 'instagram', label: 'Instagram', color: '#E1306C', gradient: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' },
  { id: 'tiktok', label: 'TikTok', color: '#69C9D0', gradient: 'linear-gradient(135deg, #010101 0%, #1a1a2e 100%)' },
  { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', gradient: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' },
  { id: 'youtube', label: 'YouTube', color: '#FF0000', gradient: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)' },
  { id: 'telegram', label: 'Telegram', color: '#29B6F6', gradient: 'linear-gradient(135deg, #29B6F6 0%, #0288D1 100%)' },
  { id: 'snapchat', label: 'Snapchat', color: '#FFFC00', gradient: 'linear-gradient(135deg, #FFFC00 0%, #f0e800 100%)' },
  { id: 'googlemaps', label: 'Google Maps', color: '#4285F4', gradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 45%, #FBBC05 75%, #EA4335 100%)' },
];

const DEFAULT_LINKS = PLATFORM_DEFS.reduce((acc, p) => {
  acc[p.id] = '';
  return acc;
}, {});

// ── Firebase Synchronization Helpers ──────────
function syncToFirebase(key, value) {
  if (window.db) {
    window.db.collection("store").doc(key).set({ value: value }, { merge: true })
      .catch(err => console.error("Firebase Sync Error:", err));
  }
}

// ── Settings ──────────────────────────────────
function getSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)) };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}
function saveSettings(s) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(s));
  syncToFirebase(STORAGE_KEYS.settings, s);
}

// ── Links ─────────────────────────────────────
function getLinks() {
  try {
    return { ...DEFAULT_LINKS, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.links)) };
  } catch (e) {
    return { ...DEFAULT_LINKS };
  }
}
function saveLinks(l) {
  localStorage.setItem(STORAGE_KEYS.links, JSON.stringify(l));
  syncToFirebase(STORAGE_KEYS.links, l);
}

// ── Admin password ────────────────────────────
function getPassword() {
  return localStorage.getItem(STORAGE_KEYS.password) || DEFAULT_PASSWORD;
}
function savePassword(p) {
  localStorage.setItem(STORAGE_KEYS.password, p);
  syncToFirebase(STORAGE_KEYS.password, p);
}

// ── Visits ────────────────────────────────────
function getVisits() {
  return parseInt(localStorage.getItem(STORAGE_KEYS.visits) || '0', 10);
}
function incrementVisits() {
  const v = getVisits() + 1;
  localStorage.setItem(STORAGE_KEYS.visits, String(v));
  syncToFirebase(STORAGE_KEYS.visits, String(v));
  return v;
}

// ── Clicks per platform ───────────────────────
function emptyClicks() {
  return PLATFORM_DEFS.reduce((acc, p) => {
    acc[p.id] = 0;
    return acc;
  }, {});
}
function getClicks() {
  try {
    return { ...emptyClicks(), ...JSON.parse(localStorage.getItem(STORAGE_KEYS.clicks)) };
  } catch (e) {
    return emptyClicks();
  }
}
function incrementClick(id) {
  const c = getClicks();
  c[id] = (c[id] || 0) + 1;
  localStorage.setItem(STORAGE_KEYS.clicks, JSON.stringify(c));
  syncToFirebase(STORAGE_KEYS.clicks, c);
  return c;
}
function resetStats() {
  localStorage.setItem(STORAGE_KEYS.visits, '0');
  localStorage.setItem(STORAGE_KEYS.clicks, JSON.stringify(emptyClicks()));
  syncToFirebase(STORAGE_KEYS.visits, '0');
  syncToFirebase(STORAGE_KEYS.clicks, emptyClicks());
}

// ── Helpers ───────────────────────────────────
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function readFileAsDataUrl(file, cb) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => cb(reader.result);
  reader.readAsDataURL(file);
}

// ── Full Initial Load from Firebase ───────────
function loadStoreData(callback) {
  if (window.db) {
    window.db.collection("store").get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const key = doc.id;
        const val = doc.data().value;
        if (typeof val === 'object') {
          localStorage.setItem(key, JSON.stringify(val));
        } else {
          localStorage.setItem(key, String(val));
        }
      });
      if (callback) callback();
    }).catch((err) => {
      console.error("Firebase Initial Fetch Error:", err);
      if (callback) callback();
    });
  } else {
    if (callback) callback();
  }
}