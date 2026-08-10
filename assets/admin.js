// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐  منطق لوحة الإدارة — Elra3y Store (مع Firebase)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let pendingLogo = undefined; // undefined = لم يتغير، '' = تمت الإزالة، 'data:...' = صورة جديدة
let pendingBg = undefined;

document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');

  // جلب البيانات السحابية أولاً عند فتح لوحة التحكم
  if (typeof loadStoreData === 'function') {
    loadStoreData(() => {
      initAdminPanel();
    });
  } else {
    initAdminPanel();
  }

  function initAdminPanel() {
    buildLinksFields();

    // ── تسجيل الدخول ──
    if (sessionStorage.getItem(STORAGE_KEYS.auth) === 'true') {
      showDashboard();
    }

    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const val = document.getElementById('login-password').value;
      if (val === getPassword()) {
        sessionStorage.setItem(STORAGE_KEYS.auth, 'true');
        showDashboard();
      } else {
        showToast('كلمة المرور غير صحيحة', 'error');
        document.getElementById('login-password').value = '';
      }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
      sessionStorage.removeItem(STORAGE_KEYS.auth);
      dashboardView.classList.add('hidden');
      loginView.classList.remove('hidden');
      document.getElementById('login-password').value = '';
    });
  }

  function showDashboard() {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    renderLinksForm();
    renderSettingsForm();
    renderStats();
  }

  // ── تبويبات ──
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'tab-stats') renderStats();
      if (btn.dataset.tab === 'tab-qr') renderQrTab();
    });
  });

  // ── الباركود (QR) ──
  function siteUrl() {
    return window.location.origin + window.location.pathname.replace(/mano\/?(index\.html)?$/, '');
  }

  function renderQrTab() {
    const s = getSettings();
    const url = siteUrl();
    const canvas = document.getElementById('admin-qr-canvas');
    document.getElementById('admin-qr-url').textContent = url;

    if (window.QRCode) {
      QRCode.toCanvas(canvas, url, {
        width: 220,
        margin: 2,
        color: { dark: '#0a0908', light: '#f5f0e6' },
      });
    }

    const downloadBtn = document.getElementById('admin-download-qr');
    const printBtn = document.getElementById('admin-print-qr');

    downloadBtn.onclick = () => {
      const link = document.createElement('a');
      link.download = `${(s.name || 'elra3y-store').replace(/\s+/g, '-').toLowerCase()}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    printBtn.onclick = () => {
      const dataUrl = canvas.toDataURL('image/png');
      const w = window.open('', '_blank');
      w.document.write(`
        <html dir="rtl"><head><title>طباعة QR - ${s.name}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
          <h2>${s.name}</h2>
          <img src="${dataUrl}" style="width:300px" onload="window.print()">
        </body></html>
      `);
      w.document.close();
    };
  }

  // ── بناء حقول الروابط ديناميكيًا ──
  function buildLinksFields() {
    const wrap = document.getElementById('links-fields');
    if (!wrap) return;
    wrap.innerHTML = PLATFORM_DEFS.map((p) => `
      <div class="link-field">
        <div class="platform-icon" style="color:${p.color}">${ICONS[p.id]}</div>
        <div class="field">
          <label for="link-${p.id}">${p.label}</label>
          <input type="url" id="link-${p.id}" placeholder="https://...">
        </div>
      </div>
    `).join('');
  }

  function renderLinksForm() {
    const links = getLinks();
    PLATFORM_DEFS.forEach((p) => {
      const input = document.getElementById('link-' + p.id);
      if (input) input.value = links[p.id] || '';
    });
  }

  document.getElementById('links-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const links = {};
    PLATFORM_DEFS.forEach((p) => {
      links[p.id] = document.getElementById('link-' + p.id).value.trim();
    });
    saveLinks(links);
    showToast('تم حفظ الروابط بنجاح أونلاين ✅');
  });

  // ── بيانات المحل ──
  function renderSettingsForm() {
    const s = getSettings();
    document.getElementById('setting-name').value = s.name;
    document.getElementById('setting-desc').value = s.description;
    document.getElementById('setting-phone').value = s.phone;
    document.getElementById('setting-vc-enabled').checked = !!s.vodafoneCashEnabled;
    document.getElementById('setting-vc-number').value = s.vodafoneCashNumber || '';

    const logoPreview = document.getElementById('logo-preview');
    logoPreview.src = s.logo || '';
    logoPreview.style.display = s.logo ? 'block' : 'none';

    const bgPreview = document.getElementById('bg-preview');
    bgPreview.src = s.background || '';
    bgPreview.style.display = s.background ? 'block' : 'none';

    pendingLogo = undefined;
    pendingBg = undefined;
  }

  document.getElementById('logo-file').addEventListener('change', (e) => {
    readFileAsDataUrl(e.target.files[0], (url) => {
      pendingLogo = url;
      const preview = document.getElementById('logo-preview');
      preview.src = url;
      preview.style.display = 'block';
    });
  });

  document.getElementById('bg-file').addEventListener('change', (e) => {
    readFileAsDataUrl(e.target.files[0], (url) => {
      pendingBg = url;
      const preview = document.getElementById('bg-preview');
      preview.src = url;
      preview.style.display = 'block';
    });
  });

  document.getElementById('remove-logo').addEventListener('click', () => {
    pendingLogo = '';
    const preview = document.getElementById('logo-preview');
    preview.style.display = 'none';
    preview.src = '';
    document.getElementById('logo-file').value = '';
  });

  document.getElementById('remove-bg').addEventListener('click', () => {
    pendingBg = '';
    const preview = document.getElementById('bg-preview');
    preview.style.display = 'none';
    preview.src = '';
    document.getElementById('bg-file').value = '';
  });

  document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const s = getSettings();
    s.name = document.getElementById('setting-name').value.trim() || DEFAULT_SETTINGS.name;
    s.description = document.getElementById('setting-desc').value.trim();
    s.phone = document.getElementById('setting-phone').value.trim();
    s.vodafoneCashEnabled = document.getElementById('setting-vc-enabled').checked;
    s.vodafoneCashNumber = document.getElementById('setting-vc-number').value.trim() || DEFAULT_SETTINGS.vodafoneCashNumber;
    if (pendingLogo !== undefined) s.logo = pendingLogo;
    if (pendingBg !== undefined) s.background = pendingBg;
    saveSettings(s);
    pendingLogo = undefined;
    pendingBg = undefined;
    showToast('تم حفظ بيانات المحل بنجاح أونلاين ✅');
  });

  // ── كلمة المرور ──
  document.getElementById('password-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const cur = document.getElementById('current-password').value;
    const next = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;

    if (cur !== getPassword()) {
      showToast('كلمة المرور الحالية غير صحيحة', 'error');
      return;
    }
    if (next.length < 4) {
      showToast('كلمة المرور الجديدة قصيرة جدًا (4 أحرف على الأقل)', 'error');
      return;
    }
    if (next !== confirm) {
      showToast('كلمتا المرور الجديدتان غير متطابقتين', 'error');
      return;
    }

    savePassword(next);
    document.getElementById('password-form').reset();
    showToast('تم تغيير كلمة المرور بنجاح أونلاين ✅');
  });

  // ── الإحصائيات ──
  function renderStats() {
    document.getElementById('stat-visits').textContent = getVisits();
    const clicks = getClicks();
    const total = Object.values(clicks).reduce((a, b) => a + b, 0);
    document.getElementById('stat-total-clicks').textContent = total;

    const tbody = document.getElementById('clicks-table-body');
    tbody.innerHTML = PLATFORM_DEFS.map((p) => `
      <tr><td>${p.label}</td><td>${clicks[p.id] || 0}</td></tr>
    `).join('');
  }

  document.getElementById('reset-stats-btn').addEventListener('click', () => {
    if (confirm('هل أنت متأكد من تصفير كل الإحصائيات؟ لا يمكن التراجع عن هذه الخطوة.')) {
      resetStats();
      renderStats();
      showToast('تم تصفير الإحصائيات أونلاين');
    }
  });
});

// ── نظام التنبيهات (Toast) ──
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type === 'error' ? 'toast-error' : 'toast-success');
  toast.textContent = msg;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}