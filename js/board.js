// js/board.js — Project board, filters, detail modal
import { supabase } from './supabase.js';
import { escapeHtml, ROLE_COLORS, CRITERIA } from './utils.js';
import { renderTradingCard, openPcModal } from './player-card.js';
import { isLoggedIn } from './auth.js';

let currentStageFilter = 'all';
let currentRoleFilter = 'all';

export function initBoard() {
  // Filter buttons — event delegation, using data-filter attribute
  document.getElementById('stage-filters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    currentStageFilter = btn.dataset.filter || 'all';
    document.querySelectorAll('#stage-filters button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderBoard();
  });

  document.getElementById('role-filters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    currentRoleFilter = btn.dataset.filter || 'all';
    document.querySelectorAll('#role-filters button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderBoard();
  });

  // Modal close on backdrop click
  document.getElementById('project-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'project-modal') closeProjectModal();
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('pc-modal')?.classList.contains('open')) return; // player-card.js handles this
      closeProjectModal();
    }
  });

  // Board card clicks — event delegation
  document.getElementById('board-grid')?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-project-id]');
    if (card) openProjectDetail(card.dataset.projectId);
  });
}

export async function renderBoard() {
  const grid = document.getElementById('board-grid');
  const empty = document.getElementById('board-empty');
  if (!grid) return;

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error || !projects) {
    grid.innerHTML = '';
    empty?.classList.add('visible');
    return;
  }

  let filtered = projects;
  if (currentStageFilter !== 'all') {
    filtered = filtered.filter(p => p.track === currentStageFilter);
  }
  if (currentRoleFilter !== 'all') {
    filtered = filtered.filter(p => (p.roles_needed || []).includes(currentRoleFilter));
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty?.classList.add('visible');
    return;
  }

  empty?.classList.remove('visible');
  grid.innerHTML = filtered.map(p => `
    <div class="project-card spotlight-card" data-project-id="${escapeHtml(p.id)}">
      <div class="card-header">
        <span class="stage-tag ${p.track}">${p.track === 'mvp' ? 'MVP' : 'Idea'}</span>
        ${p.total_score !== null ? `<span class="score-badge">${p.total_score}/100</span>` : ''}
      </div>
      <div class="card-title">${escapeHtml(p.name)}</div>
      <div class="card-pitch">${escapeHtml(p.problem.slice(0, 120))}${p.problem.length > 120 ? '…' : ''}</div>
      <div class="roles-needed">
        ${(p.roles_needed || []).map(r => `<span class="role-tag">${r}</span>`).join('')}
      </div>
    </div>
  `).join('');
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

  // Get player cards (public view — no emails)
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
    </div>
    <div class="modal-title">${escapeHtml(project.name)}</div>
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
          ? `<button class="btn btn-primary" data-open-pc="${escapeHtml(project.id)}">Join This Team</button>`
          : `<div class="login-prompt">Log in to join this team</div>`
        }
      </div>

      ${(cards || []).length > 0 ? `
        <div class="player-cards-section">
          <h3>Team Applicants <span class="player-cards-count">${cards.length}</span></h3>
          <div class="player-cards-grid">
            ${(cards || []).map(card => renderTradingCard(card, false)).join('')}
          </div>
        </div>
      ` : ''}

      ${project.contact_method ? `
        <div class="modal-section" style="margin-top: 16px;">
          <div class="modal-section-label">Want to connect?</div>
          <p style="color: var(--muted); font-size: 13px; margin-bottom: 8px;">Submit a player card above, then reach out to the founder:</p>
          <div style="background: var(--bg); padding: 12px 16px; border-radius: 10px; font-size: 14px; color: var(--text);">📱 ${escapeHtml(project.contact_method)}</div>
        </div>
      ` : ''}
    </div>
  `;

  const modalContent = document.getElementById('modal-content');
  modalContent.innerHTML = content;

  // Wire up "Join This Team" button via event delegation (avoids inline onclick)
  modalContent.querySelector('[data-open-pc]')?.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.openPc;
    openPcModal(id);
  });

  document.getElementById('project-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

window.__openProjectDetail = openProjectDetail;

function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (modal?.classList.contains('open')) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Close button in modal HTML uses data attribute — wire it up
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.modal-close')?.addEventListener('click', closeProjectModal);
});
