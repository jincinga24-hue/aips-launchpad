// js/effects.js — Visual effect functions (confetti, card flip, spotlight, scroll reveal, count-up, click spark, intro splash)
import { escapeHtml, ROLE_COLORS } from './utils.js';

// ─── INTRO SPLASH ─────────────────────────────────────────────────────────────
export function initIntroSplash() {
  const splash = document.getElementById('intro-splash');
  if (!splash) return;

  // Only show once per session
  if (sessionStorage.getItem('aips-splash-shown')) {
    splash.style.display = 'none';
    triggerHeroReveal();
    return;
  }

  sessionStorage.setItem('aips-splash-shown', '1');

  // After ~2s, split the panels away
  setTimeout(() => {
    splash.classList.add('split');

    // After split animation completes, remove splash and reveal hero text
    setTimeout(() => {
      splash.style.display = 'none';
      triggerHeroReveal();
    }, 650);
  }, 2000);
}

function triggerHeroReveal() {
  const reveals = document.querySelectorAll('.hero-reveal');
  reveals.forEach(el => {
    // Use the element's existing transition-delay from inline style
    el.classList.add('animate-in');
  });
}

// ─── CONFETTI ────────────────────────────────────────────────────────────────
export function fireConfetti() {
  let canvas = document.getElementById('confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '9999',
    });
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#2DB757', '#5EC847', '#B8E63A', '#FFD700', '#FF6B6B', '#4ECDC4', '#fff'];
  const pieces = [];

  for (let i = 0; i < 80; i++) {
    pieces.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: -(Math.random() * 12 + 4),
      w: Math.random() * 10 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      gravity: 0.25 + Math.random() * 0.15,
      opacity: 1,
    });
  }

  const startTime = performance.now();

  function draw(now) {
    const elapsed = now - startTime;
    if (elapsed > 2500) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach(p => {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.rotation += p.rotSpeed;
      if (elapsed > 1800) p.opacity = Math.max(0, 1 - (elapsed - 1800) / 700);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

// ─── CARD FLIP REVEAL ────────────────────────────────────────────────────────
export function showCardFlipReveal(cardData) {
  const roles = cardData.roles || (cardData.role ? [cardData.role] : []);
  const primaryRole = roles[0] || 'Build';
  const color = ROLE_COLORS[primaryRole] || '#2DB757';
  const abilities = [
    cardData.abilities.coding,
    cardData.abilities.design,
    cardData.abilities.research,
    cardData.abilities.comm,
    cardData.abilities.domain,
  ];

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);z-index:700;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;';
  overlay.innerHTML = `
    <div class="card-flip-container">
      <div class="card-flip-inner" id="flip-inner">
        <div class="card-flip-front">?</div>
        <div class="card-flip-back" style="padding:14px 12px;text-align:center;">
          ${cardData.avatar_url ? `<img src="${escapeHtml(cardData.avatar_url)}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;margin:0 auto 8px;display:block;border:2px solid ${color};" />` : ''}
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:${color};margin-bottom:8px;">${escapeHtml(primaryRole)}</div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;margin-bottom:2px;">${escapeHtml(cardData.name)}</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px;">${escapeHtml(cardData.degree)}</div>
          <div style="font-size:11px;font-style:italic;color:var(--text);margin-bottom:10px;border-left:2px solid var(--border);padding-left:6px;text-align:left;">"${escapeHtml(cardData.superpower)}"</div>
          <svg width="120" height="120" viewBox="0 0 120 120" style="display:block;margin:0 auto 8px;" id="flip-radar"></svg>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    const svgEl = document.getElementById('flip-radar');
    if (svgEl) {
      const cx = 60;
      const cy = 60;
      const maxR = 44;
      const n = 5;
      const angleStep = (2 * Math.PI) / n;
      const startAngle = -Math.PI / 2;
      let svg = '';
      [0.5, 1.0].forEach(pct => {
        const pts = Array.from({ length: n }, (_, i) => {
          const a = startAngle + i * angleStep;
          return `${cx + maxR * pct * Math.cos(a)},${cy + maxR * pct * Math.sin(a)}`;
        }).join(' ');
        svg += `<polygon points="${pts}" fill="none" stroke="#e0e0e5" stroke-width="0.8"/>`;
      });
      const dataPts = abilities.map((v, i) => {
        const a = startAngle + i * angleStep;
        const r = (v / 10) * maxR;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(' ');
      svg += `<polygon points="${dataPts}" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="1.5"/>`;
      svgEl.innerHTML = svg;
    }

    setTimeout(() => {
      const flipInner = document.getElementById('flip-inner');
      if (flipInner) flipInner.classList.add('flipped');
    }, 400);
  });

  const removeOverlay = () => {
    overlay.style.opacity = '0';
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 300);
  };

  overlay.addEventListener('click', removeOverlay);
  setTimeout(() => { if (overlay.parentNode) removeOverlay(); }, 3000);
}

// ─── SPOTLIGHT CARDS ─────────────────────────────────────────────────────────
export function initSpotlightCards() {
  document.addEventListener('mousemove', function(e) {
    const cards = document.querySelectorAll('.spotlight-card, .trading-card');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      if (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom
      ) {
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
    });
  });
}

// ─── CLICK SPARK ─────────────────────────────────────────────────────────────
export function initClickSpark() {
  const canvas = document.createElement('canvas');
  canvas.id = 'click-spark-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '9998',
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const sparks = [];
  const SPARK_COLOR = '#2DB757';
  const SPARK_COUNT = 8;
  const SPARK_SIZE = 10;
  const SPARK_RADIUS = 15;
  const DURATION = 400;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function easeOut(t) { return t * (2 - t); }

  function draw(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      const elapsed = timestamp - s.startTime;
      if (elapsed >= DURATION) { sparks.splice(i, 1); continue; }
      const progress = elapsed / DURATION;
      const eased = easeOut(progress);
      const dist = eased * SPARK_RADIUS * 2;
      const lineLen = SPARK_SIZE * (1 - eased);
      const x1 = s.x + dist * Math.cos(s.angle);
      const y1 = s.y + dist * Math.sin(s.angle);
      const x2 = s.x + (dist + lineLen) * Math.cos(s.angle);
      const y2 = s.y + (dist + lineLen) * Math.sin(s.angle);
      ctx.strokeStyle = SPARK_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  document.addEventListener('click', function(e) {
    const target = e.target.closest('.star-border-container, .btn-primary, .btn-approve');
    if (!target) return;
    const now = performance.now();
    for (let i = 0; i < SPARK_COUNT; i++) {
      sparks.push({
        x: e.clientX,
        y: e.clientY,
        angle: (2 * Math.PI * i) / SPARK_COUNT,
        startTime: now,
      });
    }
  });
}

// ─── SCROLL REVEAL ───────────────────────────────────────────────────────────
export function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  // If IntersectionObserver not supported, show all immediately
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px' });
  els.forEach(el => {
    // If element is already in viewport, reveal immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('visible');
    } else {
      observer.observe(el);
    }
  });
}

// ─── COUNT-UP ────────────────────────────────────────────────────────────────
export function initCountUp() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const val = parseInt(el.textContent, 10) || 0;
        if (val > 0) animateCountUp(el, val);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-num').forEach(el => observer.observe(el));
}

function animateCountUp(el, target) {
  const duration = 1200;
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
