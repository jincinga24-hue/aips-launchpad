// js/board.js — Project board, filters, detail modal
import { supabase } from './supabase.js';
import { escapeHtml, ROLE_COLORS, CRITERIA, CATEGORIES, CATEGORY_COLORS, ICONS } from './utils.js';
import { renderTradingCard, openPcModal } from './player-card.js';
import { isLoggedIn, getUser } from './auth.js';
import { getMyCard } from './my-card.js';

// ─── Endorsement helpers ────────────────────────────────────────────────────

let currentStageFilter = 'all';
let currentRoleFilter = 'all';
let currentCategoryFilter = 'all';
let searchQuery = '';

export function initBoard() {
  // Populate category filter pills
  const categoryBar = document.getElementById('category-filters');
  if (categoryBar) {
    CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.filter = cat;
      btn.textContent = cat;
      categoryBar.appendChild(btn);
    });
  }

  // Stage filter
  document.getElementById('stage-filters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    currentStageFilter = btn.dataset.filter || 'all';
    document.querySelectorAll('#stage-filters button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderBoard();
  });

  // Role filter
  document.getElementById('role-filters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    currentRoleFilter = btn.dataset.filter || 'all';
    document.querySelectorAll('#role-filters button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderBoard();
  });

  // Category filter
  document.getElementById('category-filters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    currentCategoryFilter = btn.dataset.filter || 'all';
    document.querySelectorAll('#category-filters button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderBoard();
  });

  // Search bar
  document.getElementById('board-search')?.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderBoard();
  });

  // Modal close on backdrop click
  document.getElementById('project-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'project-modal') closeProjectModal();
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('pc-modal')?.classList.contains('open')) return;
      closeProjectModal();
    }
  });

  // Board card clicks — event delegation
  document.getElementById('board-grid')?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-project-id]');
    if (card) openProjectDetail(card.dataset.projectId);
  });
}

function daysAgo(dateStr) {
  const now = new Date();
  const created = new Date(dateStr);
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

function buildCategoryPill(category) {
  if (!category) return '';
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'];
  return `<span class="category-pill" style="background:${colors.bg};color:${colors.color}">${escapeHtml(category)}</span>`;
}

function buildProgressBar(rolesNeeded, playerCards) {
  const needed = (rolesNeeded || []);
  const total = needed.length;
  if (total === 0) return '';

  const filledRoles = new Set((playerCards || []).map(c => c.role));
  const filled = needed.filter(r => filledRoles.has(r)).length;
  const pct = Math.round((filled / total) * 100);

  return `
    <div class="roles-progress">
      <div class="roles-progress-bar-wrap">
        <div class="roles-progress-bar" style="width:${pct}%"></div>
      </div>
      <span class="roles-progress-label">${filled}/${total} roles filled</span>
    </div>
  `;
}

export async function renderBoard() {
  const grid = document.getElementById('board-grid');
  const empty = document.getElementById('board-empty');
  if (!grid) return;

  const [{ data: projects, error }, { data: allCards }] = await Promise.all([
    supabase.from('projects').select('*').eq('status', 'approved').order('created_at', { ascending: false }),
    supabase.from('player_cards').select('project_id, role'),
  ]);

  if (error || !projects) {
    grid.innerHTML = '';
    empty?.classList.add('visible');
    return;
  }

  // Build card counts and filled roles map
  const cardCountMap = {};
  const cardsByProject = {};
  (allCards || []).forEach(c => {
    cardCountMap[c.project_id] = (cardCountMap[c.project_id] || 0) + 1;
    if (!cardsByProject[c.project_id]) cardsByProject[c.project_id] = [];
    cardsByProject[c.project_id].push(c);
  });

  let filtered = projects;
  if (currentStageFilter !== 'all') {
    filtered = filtered.filter(p => p.track === currentStageFilter);
  }
  if (currentRoleFilter !== 'all') {
    filtered = filtered.filter(p => (p.roles_needed || []).includes(currentRoleFilter));
  }
  if (currentCategoryFilter !== 'all') {
    filtered = filtered.filter(p => p.category === currentCategoryFilter);
  }
  if (searchQuery) {
    filtered = filtered.filter(p =>
      (p.name || '').toLowerCase().includes(searchQuery) ||
      (p.problem || '').toLowerCase().includes(searchQuery)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty?.classList.add('visible');
    return;
  }

  empty?.classList.remove('visible');
  grid.innerHTML = filtered.map(p => {
    const applicantCount = cardCountMap[p.id] || 0;
    const projectCards = cardsByProject[p.id] || [];
    const days = daysAgo(p.created_at);
    const endorsedBadge = p.endorsed
      ? `<span class="endorsed-badge">${ICONS.star} AIPS Endorsed</span>`
      : '';

    return `
    <div class="project-card spotlight-card" data-project-id="${escapeHtml(p.id)}">
      <div class="card-header">
        <div class="card-header-left">
          <span class="stage-tag ${p.track}">${p.track === 'mvp' ? 'MVP' : 'Idea'}</span>
          ${buildCategoryPill(p.category)}
        </div>
        <div class="card-header-right">
          ${p.total_score !== null ? `<span class="score-badge">${p.total_score}/100</span>` : ''}
          ${endorsedBadge}
        </div>
      </div>
      <div class="card-title">${escapeHtml(p.name)}</div>
      <div class="card-pitch">${escapeHtml(p.problem.slice(0, 120))}${p.problem.length > 120 ? '…' : ''}</div>
      ${buildProgressBar(p.roles_needed, projectCards)}
      <div class="card-footer">
        <div class="roles-needed">
          ${(p.roles_needed || []).map(r => `<span class="role-tag">${r}</span>`).join('')}
        </div>
        <div class="card-meta-row">
          ${applicantCount > 0 ? `<span class="applicant-count">${ICONS.users} ${applicantCount} applicant${applicantCount !== 1 ? 's' : ''}</span>` : ''}
          <span class="urgency-label">Seeking for ${days}d</span>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

export async function renderStats() {
  const [
    { count: projectCount },
    { count: cardCount },
    { count: pendingCount },
    { count: totalCount },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('player_cards').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
  ]);

  const statProjects = document.getElementById('stat-projects');
  const statContributors = document.getElementById('stat-contributors');
  const statPending = document.getElementById('stat-pending');
  const statIdeas = document.getElementById('stat-ideas');

  if (statProjects) statProjects.textContent = projectCount || 0;
  if (statContributors) statContributors.textContent = cardCount || 0;
  if (statPending) statPending.textContent = pendingCount || 0;
  if (statIdeas) statIdeas.textContent = totalCount || 0;
}

export async function renderFeaturedProject() {
  const container = document.getElementById('featured-project');
  if (!container) return;

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'approved')
    .order('total_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !projects || projects.length === 0) {
    container.innerHTML = '';
    return;
  }

  const p = projects[0];
  const problemExcerpt = p.problem.length > 180 ? p.problem.slice(0, 180) + '…' : p.problem;
  const trackLabel = p.track === 'mvp' ? 'MVP' : 'Idea';

  container.innerHTML = `
    <div class="featured-label">Featured Project</div>
    <div class="featured-card">
      <div class="featured-card-accent"></div>
      <div class="featured-card-body">
        <div class="featured-left">
          <div class="featured-name">${escapeHtml(p.name)}</div>
          <div class="featured-problem">${escapeHtml(problemExcerpt)}</div>
          <div class="featured-meta">
            <span class="stage-tag ${p.track}">${trackLabel}</span>
            ${buildCategoryPill(p.category)}
            ${(p.roles_needed || []).map(r => `<span class="role-tag">${r}</span>`).join('')}
          </div>
        </div>
        <div class="featured-right">
          ${p.total_score !== null ? `
            <div>
              <div class="featured-score">${p.total_score}<span style="font-size:20px;color:var(--muted)">/100</span></div>
              <div class="featured-score-label">Committee Score</div>
            </div>
          ` : ''}
          <button class="featured-view-btn" data-featured-id="${escapeHtml(p.id)}">
            View Project →
          </button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('[data-featured-id]')?.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.featuredId;
    openProjectDetail(id);
  });
}

async function openProjectDetail(projectId) {
  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
  if (!project) return;

  const { data: cards } = await supabase.from('player_cards_public').select('*').eq('project_id', projectId);

  const scoreBreakdown = project.scores ? `
    <div class="modal-section">
      <div class="modal-section-label">Score Breakdown</div>
      <div class="modal-criteria-grid">
        ${CRITERIA.map(c => `
          <div class="modal-criterion-card">
            <div class="crit-label">${c.label}</div>
            <div class="crit-score">${project.scores[c.key] || 0}<span class="score-breakdown-inline">/20</span></div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  let videoEmbed = '';
  if (project.video_link) {
    const youtubeMatch = project.video_link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const loomMatch = project.video_link.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (youtubeMatch) {
      videoEmbed = `<iframe class="modal-video-embed" src="https://www.youtube.com/embed/${youtubeMatch[1]}" allowfullscreen></iframe>`;
    } else if (loomMatch) {
      videoEmbed = `<iframe class="modal-video-embed" src="https://www.loom.com/embed/${loomMatch[1]}" allowfullscreen></iframe>`;
    } else {
      videoEmbed = `<a href="${escapeHtml(project.video_link)}" target="_blank" rel="noopener" class="modal-demo-link">▶ Watch Video</a>`;
    }
  }

  const content = `
    <div class="modal-track-tag">
      <span class="stage-tag ${project.track}">${project.track === 'mvp' ? 'MVP' : 'Idea'}</span>
      ${buildCategoryPill(project.category)}
      ${project.endorsed ? `<span class="endorsed-badge">${ICONS.star} AIPS Endorsed</span>` : ''}
    </div>
    <h2 class="modal-title">${escapeHtml(project.name)}</h2>
    ${project.total_score !== null ? `
      <div class="modal-score-bar">
        <span>Score: ${project.total_score}/100</span>
      </div>
    ` : ''}

    <div class="modal-section">
      <div class="modal-section-label">Problem</div>
      <div class="modal-section-text">${escapeHtml(project.problem)}</div>
    </div>

    <div class="modal-section">
      <div class="modal-section-label">Solution</div>
      <div class="modal-section-text">${escapeHtml(project.solution)}</div>
    </div>

    <div class="modal-section">
      <div class="modal-section-label">Target User</div>
      <div class="modal-section-text">${escapeHtml(project.target_user)}</div>
    </div>

    <div class="modal-section">
      <div class="modal-section-label">MVP Scope</div>
      <div class="modal-section-text">${escapeHtml(project.mvp_scope)}</div>
    </div>

    ${project.current_team ? `
    <div class="modal-section">
      <div class="modal-section-label">Current Team</div>
      <div class="modal-section-text">${escapeHtml(project.current_team)}</div>
    </div>
    ` : ''}

    ${scoreBreakdown}

    ${project.demo_link || project.video_link ? `
      <div class="modal-section">
        <div class="modal-section-label">Links</div>
        ${project.demo_link ? `<a href="${escapeHtml(project.demo_link)}" target="_blank" rel="noopener" class="modal-demo-link">↗ View Demo</a>` : ''}
        ${videoEmbed}
      </div>
    ` : ''}

    <div class="modal-footer">
      <div class="modal-footer-row">
        <div class="roles-needed">
          ${(project.roles_needed || []).map(r => `<span class="role-tag">${r}</span>`).join('')}
        </div>
        ${isLoggedIn()
          ? (() => {
              const savedCard = getMyCard();
              return savedCard
                ? `<button class="btn btn-primary" data-join-with-card="${escapeHtml(project.id)}">Join with Your Card ⚡</button>`
                : `<button class="btn btn-primary" data-go-mycard>Create Your Card First →</button>`;
            })()
          : `<div class="login-prompt">Log in to join this team</div>`
        }
      </div>

      ${(cards || []).length > 0 ? `
        <div class="player-cards-section">
          <h3>Team Applicants <span class="player-cards-count">${cards.length}</span></h3>
          <div class="player-cards-grid">
            ${(cards || []).map(card => {
              const user = getUser();
              const isOwner = user && project.user_id === user.id;
              return renderTradingCard(card, false, { showEndorseBtn: isOwner, projectId: project.id });
            }).join('')}
          </div>
        </div>
      ` : ''}

      ${project.contact_method ? `
        <div class="modal-section" style="margin-top: 16px;">
          <div class="modal-section-label">Want to connect?</div>
          <p style="color: var(--muted); font-size: 13px; margin-bottom: 8px;">Submit a player card above, then reach out to the founder:</p>
          <div style="background: var(--bg); padding: 12px 16px; border-radius: 10px; font-size: 14px; color: var(--text); display:flex; align-items:center; gap:8px;">${ICONS.message} ${escapeHtml(project.contact_method)}</div>
        </div>
      ` : ''}
    </div>
  `;

  const modalContent = document.getElementById('modal-content');
  modalContent.innerHTML = content;

  // One-click join with saved card
  modalContent.querySelector('[data-join-with-card]')?.addEventListener('click', async (e) => {
    const projId = e.currentTarget.dataset.joinWithCard;
    await _joinWithSavedCard(projId, e.currentTarget);
  });

  // Redirect to My Card page if no saved profile
  modalContent.querySelector('[data-go-mycard]')?.addEventListener('click', () => {
    closeProjectModal();
    window.__showTab?.('mycard');
  });

  // Fallback: open pc-modal (legacy)
  modalContent.querySelector('[data-open-pc]')?.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.openPc;
    openPcModal(id);
  });

  // Endorse buttons
  modalContent.querySelectorAll('.tc-endorse-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const toUserId = btn.dataset.endorseUser;
      const projId = btn.dataset.endorseProject;
      _showEndorseForm(btn, toUserId, projId);
    });
  });

  document.getElementById('project-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

window.__openProjectDetail = openProjectDetail;

async function _joinWithSavedCard(projectId, btnEl) {
  const user = getUser();
  const profile = getMyCard();
  if (!user || !profile) return;

  const orig = btnEl.textContent;
  btnEl.disabled = true;
  btnEl.textContent = 'Joining…';

  const payload = {
    project_id: projectId,
    user_id:    user.id,
    name:       profile.name,
    degree:     profile.degree,
    roles:      profile.roles,
    superpower: profile.superpower,
    email:      user.email,
    abilities:  profile.abilities,
  };

  const { error } = await supabase.from('player_cards').insert(payload);

  btnEl.disabled = false;

  if (error) {
    if (error.code === '23505') {
      _showToast('You have already joined this project.', 'info');
    } else {
      _showToast('Could not join: ' + error.message, 'error');
    }
    btnEl.textContent = orig;
    return;
  }

  closeProjectModal();
  _showToast('You\'re in! Card submitted successfully.', 'success');
  // Re-open to show fresh card list
  setTimeout(() => openProjectDetail(projectId), 400);
}

function _showToast(msg, type = 'success') {
  const existing = document.getElementById('aips-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'aips-toast';
  toast.className = `aips-toast aips-toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('aips-toast-visible'));
  setTimeout(() => {
    toast.classList.remove('aips-toast-visible');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

function _showEndorseForm(btn, toUserId, projectId) {
  // Replace button with inline form
  const wrapper = document.createElement('div');
  wrapper.className = 'tc-endorse-form';
  wrapper.innerHTML = `
    <input type="text" class="tc-endorse-input" placeholder="Write a short endorsement…" maxlength="200" />
    <button class="tc-endorse-submit">Send</button>
    <button class="tc-endorse-cancel">Cancel</button>
  `;
  btn.replaceWith(wrapper);

  const input = wrapper.querySelector('.tc-endorse-input');
  input.focus();

  wrapper.querySelector('.tc-endorse-cancel').addEventListener('click', () => {
    const newBtn = document.createElement('button');
    newBtn.className = 'tc-endorse-btn';
    newBtn.dataset.endorseUser = toUserId;
    newBtn.dataset.endorseProject = projectId;
    newBtn.textContent = 'Endorse';
    wrapper.replaceWith(newBtn);
    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      _showEndorseForm(newBtn, toUserId, projectId);
    });
  });

  wrapper.querySelector('.tc-endorse-submit').addEventListener('click', async () => {
    const message = input.value.trim();
    if (!message) return;
    const user = getUser();
    if (!user) return;

    const { error } = await supabase.from('endorsements').insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      project_id: projectId,
      message,
    });

    if (error) {
      _showToast('Could not endorse: ' + error.message, 'error');
      return;
    }

    _showToast('Endorsement sent!', 'success');
    wrapper.innerHTML = '<span style="font-size:12px;color:var(--muted);font-style:italic">Endorsed!</span>';
  });
}

function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (modal?.classList.contains('open')) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.modal-close')?.addEventListener('click', closeProjectModal);
});
