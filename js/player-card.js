// js/player-card.js — Player card creator and trading card display
import { supabase } from './supabase.js';
import { getUser } from './auth.js';
import { escapeHtml, ROLE_COLORS, ABILITIES, AVAILABILITY_OPTIONS, renderRadarSvg, renderMiniRadar } from './utils.js';
import { fireConfetti, showCardFlipReveal } from './effects.js';
import { getMyCard } from './my-card.js';

let currentPcProjectId = null;
let selectedPcRoles = [];

export function initPlayerCard() {
  // Role buttons — event delegation
  document.getElementById('pc-role-grid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.pc-role-btn');
    if (!btn) return;
    const role = btn.dataset.role;
    const idx = selectedPcRoles.indexOf(role);
    if (idx >= 0) {
      selectedPcRoles = selectedPcRoles.filter(r => r !== role);
      btn.className = 'pc-role-btn';
    } else {
      selectedPcRoles = [...selectedPcRoles, role];
      btn.className = 'pc-role-btn selected-' + role.toLowerCase();
    }
    updatePcRadar();
  });

  // Ability sliders — update radar on input
  ABILITIES.forEach(a => {
    document.getElementById('ab-' + a.id)?.addEventListener('input', updatePcRadar);
  });

  // Submit button in pc-modal
  document.querySelector('.pc-modal .btn.btn-primary')?.addEventListener('click', handleSubmitCard);

  // Modal close button
  document.querySelector('.pc-close')?.addEventListener('click', closePcModal);

  // Modal backdrop click
  document.getElementById('pc-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'pc-modal') closePcModal();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('pc-modal')?.classList.contains('open')) {
      closePcModal();
    }
  });

  updatePcRadar();
}

function updatePcRadar() {
  ABILITIES.forEach(a => {
    const slider = document.getElementById('ab-' + a.id);
    const val = document.getElementById('abv-' + a.id);
    if (slider && val) val.textContent = slider.value;
  });
  const vals = ABILITIES.map(a => parseInt(document.getElementById('ab-' + a.id)?.value || 5, 10));
  const color = selectedPcRoles.length > 0 ? ROLE_COLORS[selectedPcRoles[0]] : '#2DB757';
  renderRadarSvg('pc-radar-preview', vals, color, 100, 100, 80);
}

export function openPcModal(projectId) {
  // Prefer one-click join if user already has a saved profile
  const saved = getMyCard();
  if (saved) {
    // Delegate to board's join flow via global
    const joinBtn = document.querySelector(`[data-join-with-card="${projectId}"]`);
    if (joinBtn) { joinBtn.click(); return; }
  }

  currentPcProjectId = projectId;
  selectedPcRoles = [];
  ['pc-name', 'pc-degree', 'pc-superpower', 'pc-email'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ABILITIES.forEach(a => {
    const slider = document.getElementById('ab-' + a.id);
    const val = document.getElementById('abv-' + a.id);
    if (slider) slider.value = 5;
    if (val) val.textContent = '5';
  });
  document.querySelectorAll('.pc-role-btn').forEach(b => b.className = 'pc-role-btn');
  const alertEl = document.getElementById('pc-alert');
  if (alertEl) alertEl.className = 'alert';
  updatePcRadar();
  document.getElementById('pc-modal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

window.__openPcModal = openPcModal;

function closePcModal() {
  document.getElementById('pc-modal')?.classList.remove('open');
  document.body.style.overflow = '';
}

async function handleSubmitCard() {
  const user = getUser();
  if (!user) return;

  const name = document.getElementById('pc-name').value.trim();
  const degree = document.getElementById('pc-degree').value.trim();
  const superpower = document.getElementById('pc-superpower').value.trim();
  const email = document.getElementById('pc-email').value.trim();
  const alertEl = document.getElementById('pc-alert');

  if (!name || !degree || !superpower || !email || selectedPcRoles.length === 0) {
    alertEl.className = 'alert alert-error visible';
    alertEl.textContent = 'Please fill in all fields and select at least one role.';
    return;
  }

  const abilities = {
    coding: parseInt(document.getElementById('ab-coding').value, 10),
    design: parseInt(document.getElementById('ab-design').value, 10),
    research: parseInt(document.getElementById('ab-research').value, 10),
    comm: parseInt(document.getElementById('ab-comm').value, 10),
    domain: parseInt(document.getElementById('ab-domain').value, 10),
  };

  const { error } = await supabase.from('player_cards').insert({
    project_id: currentPcProjectId,
    user_id: user.id,
    name,
    degree,
    roles: selectedPcRoles,
    superpower,
    email,
    abilities,
  });

  if (error) {
    if (error.code === '23505') {
      alertEl.className = 'alert alert-error visible';
      alertEl.textContent = 'You have already submitted a player card for this project.';
    } else {
      alertEl.className = 'alert alert-error visible';
      alertEl.textContent = error.message;
    }
    return;
  }

  closePcModal();
  fireConfetti();
  showCardFlipReveal({
    name,
    degree,
    roles: selectedPcRoles,
    superpower,
    email,
    abilities,
  });
  // Reopen project detail to show the new card
  window.__openProjectDetail?.(currentPcProjectId);
}

export function renderTradingCard(card, showEmail, options = {}) {
  const { showEndorseBtn = false, projectId = null } = options;
  const roles = card.roles || [];
  const primaryRole = roles[0] || 'Build';
  const themeColor = card.card_theme
    ? ({ green:'#2DB757', blue:'#007AFF', purple:'#5856D6', orange:'#FF9500', red:'#FF2D55' }[card.card_theme] || '#2DB757')
    : null;
  const color = themeColor || ROLE_COLORS[primaryRole] || '#2DB757';
  const abilities = [
    card.abilities?.coding  ?? 5,
    card.abilities?.design  ?? 5,
    card.abilities?.research ?? 5,
    card.abilities?.comm    ?? 5,
    card.abilities?.domain  ?? 5,
  ];
  const miniRadar = renderMiniRadar(abilities, color);
  const roleBadges = roles.map(r => `<span class="tc-role-badge role-${escapeHtml(r)}">${escapeHtml(r)}</span>`).join(' ');

  const SVG_LINK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`;
  const SVG_GITHUB = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>`;
  const SVG_LINKEDIN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`;
  const SVG_INSTAGRAM = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;

  const links = [
    card.portfolio_url && `<a href="${escapeHtml(card.portfolio_url)}" target="_blank" rel="noopener" class="tc-link-icon" title="Portfolio">${SVG_LINK}</a>`,
    card.github_url    && `<a href="${escapeHtml(card.github_url)}"    target="_blank" rel="noopener" class="tc-link-icon" title="GitHub">${SVG_GITHUB}</a>`,
    card.linkedin_url  && `<a href="${escapeHtml(card.linkedin_url)}"  target="_blank" rel="noopener" class="tc-link-icon" title="LinkedIn">${SVG_LINKEDIN}</a>`,
    card.instagram_url && `<a href="${escapeHtml(card.instagram_url)}" target="_blank" rel="noopener" class="tc-link-icon" title="Instagram">${SVG_INSTAGRAM}</a>`,
  ].filter(Boolean).join('');

  // Avatar (48px on trading card)
  const avatarInitials = _tcInitials(card.name);
  const avatarHtml = card.avatar_url
    ? `<img class="tc-avatar" src="${escapeHtml(card.avatar_url)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="tc-avatar-initials" style="display:none;background:${color}">${avatarInitials}</div>`
    : `<div class="tc-avatar-initials" style="background:${color}">${avatarInitials}</div>`;

  // Availability dot
  const avail = card.availability && AVAILABILITY_OPTIONS[card.availability];
  const availHtml = avail
    ? `<div class="tc-avail"><span class="tc-avail-dot" style="background:${avail.color}"></span>${escapeHtml(avail.label)}</div>`
    : '';

  // Year level badge
  const yearBadge = card.year_level
    ? `<span class="tc-year-badge">${escapeHtml(card.year_level)}</span>`
    : '';

  // Skill tags
  const skillTags = Array.isArray(card.skill_tags) && card.skill_tags.length > 0
    ? `<div class="tc-skill-tags">${card.skill_tags.slice(0, 6).map(t => `<span class="tc-skill-pill">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  // Showcase
  const showcase = Array.isArray(card.showcase) && card.showcase.length > 0
    ? `<div class="tc-showcase">${card.showcase.slice(0, 3).map(s => `<div class="tc-showcase-item">${s.link ? `<a href="${escapeHtml(s.link)}" target="_blank" rel="noopener">` : ''}${escapeHtml(s.title)}${s.link ? '</a>' : ''}</div>`).join('')}</div>`
    : '';

  // Endorsements on card
  const endorseQuotes = Array.isArray(card._endorsements) && card._endorsements.length > 0
    ? `<div class="tc-endorsements">${card._endorsements.slice(0, 1).map(e => `<div class="tc-endorse-quote"><em>"${escapeHtml(e.message.length > 60 ? e.message.slice(0, 60) + '…' : e.message)}"</em></div>`).join('')}</div>`
    : '';

  // Endorse button (for teammates)
  const endorseBtn = showEndorseBtn && card.user_id
    ? `<button class="tc-endorse-btn" data-endorse-user="${escapeHtml(card.user_id)}" data-endorse-project="${escapeHtml(projectId || '')}">Endorse</button>`
    : '';

  // Contact button (visible to teammates — shows email + socials in a popup)
  const { showContactBtn = false } = options;
  const contactActions = [];
  if (card.email) contactActions.push(`<a href="mailto:${escapeHtml(card.email)}" class="tc-contact-action">Email</a>`);
  if (card.instagram_url) contactActions.push(`<a href="${escapeHtml(card.instagram_url)}" target="_blank" rel="noopener" class="tc-contact-action">Instagram</a>`);
  if (card.linkedin_url) contactActions.push(`<a href="${escapeHtml(card.linkedin_url)}" target="_blank" rel="noopener" class="tc-contact-action">LinkedIn</a>`);
  if (card.github_url) contactActions.push(`<a href="${escapeHtml(card.github_url)}" target="_blank" rel="noopener" class="tc-contact-action">GitHub</a>`);
  if (card.portfolio_url) contactActions.push(`<a href="${escapeHtml(card.portfolio_url)}" target="_blank" rel="noopener" class="tc-contact-action">Portfolio</a>`);
  const contactBtn = showContactBtn && contactActions.length > 0
    ? `<div class="tc-contact-wrap">
        <button class="tc-contact-btn" onclick="this.nextElementSibling.classList.toggle('tc-contact-open')">Contact</button>
        <div class="tc-contact-popup">${contactActions.join('')}</div>
       </div>`
    : '';

  return `
    <div class="trading-card role-${escapeHtml(primaryRole)}" style="${themeColor ? `border-top:3px solid ${themeColor}` : ''}">
      <div class="tc-header-row">
        ${avatarHtml}
        <div class="tc-header-info">
          <div class="tc-roles">${roleBadges}</div>
          <div class="tc-name">${escapeHtml(card.name)}</div>
          <div class="tc-degree">${escapeHtml(card.degree)}${yearBadge}</div>
        </div>
      </div>
      ${availHtml}
      <div class="tc-superpower">"${escapeHtml(card.superpower)}"</div>
      ${card.bio ? `<div class="tc-bio">${escapeHtml(card.bio.length > 100 ? card.bio.slice(0, 100) + '…' : card.bio)}</div>` : ''}
      ${skillTags}
      ${miniRadar}
      ${showcase}
      ${endorseQuotes}
      ${links ? `<div class="tc-links">${links}</div>` : ''}
      ${showEmail ? `<div class="tc-email">${escapeHtml(card.email)}</div>` : ''}
      <div class="tc-actions">
        ${contactBtn}
        ${endorseBtn}
      </div>
    </div>
  `;
}

function _tcInitials(name) {
  if (!name) return '?';
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}
