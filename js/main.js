/* ============================================================
   GLOBAL SCRIPT v3 — Alex Giannola
   ============================================================ */

// Navbar scroll effect
const nav = document.querySelector('.nav');
if (nav) {
  const onScroll = () => {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// MOBILE NAV — apri, chiudi, backdrop, pulsante chiudi esplicito
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  // Crea backdrop dinamicamente
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);

  // Crea pulsante CHIUDI dentro il drawer
  const closeBtn = document.createElement('button');
  closeBtn.className = 'nav-close';
  closeBtn.setAttribute('aria-label', 'Chiudi menu');
  closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg> Chiudi';
  navLinks.insertBefore(closeBtn, navLinks.firstChild);

  const openMenu = () => {
    navToggle.classList.add('active');
    navLinks.classList.add('open');
    backdrop.classList.add('visible');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    navToggle.classList.remove('active');
    navLinks.classList.remove('open');
    backdrop.classList.remove('visible');
    document.body.style.overflow = '';
  };

  navToggle.addEventListener('click', () => {
    if (navLinks.classList.contains('open')) closeMenu();
    else openMenu();
  });

  closeBtn.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);

  // Chiudi cliccando su link di navigazione (ma non sul bottone chiudi stesso)
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // Chiudi con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMenu();
  });
}

// REVEAL ON SCROLL (standard + slide-right)
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-slide-right').forEach(el => revealObserver.observe(el));

/* ============================================================
   CALCOLATORE
   ============================================================ */
const calcForm = document.querySelector('#calc-form');
if (calcForm) {
  const startInput = document.querySelector('#calc-start');
  const investInput = document.querySelector('#calc-invest');
  const yearsInput = document.querySelector('#calc-years');
  const freqBtns = document.querySelectorAll('.freq-btn');
  const calcBtn = document.querySelector('#calc-btn');

  const resultStrategy = document.querySelector('#result-strategy');
  const resultAdvisor = document.querySelector('#result-advisor');
  const resultBank = document.querySelector('#result-bank');
  const gainStrategy = document.querySelector('#gain-strategy');
  const gainAdvisor = document.querySelector('#gain-advisor');
  const gainBank = document.querySelector('#gain-bank');

  let frequency = 'monthly';

  freqBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      freqBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      frequency = btn.dataset.freq;
    });
  });

  function formatItalian(value) {
    if (value === '' || value === null || value === undefined) return '';
    const num = typeof value === 'number' ? value : parseInt(value.toString().replace(/\./g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('it-IT');
  }
  function parseItalian(str) {
    if (!str) return 0;
    const cleaned = str.toString().replace(/\./g, '').replace(/[^\d]/g, '');
    return parseInt(cleaned, 10) || 0;
  }

  [startInput, investInput].forEach(input => {
    const initial = input.dataset.value || input.value;
    if (initial) input.value = formatItalian(parseItalian(initial));

    input.addEventListener('input', (e) => {
      const caretPos = e.target.selectionStart;
      const oldLen = e.target.value.length;
      const raw = parseItalian(e.target.value);
      e.target.value = formatItalian(raw);
      const newLen = e.target.value.length;
      const diff = newLen - oldLen;
      e.target.setSelectionRange(caretPos + diff, caretPos + diff);
    });

    input.addEventListener('keydown', (e) => {
      const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
      if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
      if (!/^\d$/.test(e.key)) e.preventDefault();
    });
  });

  function futureValue(principal, contribution, annualRate, years, periodsPerYear) {
    const r = annualRate / periodsPerYear;
    const n = years * periodsPerYear;
    const fvPrincipal = principal * Math.pow(1 + r, n);
    const fvContrib = contribution > 0 && r > 0
      ? contribution * ((Math.pow(1 + r, n) - 1) / r)
      : contribution * n;
    return fvPrincipal + fvContrib;
  }

  function formatEuro(value) {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  }

  function animateNumber(el, from, to, duration = 1200) {
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    function step(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const value = from + (to - from) * ease(t);
      el.textContent = formatEuro(value);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function calculate() {
    const principal = Math.max(0, parseItalian(startInput.value));
    const contribution = Math.max(0, parseItalian(investInput.value));
    const years = Math.max(1, Math.min(50, parseInt(yearsInput.value) || 1));

    const periodsMap = { monthly: 12, semestral: 2, annual: 1 };
    const periods = periodsMap[frequency] || 12;

    const fvStrategy = futureValue(principal, contribution, 0.12, years, periods);
    const fvAdvisor = futureValue(principal, contribution, 0.07, years, periods);
    const fvBank = futureValue(principal, contribution, 0.04, years, periods);

    const totalInvested = principal + contribution * periods * years;

    animateNumber(resultStrategy, 0, fvStrategy);
    animateNumber(resultAdvisor, 0, fvAdvisor);
    animateNumber(resultBank, 0, fvBank);

    gainStrategy.textContent = `+${formatEuro(fvStrategy - totalInvested)} di rendimento`;
    gainAdvisor.textContent = `+${formatEuro(fvAdvisor - totalInvested)} di rendimento`;
    gainBank.textContent = `+${formatEuro(fvBank - totalInvested)} di rendimento`;

    document.querySelector('.calc-results').classList.add('visible');
  }

  calcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    calculate();
  });

  calcBtn.addEventListener('click', (e) => {
    e.preventDefault();
    calculate();
  });
}

/* COUNTER ANIMATION */
const counters = document.querySelectorAll('[data-counter]');
if (counters.length) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.dataset.counter);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = 1600;
        const start = performance.now();
        const ease = (t) => 1 - Math.pow(1 - t, 3);
        function step(now) {
          const t = Math.min((now - start) / duration, 1);
          const value = target * ease(t);
          const displayValue = Number.isInteger(target)
            ? Math.round(value).toLocaleString('it-IT')
            : value.toFixed(1);
          el.textContent = prefix + displayValue + suffix;
          if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterObserver.observe(c));
}
