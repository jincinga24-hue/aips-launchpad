// js/app.js — Router, nav, init
import { initAuth, getUser, getProfile, isAdmin, isLoggedIn, signOut, signInWithGoogle, signInWithEmail, signUpWithEmail } from './auth.js';
import { renderBoard, initBoard, renderStats } from './board.js';
import { renderAdmin, initAdmin } from './admin.js';
import { initSubmit } from './submit.js';
import { initMySubmissions, loadMySubmissions } from './my-submissions.js';
import { initPlayerCard } from './player-card.js';

let currentTab = 'home';
let isSignUp = false;

export function showTab(tab) {
  // Auth guard — require login for submit, my-submissions
  if (['submit', 'my-submissions'].includes(tab) && !isLoggedIn()) {
    showTab('auth');
    return;
  }
  if (tab === 'admin' && !isAdmin()) return;

  currentTab = tab;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const page = document.getElementById('page-' + tab);
  const tabBtn = document.getElementById('tab-' + tab);
  if (page) page.classList.add('active');
  if (tabBtn) tabBtn.classList.add('active');

  // Render dynamic content
  if (tab === 'board') renderBoard();
  if (tab === 'home') { renderStats(); requestAnimationFrame(initCountUp); }
  if (tab === 'admin') renderAdmin();
  if (tab === 'my-submissions') loadMySubmissions();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNav(user, profile) {
  const navUser = document.getElementById('nav-user');
  const adminTab = document.getElementById('admin-tab-btn');

  if (user && profile) {
    navUser.innerHTML = `
      <span class="nav-user-name">${escapeNavText(profile.display_name || user.email)}</span>
      <button class="btn-logout" id="btn-logout">Log out</button>
    `;
    navUser.style.display = 'flex';
    document.getElementById('btn-logout').addEventListener('click', async () => {
      await signOut();
    });
  } else {
    navUser.innerHTML = `<a href="#" class="nav-tab" onclick="window.__showTab('auth'); return false;">Log in</a>`;
    navUser.style.display = 'flex';
  }

  if (profile?.role === 'admin') {
    adminTab?.classList.add('visible');
  } else {
    adminTab?.classList.remove('visible');
  }
}

function escapeNavText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function initCountUp() {
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

function initSpotlightCards() {
  document.addEventListener('mousemove', function(e) {
    const cards = document.querySelectorAll('.spotlight-card, .trading-card');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
    });
  });
}

function initClickSpark() {
  const canvas = document.createElement('canvas');
  canvas.id = 'click-spark-canvas';
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
        startTime: now
      });
    }
  });
}

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '-40px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function initFilterPills() {
  document.querySelectorAll('.filter-bar').forEach(bar => {
    const pill = document.createElement('div');
    pill.className = 'filter-pill';
    bar.style.position = 'relative';
    bar.insertBefore(pill, bar.firstChild);

    function updatePill() {
      const active = bar.querySelector('.filter-btn.active');
      if (!active) { pill.style.opacity = '0'; return; }
      pill.style.opacity = '1';
      pill.style.left = active.offsetLeft + 'px';
      pill.style.width = active.offsetWidth + 'px';
      pill.style.top = active.offsetTop + 'px';
      pill.style.height = active.offsetHeight + 'px';
    }

    bar.addEventListener('click', () => requestAnimationFrame(updatePill));
    requestAnimationFrame(updatePill);
  });
}

// Global functions for HTML onclick handlers
window.__showTab = showTab;
window.__openProjectDetail = null; // set by board.js
window.__openPcModal = null;       // set by player-card.js

async function init() {
  // Auth UI event listeners
  document.getElementById('btn-google-login')?.addEventListener('click', async () => {
    await signInWithGoogle();
  });

  document.getElementById('auth-email-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errEl = document.getElementById('auth-error');
    errEl.classList.remove('visible');

    try {
      if (isSignUp) {
        const name = document.getElementById('auth-name').value.trim();
        await signUpWithEmail(email, password, name);
        errEl.className = 'alert alert-success visible';
        errEl.textContent = 'Check your email to confirm your account!';
      } else {
        await signInWithEmail(email, password);
        showTab('home');
      }
    } catch (err) {
      errEl.className = 'alert alert-error visible';
      errEl.textContent = err.message;
    }
  });

  document.getElementById('auth-toggle-link')?.addEventListener('click', () => {
    isSignUp = !isSignUp;
    document.getElementById('auth-name').style.display = isSignUp ? 'block' : 'none';
    document.getElementById('auth-submit-btn').textContent = isSignUp ? 'Sign up' : 'Log in';
    document.getElementById('auth-toggle-text').textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
    document.getElementById('auth-toggle-link').textContent = isSignUp ? 'Log in' : 'Sign up';
  });

  // Nav tab clicks — event delegation (removes need for inline onclick on nav tabs)
  document.querySelector('.nav-tabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-tab');
    if (!btn) return;
    const tabMap = {
      'tab-launch': 'submit',
      'tab-projects': 'board',
      'tab-dashboard': 'my-submissions',
      'admin-tab-btn': 'admin',
    };
    const tab = tabMap[btn.id];
    if (tab) { e.preventDefault(); showTab(tab); }
  });

  // Nav logo
  document.querySelector('.nav-logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    showTab('home');
  });

  // Hero CTAs — use data-tab attribute
  document.querySelector('.hero-ctas')?.addEventListener('click', (e) => {
    const container = e.target.closest('[data-tab]');
    if (!container) return;
    showTab(container.dataset.tab);
  });

  await initAuth((user, profile) => {
    updateNav(user, profile);
    renderStats();
    if (currentTab === 'board') renderBoard();
    if (currentTab === 'admin' && isAdmin()) renderAdmin();
    // If user just logged in and was on auth page, go home
    if (user && currentTab === 'auth') showTab('home');
  });

  initSubmit();
  initBoard();
  initAdmin();
  initMySubmissions();
  initPlayerCard();
  initSpotlightCards();
  initClickSpark();
  initScrollReveal();
  initFilterPills();

  showTab('home');
  renderStats();
}

// Modules are deferred — DOM is already ready when this runs
async function safeInit() {
  try {
    await init();
  } catch (err) {
    console.error('AIPS init failed:', err);
    // Show error visually so user knows something went wrong
    const nav = document.getElementById('nav-user');
    if (nav) {
      nav.style.display = 'flex';
      nav.innerHTML = `<span style="color:red;font-size:12px;">Error: ${err.message}</span>`;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInit);
} else {
  safeInit();
}
