/* ============================================================
   GLOBAL SCRIPT
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

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });
}

// Reveal on scroll
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

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

  let frequency = 'monthly'; // monthly | weekly | daily

  freqBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      freqBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      frequency = btn.dataset.freq;
    });
  });

  // Formula: FV = P*(1+r)^n + PMT * [((1+r)^n - 1)/r]
  // r = tasso periodico, n = numero periodi
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
    const principal = Math.max(0, parseFloat(startInput.value) || 0);
    const contribution = Math.max(0, parseFloat(investInput.value) || 0);
    const years = Math.max(1, Math.min(50, parseInt(yearsInput.value) || 1));

    const periodsMap = { monthly: 12, weekly: 52, daily: 365 };
    const periods = periodsMap[frequency];

    // Tassi
    const fvStrategy = futureValue(principal, contribution, 0.12, years, periods);
    const fvAdvisor = futureValue(principal, contribution, 0.07, years, periods);
    const fvBank = futureValue(principal, contribution, 0.04, years, periods);

    const totalInvested = principal + contribution * periods * years;

    // Animate
    animateNumber(resultStrategy, 0, fvStrategy);
    animateNumber(resultAdvisor, 0, fvAdvisor);
    animateNumber(resultBank, 0, fvBank);

    gainStrategy.textContent = `+${formatEuro(fvStrategy - totalInvested)} di rendimento`;
    gainAdvisor.textContent = `+${formatEuro(fvAdvisor - totalInvested)} di rendimento`;
    gainBank.textContent = `+${formatEuro(fvBank - totalInvested)} di rendimento`;

    // Reveal results
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

/* ============================================================
   COUNTER ANIMATION (stats)
   ============================================================ */
const counters = document.querySelectorAll('[data-counter]');
if (counters.length) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.dataset.counter);
        const suffix = el.dataset.suffix || '';
        const duration = 1600;
        const start = performance.now();
        const ease = (t) => 1 - Math.pow(1 - t, 3);
        function step(now) {
          const t = Math.min((now - start) / duration, 1);
          const value = target * ease(t);
          el.textContent = (Number.isInteger(target) ? Math.round(value) : value.toFixed(1)) + suffix;
          if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterObserver.observe(c));
}
