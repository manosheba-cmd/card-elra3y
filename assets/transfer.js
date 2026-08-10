// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💳  منطق صفحة تحويل فودافون كاش — Elra3y Store
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('particles-canvas');
  if (canvas && typeof initParticles === 'function') initParticles(canvas);

  // جلب البيانات السحابية أولاً (لو حد فتح الصفحة مباشرة من غير ما يمر بالرئيسية)
  if (typeof loadStoreData === 'function') {
    loadStoreData(init);
  } else {
    init();
  }

  function init() {
    const settings = getSettings();

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
    document.title = 'تحويل فودافون كاش | ' + settings.name;

    if (settings.background) {
      document.body.style.setProperty('--bg-image', `url("${settings.background}")`);
      document.body.classList.add('has-bg-image');
    }

    // ── أيقونة السهم الأحمر ──
    const arrowWrap = document.getElementById('transfer-arrow-wrap');
    arrowWrap.style.color = '#E60000';
    arrowWrap.innerHTML = TRANSFER_ARROW_ICON;
    document.getElementById('transfer-side-arrow').innerHTML = ARROW_ICON;

    // ── إظهار/إخفاء فورم المبلغ عند الضغط على الكارد ──
    const card = document.getElementById('transfer-card');
    const form = document.getElementById('transfer-form');

    card.addEventListener('click', () => {
      form.classList.toggle('hidden');
      if (!form.classList.contains('hidden')) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('transfer-amount').focus();
      }
    });

    // ── الضغط على زر "تحويل" ──
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const amountInput = document.getElementById('transfer-amount');
      const amount = amountInput.value.trim();

      if (!amount || Number(amount) <= 0) {
        showToast('من فضلك اكتب مبلغ صحيح', 'error');
        amountInput.focus();
        return;
      }

      const number = settings.vodafoneCashNumber || '01008800558';
      // بنستبدل الـ # بـ %23 لأن بعض المتصفحات بتتعامل معاها كـ anchor وتقطع رقم الاتصال
      const ussd = `*9*7*${number}*${Math.trunc(Number(amount))}#`.replace(/#/g, '%23');

      window.location.href = 'tel:' + ussd;
    });
  }
});

// ── نظام التنبيهات (Toast) بنفس شكل باقي الموقع ──
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
