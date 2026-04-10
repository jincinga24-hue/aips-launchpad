// js/my-submissions.js — Dashboard for project owners
import { supabase } from './supabase.js';
import { getUser } from './auth.js';
import { escapeHtml } from './utils.js';
import { prefillAndEdit } from './submit.js';

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

// ─── Status badge HTML ────────────────────────────────────────────────────────

function statusBadge(status) {
  const map = {
    pending: { label: 'Pending', cls: 'pending' },
    approved: { label: 'Approved', cls: 'approved' },
    revision: { label: 'Revision', cls: 'revision' },
  };
  const s = map[status] || { label: status, cls: '' };
  return `<span class="status-badge ${s.cls}">${s.label}</span>`;
}

// ─── Project card HTML ────────────────────────────────────────────────────────

function renderProjectCard(project, cards) {
  const applicantCount = cards.length;
  const scoreText = project.total_score !== null
    ? `<span>🏆 ${project.total_score}/100</span>`
    : '';

  let actions = '';
  if (project.status === 'approved') {
    actions += `<button class="dash-btn dash-btn-primary btn-view-board" data-project-id="${escapeHtml(project.id)}">View on Board</button>`;
  }
  if (project.status === 'revision') {
    actions += `<button class="dash-btn dash-btn-warning btn-resubmit" data-project-id="${escapeHtml(project.id)}">Edit &amp; Resubmit</button>`;
  }
  actions += `<button class="dash-btn dash-btn-secondary btn-toggle-applicants" data-project-id="${escapeHtml(project.id)}">View Applicants (${applicantCount})</button>`;

  let revisionBox = '';
  if (project.status === 'revision' && project.feedback) {
    revisionBox = `
      <div class="revision-feedback-box">
        <div class="rev-label">Committee Feedback</div>
        ${escapeHtml(project.feedback)}
      </div>`;
  }

  let applicantsSection = '';
  if (cards.length > 0) {
    const rows = cards.map(c => `
      <div class="dash-applicant-row">
        <strong>${escapeHtml(c.name || 'Unknown')}</strong>
        <span class="dash-applicant-role">${escapeHtml(c.role || '')}</span>
        <span class="dash-applicant-email">${escapeHtml(c.email || '')}</span>
      </div>`).join('');
    applicantsSection = `
      <div class="dash-applicants-section" id="applicants-${escapeHtml(project.id)}" style="display:none">
        <h4>Applicants (${cards.length})</h4>
        ${rows}
      </div>`;
  } else {
    applicantsSection = `
      <div class="dash-applicants-section" id="applicants-${escapeHtml(project.id)}" style="display:none">
        <div style="font-size:13px; color:var(--muted)">No applicants yet.</div>
      </div>`;
  }

  const track = project.track === 'mvp' ? 'MVP' : 'Idea';
  const date = new Date(project.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

  return `
    <div class="dash-project-card" data-project-id="${escapeHtml(project.id)}">
      <div class="dash-card-header">
        <span class="dash-card-name">${escapeHtml(project.name)}</span>
        ${statusBadge(project.status)}
      </div>
      <div class="dash-card-meta">
        <span>📁 ${track}</span>
        <span>📅 ${date}</span>
        ${scoreText}
        <span>👥 ${applicantCount} applicant${applicantCount === 1 ? '' : 's'}</span>
      </div>
      ${revisionBox}
      <div class="dash-card-actions">${actions}</div>
      ${applicantsSection}
    </div>`;
}

// ─── Activity feed HTML ───────────────────────────────────────────────────────

function renderActivityFeed(events) {
  if (events.length === 0) {
    return '<div class="activity-empty">No recent activity yet.</div>';
  }

  const items = events.map(ev => {
    let icon, text, typeClass;

    if (ev.type === 'apply') {
      icon = '👤';
      typeClass = 'type-apply';
      text = `<strong>${escapeHtml(ev.applicantName)}</strong> applied to join <strong>${escapeHtml(ev.projectName)}</strong> as ${escapeHtml(ev.role)}`;
    } else if (ev.type === 'approved') {
      icon = '✅';
      typeClass = 'type-approved';
      const score = ev.score !== null ? ` Score: ${ev.score}/100` : '';
      text = `Your project <strong>${escapeHtml(ev.projectName)}</strong> was approved!${score}`;
    } else if (ev.type === 'revision') {
      icon = '🔁';
      typeClass = 'type-revision';
      text = `Committee returned <strong>${escapeHtml(ev.projectName)}</strong> for revision`;
    } else {
      icon = '📋';
      typeClass = 'type-pending';
      text = `You submitted <strong>${escapeHtml(ev.projectName)}</strong>`;
    }

    return `
      <div class="activity-item ${typeClass}">
        <div class="activity-icon">${icon}</div>
        <div class="activity-body">
          <div class="activity-text">${text}</div>
          <div class="activity-time">${relativeTime(ev.created_at)}</div>
        </div>
      </div>`;
  }).join('');

  return `<div class="activity-feed">${items}</div>`;
}

// ─── Init (event delegation) ──────────────────────────────────────────────────

export function initMySubmissions() {
  const page = document.getElementById('page-my-submissions');
  if (!page) return;

  page.addEventListener('click', (e) => {
    // Resubmit
    const resubmitBtn = e.target.closest('.btn-resubmit');
    if (resubmitBtn) {
      const projectId = resubmitBtn.dataset.projectId;
      const project = (window.__myProjects || []).find(p => p.id === projectId);
      if (project) prefillAndEdit(project.id, project);
      return;
    }

    // View on board
    const boardBtn = e.target.closest('.btn-view-board');
    if (boardBtn) {
      document.querySelector('[data-page="board"]')?.click();
      return;
    }

    // Toggle applicants
    const toggleBtn = e.target.closest('.btn-toggle-applicants');
    if (toggleBtn) {
      const projectId = toggleBtn.dataset.projectId;
      const section = document.getElementById(`applicants-${projectId}`);
      if (section) {
        const isHidden = section.style.display === 'none';
        section.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden
          ? toggleBtn.textContent.replace('View', 'Hide')
          : toggleBtn.textContent.replace('Hide', 'View');
      }
    }
  });
}

// ─── Load dashboard data ──────────────────────────────────────────────────────

export async function loadMySubmissions() {
  const user = getUser();
  const list = document.getElementById('my-submissions-list');
  const empty = document.getElementById('my-submissions-empty');
  const activityFeed = document.getElementById('dash-activity-feed');

  if (!user || !list) return;

  // Load user's projects
  const { data: projects, error: projectsErr } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (projectsErr) {
    list.innerHTML = '<p style="color:var(--muted);font-size:13px">Failed to load projects.</p>';
    return;
  }

  if (!projects || projects.length === 0) {
    list.innerHTML = '';
    empty?.classList.add('visible');
    if (activityFeed) activityFeed.innerHTML = '<div class="activity-empty">No activity yet.</div>';
    return;
  }

  empty?.classList.remove('visible');
  window.__myProjects = projects;

  const projectIds = projects.map(p => p.id);

  // Load player cards for all projects (owner view)
  const { data: allCards } = await supabase
    .from('player_cards')
    .select('*')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false });

  const cardsByProject = {};
  (allCards || []).forEach(c => {
    if (!cardsByProject[c.project_id]) cardsByProject[c.project_id] = [];
    cardsByProject[c.project_id].push(c);
  });

  // Render project cards
  list.innerHTML = projects.map(p => renderProjectCard(p, cardsByProject[p.id] || [])).join('');

  // Build activity events
  const events = [];

  // "someone applied" events from player cards
  (allCards || []).forEach(card => {
    const project = projects.find(p => p.id === card.project_id);
    events.push({
      type: 'apply',
      projectName: project?.name || 'Unknown',
      applicantName: card.name || 'Someone',
      role: card.role || 'a role',
      created_at: card.created_at,
    });
  });

  // Status change events from projects
  projects.forEach(p => {
    if (p.status === 'approved') {
      events.push({
        type: 'approved',
        projectName: p.name,
        score: p.total_score,
        created_at: p.updated_at || p.created_at,
      });
    } else if (p.status === 'revision') {
      events.push({
        type: 'revision',
        projectName: p.name,
        created_at: p.updated_at || p.created_at,
      });
    } else {
      events.push({
        type: 'submitted',
        projectName: p.name,
        created_at: p.created_at,
      });
    }
  });

  // Sort by created_at desc, take 20
  events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const recentEvents = events.slice(0, 20);

  if (activityFeed) {
    activityFeed.innerHTML = renderActivityFeed(recentEvents);
  }

  // Log to harness
  try {
    await fetch(''); // no-op placeholder — harness log via shell
  } catch (_) { /* ignore */ }
}

// Global resubmit helper
window.__prefillAndEdit = function(projectId) {
  const project = (window.__myProjects || []).find(p => p.id === projectId);
  if (project) prefillAndEdit(project.id, project);
};
