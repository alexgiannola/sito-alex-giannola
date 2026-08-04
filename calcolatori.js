/* ============================================================
   CALCOLATORI — logica dei 3 strumenti
   ============================================================ */

function formatEuro(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

function formatItalianNum(value) {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : parseInt(value.toString().replace(/\./g, ''), 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('it-IT');
}
function parseItalianNum(str) {
  if (!str) return 0;
  const cleaned = str.toString().replace(/\./g, '').replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

// Attacca la formattazione italiana (migliaia con punto) a un input testo
function attachItalianFormatting(input) {
  if (!input) return;
  const initial = input.value;
  if (initial) input.value = formatItalianNum(parseItalianNum(initial));
  input.addEventListener('input', (e) => {
    const caretPos = e.target.selectionStart;
    const oldLen = e.target.value.length;
    const raw = parseItalianNum(e.target.value);
    e.target.value = formatItalianNum(raw);
    const newLen = e.target.value.length;
    const diff = newLen - oldLen;
    e.target.setSelectionRange(caretPos + diff, caretPos + diff);
  });
  input.addEventListener('keydown', (e) => {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  });
}

function futureValueWithContrib(principal, contribution, annualRate, years, periodsPerYear) {
  const r = annualRate / periodsPerYear;
  const n = years * periodsPerYear;
  const fvPrincipal = principal * Math.pow(1 + r, n);
  const fvContrib = contribution > 0 && r > 0
    ? contribution * ((Math.pow(1 + r, n) - 1) / r)
    : contribution * n;
  return fvPrincipal + fvContrib;
}

function animateValue(el, from, to, duration = 1000) {
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

/* ============================================================
   CALCOLATORE 1 — Interesse composto vs semplice (con grafico SVG)
   ============================================================ */
(function () {
  const form = document.querySelector('#form-composto');
  if (!form) return;

  const capitalInput = document.querySelector('#c1-capital');
  const rateInput = document.querySelector('#c1-rate');
  const yearsInput = document.querySelector('#c1-years');
  const svg = document.querySelector('#chart-composto');
  const resCompound = document.querySelector('#c1-result-compound');
  const resSimple = document.querySelector('#c1-result-simple');
  const resDiff = document.querySelector('#c1-result-diff');

  attachItalianFormatting(capitalInput);

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const W = 600, H = 320, PAD_L = 55, PAD_B = 34, PAD_T = 16, PAD_R = 16;

  function buildChart(principal, rate, years) {
    svg.innerHTML = '';
    const r = rate / 100;

    // Genera punti anno per anno
    const compoundPts = [];
    const simplePts = [];
    for (let y = 0; y <= years; y++) {
      compoundPts.push(principal * Math.pow(1 + r, y));
      simplePts.push(principal * (1 + r * y));
    }
    const maxVal = Math.max(...compoundPts, ...simplePts);

    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;

    function xFor(i) { return PAD_L + (i / years) * plotW; }
    function yFor(v) { return PAD_T + plotH - (v / maxVal) * plotH; }

    // Griglia orizzontale (4 linee)
    for (let i = 0; i <= 4; i++) {
      const gy = PAD_T + (plotH / 4) * i;
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', PAD_L);
      line.setAttribute('x2', W - PAD_R);
      line.setAttribute('y1', gy);
      line.setAttribute('y2', gy);
      line.setAttribute('stroke', 'rgba(0,52,89,0.08)');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);

      const val = maxVal * (1 - i / 4);
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', PAD_L - 8);
      label.setAttribute('y', gy + 4);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', 'rgba(0,52,89,0.45)');
      label.textContent = val >= 1000 ? Math.round(val / 1000) + 'k' : Math.round(val);
      svg.appendChild(label);
    }

    // Asse X: anno 0, metà, fine
    [0, Math.round(years / 2), years].forEach((yr) => {
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', xFor(yr));
      label.setAttribute('y', H - 10);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', 'rgba(0,52,89,0.45)');
      label.textContent = 'Anno ' + yr;
      svg.appendChild(label);
    });

    function buildPath(pts) {
      return pts.map((v, i) => (i === 0 ? 'M' : 'L') + xFor(i) + ',' + yFor(v)).join(' ');
    }

    const simplePath = document.createElementNS(SVG_NS, 'path');
    simplePath.setAttribute('d', buildPath(simplePts));
    simplePath.setAttribute('fill', 'none');
    simplePath.setAttribute('stroke', '#C0C0C0');
    simplePath.setAttribute('stroke-width', '2.5');
    svg.appendChild(simplePath);

    const compoundPath = document.createElementNS(SVG_NS, 'path');
    compoundPath.setAttribute('d', buildPath(compoundPts));
    compoundPath.setAttribute('fill', 'none');
    compoundPath.setAttribute('stroke', '#DF2935');
    compoundPath.setAttribute('stroke-width', '3');
    svg.appendChild(compoundPath);

    // Punto finale evidenziato
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', xFor(years));
    dot.setAttribute('cy', yFor(compoundPts[years]));
    dot.setAttribute('r', '5');
    dot.setAttribute('fill', '#DF2935');
    svg.appendChild(dot);

    return {
      finalCompound: compoundPts[years],
      finalSimple: simplePts[years]
    };
  }

  function calculate() {
    const principal = Math.max(1, parseItalianNum(capitalInput.value));
    const rate = Math.max(0.1, parseFloat(rateInput.value) || 6);
    const years = Math.max(1, Math.min(40, parseInt(yearsInput.value) || 20));

    const result = buildChart(principal, rate, years);

    animateValue(resCompound, 0, result.finalCompound);
    animateValue(resSimple, 0, result.finalSimple);
    animateValue(resDiff, 0, result.finalCompound - result.finalSimple);
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();

/* ============================================================
   CALCOLATORE 2 — Impatto costi
   ============================================================ */
(function () {
  const form = document.querySelector('#form-costi');
  if (!form) return;

  const capitalInput = document.querySelector('#c2-capital');
  const costInput = document.querySelector('#c2-cost');
  const returnInput = document.querySelector('#c2-return');

  attachItalianFormatting(capitalInput);

  const LOW_COST = 0.2;

  function calcAt(principal, grossReturn, cost, years) {
    const netRate = (grossReturn - cost) / 100;
    return principal * Math.pow(1 + netRate, years);
  }

  function calculate() {
    const principal = Math.max(1, parseItalianNum(capitalInput.value));
    const cost = Math.max(0, parseFloat(costInput.value) || 2);
    const grossReturn = Math.max(1, parseFloat(returnInput.value) || 7);

    [10, 20].forEach((years) => {
      const yours = calcAt(principal, grossReturn, cost, years);
      const low = calcAt(principal, grossReturn, LOW_COST, years);
      const loss = low - yours;

      animateValue(document.querySelector(`#c2-yours-${years}`), 0, yours);
      animateValue(document.querySelector(`#c2-low-${years}`), 0, low);
      animateValue(document.querySelector(`#c2-loss-${years}`), 0, loss);
    });
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();

/* ============================================================
   CALCOLATORE 3 — Banca vs Indipendente vs Fee-only
   Stesso rendimento lordo (7%) per tutti, differenza solo nei costi
   ============================================================ */
(function () {
  const form = document.querySelector('#form-confronto');
  if (!form) return;

  const startInput = document.querySelector('#c3-start');
  const investInput = document.querySelector('#c3-invest');
  const yearsInput = document.querySelector('#c3-years');
  const freqBtns = document.querySelectorAll('#form-confronto .freq-btn');

  attachItalianFormatting(startInput);
  attachItalianFormatting(investInput);

  const GROSS_RETURN = 0.07;
  const COST_BANK = 0.025;
  const COST_ADVISOR = 0.01;
  const COST_FEE = 0.008;

  let frequency = 'monthly';
  freqBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      freqBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      frequency = btn.dataset.freq;
    });
  });

  function calculate() {
    const principal = Math.max(0, parseItalianNum(startInput.value));
    const contribution = Math.max(0, parseItalianNum(investInput.value));
    const years = Math.max(1, Math.min(50, parseInt(yearsInput.value) || 15));

    const periodsMap = { monthly: 12, semestral: 2, annual: 1 };
    const periods = periodsMap[frequency] || 12;

    const rateBank = GROSS_RETURN - COST_BANK;
    const rateAdvisor = GROSS_RETURN - COST_ADVISOR;
    const rateFee = GROSS_RETURN - COST_FEE;

    const fvBank = futureValueWithContrib(principal, contribution, rateBank, years, periods);
    const fvAdvisor = futureValueWithContrib(principal, contribution, rateAdvisor, years, periods);
    const fvFee = futureValueWithContrib(principal, contribution, rateFee, years, periods);

    const totalInvested = principal + contribution * periods * years;

    animateValue(document.querySelector('#c3-result-bank'), 0, fvBank);
    animateValue(document.querySelector('#c3-result-advisor'), 0, fvAdvisor);
    animateValue(document.querySelector('#c3-result-fee'), 0, fvFee);

    document.querySelector('#c3-gain-bank').textContent = `+${formatEuro(fvBank - totalInvested)} di rendimento netto`;
    document.querySelector('#c3-gain-advisor').textContent = `+${formatEuro(fvAdvisor - totalInvested)} di rendimento netto`;
    document.querySelector('#c3-gain-fee').textContent = `+${formatEuro(fvFee - totalInvested)} di rendimento netto`;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();

/* REVEAL ON SCROLL (in caso main.js non abbia ancora osservato questi elementi) */
if (window.IntersectionObserver) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
}
