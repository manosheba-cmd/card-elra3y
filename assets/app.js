// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠  منطق الصفحة الرئيسية — Elra3y Store
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener('DOMContentLoaded', () => {
  // خلفية الجسيمات
  const canvas = document.getElementById('particles-canvas');
  if (canvas) initParticles(canvas);

  const settings = getSettings();
  const links = getLinks();

  // تسجيل زيارة جديدة
  incrementVisits();

  // ── اللوجو والاسم ──
  const logoImg = document.getElementById('logo-img');
  const logoInitials = document.getElementById('logo-initials');
  if (settings.logo) {
    logoImg.src = settings.logo;
    logoImg.style.display = 'block';
    logoInitials.style.display = 'none';
  } else {
    logoInitials.textContent = (settings.name || 'ES').trim().slice(0, 2).toUpperCase();
  }

  document.getElementById('store-name').textContent = settings.name;
  document.getElementById('store-desc').textContent = settings.description;
  document.getElementById('footer-name').textContent = settings.name;
  document.getElementById('footer-year').textContent = new Date().getFullYear();
  document.title = settings.name;

  if (settings.background) {
    document.body.style.setProperty('--bg-image', `url("${settings.background}")`);
    document.body.classList.add('has-bg-image');
  }

  // ── أزرار السوشيال ميديا ──
  const container = document.getElementById('social-buttons');
  let rendered = 0;

  PLATFORM_DEFS.forEach((p) => {
    const url = (links[p.id] || '').trim();
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'social-btn';
    a.style.setProperty('--accent', p.color);
    a.style.setProperty('--gradient', p.gradient);
    a.style.setProperty('--accent-shadow', hexToRgba(p.color, 0.4));
    a.style.setProperty('--accent-border', hexToRgba(p.color, 0.35));

    const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

    a.innerHTML = `
      <span class="btn-glow"></span>
      <span class="icon-wrap">${ICONS[p.id]}</span>
      <span class="btn-text">
        <span class="btn-title">${p.label}</span>
        <span class="btn-sub">${displayUrl}</span>
      </span>
      <span class="btn-arrow">${ARROW_ICON}</span>
    `;

    a.addEventListener('click', () => incrementClick(p.id));
    container.appendChild(a);
    rendered++;
  });

  // ── كارد فودافون كاش (تحويل رصيد) ──
  if (settings.vodafoneCashEnabled) {
    const vc = document.createElement('a');
    vc.href = 'transfer.html';
    vc.className = 'social-btn';
    vc.style.setProperty('--accent', '#E60000');
    vc.style.setProperty('--gradient', 'linear-gradient(135deg, #E60000 0%, #9c0000 100%)');
    vc.style.setProperty('--accent-shadow', hexToRgba('#E60000', 0.4));
    vc.style.setProperty('--accent-border', hexToRgba('#E60000', 0.35));

    vc.innerHTML = `
      <span class="btn-glow"></span>
      <span class="icon-wrap">${ICONS.vodafonecash}</span>
      <span class="btn-text">
        <span class="btn-title">فودافون كاش</span>
        <span class="btn-sub">تحويل رصيد</span>
      </span>
      <span class="btn-arrow">${ARROW_ICON}</span>
    `;

    container.appendChild(vc);
    rendered++;
  }

  if (rendered === 0) {
    container.innerHTML = '<p class="empty-state">لسه معملناش أي روابط. تقدر تضيفها من لوحة التحكم.</p>';
  }

  // ── زر مشاركة الموقع (رابط / باركود) ──
  const pageUrl = window.location.origin + window.location.pathname;
  const shareBtn = document.getElementById('share-btn');
  const shareMenu = document.getElementById('share-menu');
  const shareLinkBtn = document.getElementById('share-link-btn');
  const shareQrBtn = document.getElementById('share-qr-btn');

  function closeShareMenu() {
    shareMenu.classList.add('hidden');
  }

  shareBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    shareMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!shareMenu.classList.contains('hidden') && !shareMenu.contains(e.target) && e.target !== shareBtn) {
      closeShareMenu();
    }
  });

  // -- مشاركة الرابط --
  shareLinkBtn.addEventListener('click', async () => {
    closeShareMenu();
    const shareData = { title: settings.name, text: settings.name, url: pageUrl };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        // فشلت المشاركة عبر النظام → نكمل على النسخ الاحتياطي بالأسفل
      }
    }
    copyToClipboard(pageUrl);
    showHomeToast('تم نسخ رابط الموقع ✅');
  });

  // -- مشاركة الباركود --
  shareQrBtn.addEventListener('click', async () => {
    closeShareMenu();

    const qrCanvas = document.createElement('canvas');
    QRCode.toCanvas(qrCanvas, pageUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#0a0908', light: '#ffffff' },
    });

    const fileName = `${(settings.name || 'elra3y-store').replace(/\s+/g, '-').toLowerCase()}-qr.png`;

    qrCanvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: settings.name, text: settings.name });
          return;
        } catch (err) {
          if (err && err.name === 'AbortError') return;
        }
      }

      // نسخ احتياطي: تحميل صورة الباركود مباشرة لو المشاركة غير مدعومة
      const link = document.createElement('a');
      link.download = fileName;
      link.href = URL.createObjectURL(blob);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 2000);
      showHomeToast('تم تحميل صورة الباركود ✅');
    }, 'image/png');
  });

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }
});

// ── نظام التنبيهات (Toast) بنفس شكل لوحة الإدارة ──
function showHomeToast(msg, type = 'success') {
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
