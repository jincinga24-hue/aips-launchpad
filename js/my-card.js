// js/my-card.js — Personal Player Card profile (build once, join with one click)
import { supabase } from './supabase.js';
import { getUser, getProfile } from './auth.js';
import { escapeHtml, ROLE_COLORS, ABILITIES, AVAILABILITY_OPTIONS, renderRadarSvg } from './utils.js';

export const CARD_THEMES = {
  green:  '#2DB757',
  blue:   '#007AFF',
  purple: '#5856D6',
  orange: '#FF9500',
  red:    '#FF2D55',
};

// Module state (never mutated in-place — reassigned)
let _savedProfile = null;
let _pendingAvatarUrl = null; // URL from storage upload (takes priority over mc-avatar input)
let _selectedRoles = [];
let _selectedTheme = 'green';
let _skillTags = [];
let _showcase = [];
let _endorsements = [];

// ─── Public API ───────────────────────────────────────────────────────────────

export async function initMyCard() {
  // Role buttons
  document.getElementById('mc-role-grid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.mc-role-btn');
    if (!btn) return;
    const role = btn.dataset.role;
    const idx = _selectedRoles.indexOf(role);
    if (idx >= 0) {
      _selectedRoles = _selectedRoles.filter(r => r !== role);
    } else {
      _selectedRoles = [..._selectedRoles, role];
    }
    _syncRoleButtons();
    renderCardPreview();
  });

  // Ability sliders
  ABILITIES.forEach(a => {
    document.getElementById('mc-ab-' + a.id)?.addEventListener('input', () => {
      const val = document.getElementById('mc-ab-' + a.id)?.value;
      const display = document.getElementById('mc-abv-' + a.id);
      if (display) display.textContent = val;
      renderCardPreview();
    });
  });

  // Theme picker
  document.getElementById('mc-theme-picker')?.addEventListener('click', (e) => {
    const circle = e.target.closest('.mc-theme-circle');
    if (!circle) return;
    _selectedTheme = circle.dataset.theme;
    _syncThemePicker();
    renderCardPreview();
  });

  // Live preview on any text/textarea/select input
  ['mc-name', 'mc-degree', 'mc-superpower', 'mc-bio', 'mc-portfolio',
   'mc-github', 'mc-linkedin', 'mc-instagram', 'mc-avatar-url', 'mc-year-level'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderCardPreview);
    document.getElementById(id)?.addEventListener('change', renderCardPreview);
  });

  // Availability radio buttons
  document.querySelectorAll('input[name="mc-availability"]').forEach(radio => {
    radio.addEventListener('change', renderCardPreview);
  });

  // Skill tags input
  const skillInput = document.getElementById('mc-skill-input');
  function _addSkillFromInput() {
    if (!skillInput) return;
    const tag = skillInput.value.trim();
    if (tag && _skillTags.length < 8 && !_skillTags.includes(tag)) {
      _skillTags = [..._skillTags, tag];
      skillInput.value = '';
      _renderSkillTags();
      renderCardPreview();
    }
  }
  if (skillInput) {
    skillInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); _addSkillFromInput(); }
    });
  }
  document.getElementById('mc-skill-add-btn')?.addEventListener('click', _addSkillFromInput);

  // Showcase add button
  document.getElementById('mc-add-showcase')?.addEventListener('click', () => {
    if (_showcase.length >= 3) return;
    _showcase = [..._showcase, { title: '', description: '', link: '' }];
    _renderShowcaseRows();
  });

  // Avatar upload
  _initAvatarUpload();

  // Avatar remove button
  document.getElementById('avatar-remove-btn')?.addEventListener('click', _clearAvatar);

  // Avatar URL paste — live preview on input
  document.getElementById('mc-avatar-url')?.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url && /^https?:\/\/.+/i.test(url)) {
      _pendingAvatarUrl = url;
      _showAvatarPreview(url);
      renderCardPreview();
    }
  });

  // Save button
  document.getElementById('mc-save-btn')?.addEventListener('click', saveMyCard);

  await loadMyCard();
}

export async function loadMyCard() {
  const user = getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    _showMcAlert('error', 'Failed to load your profile.');
    return;
  }

  _savedProfile = data || null;

  if (data) {
    _populateForm(data);
  } else {
    // Pre-fill name from auth profile
    const profile = getProfile();
    const nameEl = document.getElementById('mc-name');
    if (nameEl && profile?.display_name) nameEl.value = profile.display_name;
  }

  // Load endorsements
  await _loadEndorsements(user.id);

  renderCardPreview();
}

export async function saveMyCard() {
  const user = getUser();
  if (!user) return;

  const name       = document.getElementById('mc-name')?.value.trim() || '';
  const degree     = document.getElementById('mc-degree')?.value.trim() || '';
  const superpower = document.getElementById('mc-superpower')?.value.trim() || '';
  const bio        = document.getElementById('mc-bio')?.value.trim() || '';
  const portfolio  = document.getElementById('mc-portfolio')?.value.trim() || '';
  const github     = document.getElementById('mc-github')?.value.trim() || '';
  const linkedin   = document.getElementById('mc-linkedin')?.value.trim() || '';
  const instagram  = document.getElementById('mc-instagram')?.value.trim() || '';
  const avatarUrl  = _pendingAvatarUrl === null ? '' : (_pendingAvatarUrl || document.getElementById('mc-avatar-url')?.value.trim() || '');
  const yearLevel  = document.getElementById('mc-year-level')?.value || '';
  const availability = document.querySelector('input[name="mc-availability"]:checked')?.value || '';

  if (!name || !degree || !superpower || _selectedRoles.length === 0) {
    _showMcAlert('error', 'Please fill in Name, Degree, Superpower, and select at least one Role.');
    return;
  }

  const abilities = {
    coding:   parseInt(document.getElementById('mc-ab-coding')?.value || 5, 10),
    design:   parseInt(document.getElementById('mc-ab-design')?.value || 5, 10),
    research: parseInt(document.getElementById('mc-ab-research')?.value || 5, 10),
    comm:     parseInt(document.getElementById('mc-ab-comm')?.value || 5, 10),
    domain:   parseInt(document.getElementById('mc-ab-domain')?.value || 5, 10),
  };

  const payload = {
    user_id:       user.id,
    name,
    degree,
    roles:         _selectedRoles,
    superpower,
    bio,
    portfolio_url: portfolio || null,
    github_url:    github || null,
    linkedin_url:  linkedin || null,
    instagram_url: instagram || null,
    avatar_url:    avatarUrl || null,
    year_level:    yearLevel || null,
    availability:  availability || null,
    skill_tags:    _skillTags,
    showcase:      _showcase.filter(s => s.title.trim()),
    past_projects: document.getElementById('mc-past-projects')?.value.trim() || null,
    abilities,
    card_theme:    _selectedTheme,
  };

  const btn = document.getElementById('mc-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  const { data, error } = await supabase
    .from('player_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (btn) { btn.disabled = false; btn.textContent = 'Save Card'; }

  if (error) {
    _showMcAlert('error', error.message);
    return;
  }

  _savedProfile = data;
  _showMcAlert('success', 'Player card saved! You can now join teams with one click.');
}

export function getMyCard() {
  return _savedProfile;
}

export function renderCardPreview() {
  const container = document.getElementById('mc-preview-container');
  if (!container) return;

  const name       = document.getElementById('mc-name')?.value.trim() || 'Your Name';
  const degree     = document.getElementById('mc-degree')?.value.trim() || 'Degree + Year';
  const superpower = document.getElementById('mc-superpower')?.value.trim() || 'Your superpower tagline';
  const bio        = document.getElementById('mc-bio')?.value.trim() || '';
  const portfolio  = document.getElementById('mc-portfolio')?.value.trim() || '';
  const github     = document.getElementById('mc-github')?.value.trim() || '';
  const linkedin   = document.getElementById('mc-linkedin')?.value.trim() || '';
  const instagram  = document.getElementById('mc-instagram')?.value.trim() || '';
  const avatarUrl  = _pendingAvatarUrl === null ? '' : (_pendingAvatarUrl || document.getElementById('mc-avatar-url')?.value.trim() || '');
  const yearLevel  = document.getElementById('mc-year-level')?.value || '';
  const availability = document.querySelector('input[name="mc-availability"]:checked')?.value || '';
  const roles      = _selectedRoles;
  const theme      = CARD_THEMES[_selectedTheme] || CARD_THEMES.green;

  const abilities = [
    parseInt(document.getElementById('mc-ab-coding')?.value || 5, 10),
    parseInt(document.getElementById('mc-ab-design')?.value || 5, 10),
    parseInt(document.getElementById('mc-ab-research')?.value || 5, 10),
    parseInt(document.getElementById('mc-ab-comm')?.value || 5, 10),
    parseInt(document.getElementById('mc-ab-domain')?.value || 5, 10),
  ];

  const roleBadges = roles.length > 0
    ? roles.map(r => `<span class="preview-role-badge" style="background:${ROLE_COLORS[r] || theme}22;color:${ROLE_COLORS[r] || theme};border:1px solid ${ROLE_COLORS[r] || theme}40">${escapeHtml(r)}</span>`).join('')
    : '<span class="preview-role-badge" style="background:#f5f5f7;color:#86868b;border:1px solid #d2d2d7">No role yet</span>';

  const avatarHtml = avatarUrl
    ? `<img class="mc-preview-avatar" src="${escapeHtml(avatarUrl)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="mc-preview-avatar-initials" style="display:none;background:${theme}">${_getInitials(name)}</div>`
    : `<div class="mc-preview-avatar-initials" style="background:${theme}">${_getInitials(name)}</div>`;

  const availHtml = availability && AVAILABILITY_OPTIONS[availability]
    ? `<div class="mc-preview-avail"><span class="mc-avail-indicator" style="background:${AVAILABILITY_OPTIONS[availability].color}"></span>${escapeHtml(AVAILABILITY_OPTIONS[availability].label)}</div>`
    : '';

  const yearBadge = yearLevel
    ? `<span class="mc-preview-year-badge">${escapeHtml(yearLevel)}</span>`
    : '';

  const skillPills = _skillTags.length > 0
    ? `<div class="mc-preview-skills">${_skillTags.map(t => `<span class="mc-skill-pill">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  const links = [
    portfolio && `<a href="${escapeHtml(portfolio)}" target="_blank" rel="noopener" class="preview-link-icon" title="Portfolio">${SVG_LINK}</a>`,
    github    && `<a href="${escapeHtml(github)}"    target="_blank" rel="noopener" class="preview-link-icon" title="GitHub">${SVG_GITHUB}</a>`,
    linkedin  && `<a href="${escapeHtml(linkedin)}"  target="_blank" rel="noopener" class="preview-link-icon" title="LinkedIn">${SVG_LINKEDIN}</a>`,
    instagram && `<a href="${escapeHtml(instagram)}" target="_blank" rel="noopener" class="preview-link-icon" title="Instagram">${SVG_INSTAGRAM}</a>`,
  ].filter(Boolean).join('');

  const showcaseHtml = _showcase.filter(s => s.title.trim()).length > 0
    ? `<div class="mc-preview-showcase">${_showcase.filter(s => s.title.trim()).map(s =>
        `<div class="mc-showcase-item">${s.link ? `<a href="${escapeHtml(s.link)}" target="_blank" rel="noopener">` : ''}<span class="mc-showcase-title">${escapeHtml(s.title)}</span>${s.link ? '</a>' : ''}${s.description ? `<span class="mc-showcase-desc">${escapeHtml(s.description)}</span>` : ''}</div>`
      ).join('')}</div>`
    : '';

  const endorseHtml = _endorsements.length > 0
    ? `<div class="mc-preview-endorsements">${_endorsements.slice(0, 2).map(e =>
        `<div class="mc-endorse-quote"><em>"${escapeHtml(e.message)}"</em> — ${escapeHtml(e.from_name || 'Anonymous')}</div>`
      ).join('')}</div>`
    : '';

  const radarId = 'mc-preview-radar';

  container.innerHTML = `
    <div class="mc-preview-card" style="border-top: 4px solid ${theme};">
      <div class="mc-preview-header">
        ${avatarHtml}
        <div class="mc-preview-header-info">
          <div class="mc-preview-roles">${roleBadges}</div>
          <div class="mc-preview-name">${escapeHtml(name)}</div>
          <div class="mc-preview-degree">${escapeHtml(degree)}${yearBadge}</div>
        </div>
      </div>
      ${availHtml}
      <div class="mc-preview-superpower">"${escapeHtml(superpower)}"</div>
      ${bio ? `<div class="mc-preview-bio">${escapeHtml(bio)}</div>` : ''}
      ${skillPills}
      <svg id="${radarId}" width="180" height="180" viewBox="0 0 180 180" class="mc-preview-radar"></svg>
      ${showcaseHtml}
      ${endorseHtml}
      ${links ? `<div class="mc-preview-links">${links}</div>` : ''}
    </div>
  `;

  renderRadarSvg(radarId, abilities, theme, 90, 90, 68);
}

// ─── Full card HTML for trading card display (richer version) ─────────────────
export function renderFullCard(profile, options = {}) {
  const { showLinks = true } = options;
  const theme = CARD_THEMES[profile.card_theme] || CARD_THEMES.green;
  const roles = profile.roles || [];
  const abilities = [
    profile.abilities?.coding  ?? 5,
    profile.abilities?.design  ?? 5,
    profile.abilities?.research ?? 5,
    profile.abilities?.comm    ?? 5,
    profile.abilities?.domain  ?? 5,
  ];

  const radarHtml = _buildInlineRadar(abilities, theme);
  const roleBadges = roles.map(r =>
    `<span class="tc-role-badge role-${escapeHtml(r)}" style="background:${ROLE_COLORS[r] || theme}22;color:${ROLE_COLORS[r] || theme}">${escapeHtml(r)}</span>`
  ).join(' ');

  const links = showLinks ? [
    profile.portfolio_url && `<a href="${escapeHtml(profile.portfolio_url)}" target="_blank" rel="noopener" class="tc-link-icon" title="Portfolio">${SVG_LINK}</a>`,
    profile.github_url    && `<a href="${escapeHtml(profile.github_url)}"    target="_blank" rel="noopener" class="tc-link-icon" title="GitHub">${SVG_GITHUB}</a>`,
    profile.linkedin_url  && `<a href="${escapeHtml(profile.linkedin_url)}"  target="_blank" rel="noopener" class="tc-link-icon" title="LinkedIn">${SVG_LINKEDIN}</a>`,
    profile.instagram_url && `<a href="${escapeHtml(profile.instagram_url)}" target="_blank" rel="noopener" class="tc-link-icon" title="Instagram">${SVG_INSTAGRAM}</a>`,
  ].filter(Boolean).join('') : '';

  return `
    <div class="trading-card trading-card-rich" style="border-top:4px solid ${theme};">
      <div class="tc-roles">${roleBadges}</div>
      <div class="tc-name">${escapeHtml(profile.name)}</div>
      <div class="tc-degree">${escapeHtml(profile.degree)}</div>
      <div class="tc-superpower">"${escapeHtml(profile.superpower)}"</div>
      ${profile.bio ? `<div class="tc-bio">${escapeHtml(profile.bio)}</div>` : ''}
      ${radarHtml}
      ${links ? `<div class="tc-links">${links}</div>` : ''}
    </div>
  `;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _populateForm(data) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('mc-name',         data.name);
  set('mc-degree',       data.degree);
  set('mc-superpower',   data.superpower);
  set('mc-bio',          data.bio);
  set('mc-portfolio',    data.portfolio_url);
  set('mc-github',       data.github_url);
  set('mc-linkedin',     data.linkedin_url);
  set('mc-instagram',    data.instagram_url);
  set('mc-avatar-url',   data.avatar_url);
  if (data.avatar_url) {
    _pendingAvatarUrl = data.avatar_url;
    _showAvatarPreview(data.avatar_url);
  }
  set('mc-year-level',   data.year_level);
  set('mc-past-projects',data.past_projects);

  // Availability
  if (data.availability) {
    const radio = document.querySelector(`input[name="mc-availability"][value="${data.availability}"]`);
    if (radio) radio.checked = true;
  }

  // Skill tags
  _skillTags = Array.isArray(data.skill_tags) ? [...data.skill_tags] : [];
  _renderSkillTags();

  // Showcase
  _showcase = Array.isArray(data.showcase) ? data.showcase.map(s => ({ ...s })) : [];
  _renderShowcaseRows();

  ABILITIES.forEach(a => {
    const slider  = document.getElementById('mc-ab-' + a.id);
    const display = document.getElementById('mc-abv-' + a.id);
    const val = data.abilities?.[a.id] ?? 5;
    if (slider)  slider.value = val;
    if (display) display.textContent = val;
  });

  _selectedRoles = Array.isArray(data.roles) ? [...data.roles] : [];
  _selectedTheme = data.card_theme || 'green';
  _syncRoleButtons();
  _syncThemePicker();
}

function _syncRoleButtons() {
  document.querySelectorAll('.mc-role-btn').forEach(btn => {
    const role = btn.dataset.role;
    const active = _selectedRoles.includes(role);
    btn.classList.toggle('mc-role-active', active);
    btn.style.borderColor = active ? (ROLE_COLORS[role] || '#2DB757') : '';
    btn.style.color       = active ? (ROLE_COLORS[role] || '#2DB757') : '';
    btn.style.background  = active ? (ROLE_COLORS[role] || '#2DB757') + '15' : '';
  });
}

function _syncThemePicker() {
  document.querySelectorAll('.mc-theme-circle').forEach(c => {
    c.classList.toggle('mc-theme-selected', c.dataset.theme === _selectedTheme);
  });
}

function _showMcAlert(type, msg) {
  const el = document.getElementById('mc-alert');
  if (!el) return;
  el.className = `alert alert-${type} visible`;
  el.textContent = msg;
  setTimeout(() => { el.className = 'alert'; }, 4000);
}

function _renderSkillTags() {
  const list = document.getElementById('mc-skill-tags-list');
  if (!list) return;
  list.innerHTML = _skillTags.map((tag, i) =>
    `<span class="mc-skill-tag-pill">${escapeHtml(tag)}<button type="button" class="mc-skill-tag-remove" data-idx="${i}">&times;</button></span>`
  ).join('');
  list.querySelectorAll('.mc-skill-tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      _skillTags = _skillTags.filter((_, i) => i !== idx);
      _renderSkillTags();
      renderCardPreview();
    });
  });
}

function _renderShowcaseRows() {
  const container = document.getElementById('mc-showcase-rows');
  if (!container) return;
  container.innerHTML = _showcase.map((s, i) => `
    <div class="mc-showcase-row" data-idx="${i}">
      <input type="text" placeholder="Project title" value="${escapeHtml(s.title)}" class="mc-showcase-title-input" />
      <input type="text" placeholder="Short description" value="${escapeHtml(s.description)}" class="mc-showcase-desc-input" />
      <input type="url" placeholder="Link (optional)" value="${escapeHtml(s.link)}" class="mc-showcase-link-input" />
      <button type="button" class="mc-showcase-remove">&times;</button>
    </div>
  `).join('');

  container.querySelectorAll('.mc-showcase-row').forEach(row => {
    const idx = parseInt(row.dataset.idx, 10);
    row.querySelector('.mc-showcase-title-input')?.addEventListener('input', (e) => {
      _showcase = _showcase.map((s, i) => i === idx ? { ...s, title: e.target.value } : s);
      renderCardPreview();
    });
    row.querySelector('.mc-showcase-desc-input')?.addEventListener('input', (e) => {
      _showcase = _showcase.map((s, i) => i === idx ? { ...s, description: e.target.value } : s);
      renderCardPreview();
    });
    row.querySelector('.mc-showcase-link-input')?.addEventListener('input', (e) => {
      _showcase = _showcase.map((s, i) => i === idx ? { ...s, link: e.target.value } : s);
      renderCardPreview();
    });
    row.querySelector('.mc-showcase-remove')?.addEventListener('click', () => {
      _showcase = _showcase.filter((_, i) => i !== idx);
      _renderShowcaseRows();
      renderCardPreview();
    });
  });

  // Toggle add button
  const addBtn = document.getElementById('mc-add-showcase');
  if (addBtn) addBtn.style.display = _showcase.length >= 3 ? 'none' : '';
}

async function _loadEndorsements(userId) {
  const { data, error } = await supabase
    .from('endorsements')
    .select('*, from_profile:profiles!endorsements_from_user_id_fkey(display_name)')
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    _endorsements = [];
    return;
  }

  _endorsements = (data || []).map(e => ({
    ...e,
    from_name: e.from_profile?.display_name || 'Someone',
  }));

  _renderEndorsementsSection();
}

function _renderEndorsementsSection() {
  const section = document.getElementById('mc-endorsements-section');
  const list = document.getElementById('mc-endorsements-list');
  if (!section || !list) return;

  if (_endorsements.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  list.innerHTML = _endorsements.map(e =>
    `<div class="mc-endorsement-item"><em>"${escapeHtml(e.message)}"</em><span class="mc-endorsement-from"> — ${escapeHtml(e.from_name)}</span></div>`
  ).join('');
}

function _getInitials(name) {
  if (!name || name === 'Your Name') return '?';
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}

function _buildInlineRadar(values, color) {
  const cx = 50, cy = 50, maxR = 38, n = values.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;
  let s = '';
  [0.5, 1].forEach(ring => {
    const r = maxR * ring;
    let pts = '';
    for (let i = 0; i < n; i++) {
      const a = startAngle + i * angleStep;
      pts += `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)} `;
    }
    s += `<polygon points="${pts.trim()}" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>`;
  });
  let dp = '';
  for (let i = 0; i < n; i++) {
    const a = startAngle + i * angleStep;
    const r = (values[i] / 10) * maxR;
    dp += `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)} `;
  }
  s += `<polygon points="${dp.trim()}" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="1.5"/>`;
  return `<svg width="100" height="100" viewBox="0 0 100 100" class="mini-radar-svg">${s}</svg>`;
}

// ─── Avatar upload helpers ────────────────────────────────────────────────────

function _initAvatarUpload() {
  const zone = document.getElementById('avatar-upload');
  const fileInput = document.getElementById('avatar-file');
  if (!zone || !fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) _handleAvatarFile(file);
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('avatar-drag-over');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('avatar-drag-over');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('avatar-drag-over');
    const file = e.dataTransfer.files?.[0];
    if (file) _handleAvatarFile(file);
  });
}

function _handleAvatarFile(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    _showMcAlert('error', 'Please upload a JPG, PNG, or WebP image.');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    _showMcAlert('error', 'Image must be under 2MB.');
    return;
  }

  // Instant preview via FileReader
  const reader = new FileReader();
  reader.onload = (e) => _showAvatarPreview(e.target.result);
  reader.readAsDataURL(file);

  // Upload to Supabase Storage in background
  _uploadAvatarFile(file);
}

async function _uploadAvatarFile(file) {
  const user = getUser();
  if (!user) return;

  const ext = file.name.split('.').pop().toLowerCase() || 'jpg';
  const path = `${user.id}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    _showMcAlert('error', 'Avatar upload failed: ' + error.message);
    return;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  // Add cache-buster so browser doesn't show old cached avatar
  const cacheBusted = publicUrl + '?t=' + Date.now();
  _pendingAvatarUrl = cacheBusted;
  _showAvatarPreview(cacheBusted);
  renderCardPreview();
}

function _showAvatarPreview(src) {
  const preview = document.getElementById('avatar-preview-lg');
  const initials = document.getElementById('avatar-initials-lg');
  const zone = document.getElementById('avatar-upload');
  const removeBtn = document.getElementById('avatar-remove-btn');
  if (!preview) return;

  preview.style.backgroundImage = `url(${src})`;
  preview.classList.add('avatar-has-image');
  if (initials) initials.style.display = 'none';
  if (zone) zone.classList.add('avatar-upload-filled');
  if (removeBtn) removeBtn.style.display = 'inline-block';
}

function _clearAvatar() {
  const preview = document.getElementById('avatar-preview-lg');
  const initials = document.getElementById('avatar-initials-lg');
  const zone = document.getElementById('avatar-upload');
  const removeBtn = document.getElementById('avatar-remove-btn');
  const urlInput = document.getElementById('mc-avatar-url');
  const fileInput = document.getElementById('avatar-file');

  _pendingAvatarUrl = null; // null = explicitly cleared (different from '' which means "no change")
  if (preview) {
    preview.style.backgroundImage = '';
    preview.classList.remove('avatar-has-image');
  }
  if (initials) initials.style.display = '';
  if (zone) zone.classList.remove('avatar-upload-filled');
  if (removeBtn) removeBtn.style.display = 'none';
  if (urlInput) urlInput.value = '';
  if (fileInput) fileInput.value = '';
  renderCardPreview();
}

// ─── SVG icon constants ───────────────────────────────────────────────────────
const SVG_LINK = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`;
const SVG_GITHUB = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>`;
const SVG_LINKEDIN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`;
const SVG_INSTAGRAM = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;
