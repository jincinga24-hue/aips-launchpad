// js/player-card.js — Player card creator and trading card display
import { supabase } from './supabase.js';
import { getUser } from './auth.js';
import { escapeHtml, ROLE_COLORS, ABILITIES, renderRadarSvg, renderMiniRadar } from './utils.js';

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
  // Reopen project detail to show the new card
  window.__openProjectDetail?.(currentPcProjectId);
}

export function renderTradingCard(card, showEmail) {
  const roles = card.roles || [];
  const primaryRole = roles[0] || 'Build';
  const color = ROLE_COLORS[primaryRole] || '#2DB757';
  const abilities = [
    card.abilities.coding,
    card.abilities.design,
    card.abilities.research,
    card.abilities.comm,
    card.abilities.domain,
  ];
  const miniRadar = renderMiniRadar(abilities, color);
  const roleBadges = roles.map(r => `<span class="tc-role-badge role-${escapeHtml(r)}">${escapeHtml(r)}</span>`).join(' ');
  return `
    <div class="trading-card role-${escapeHtml(primaryRole)}">
      <div class="tc-roles">${roleBadges}</div>
      <div class="tc-name">${escapeHtml(card.name)}</div>
      <div class="tc-degree">${escapeHtml(card.degree)}</div>
      <div class="tc-superpower">"${escapeHtml(card.superpower)}"</div>
      ${miniRadar}
      ${showEmail ? `<div class="tc-email">${escapeHtml(card.email)}</div>` : ''}
    </div>
  `;
}
