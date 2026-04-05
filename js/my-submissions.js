// js/my-submissions.js — Status view for project owners
import { supabase } from './supabase.js';
import { getUser, isLoggedIn } from './auth.js';
import { escapeHtml } from './utils.js';
import { renderTradingCard } from './player-card.js';
import { prefillAndEdit } from './submit.js';

export function initMySubmissions() {
  // Wire up resubmit buttons via event delegation on the list container
  document.getElementById('my-submissions-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-resubmit');
    if (!btn) return;
    const projectId = btn.dataset.projectId;
    if (projectId) window.__prefillAndEdit?.(projectId);
  });
}

export async function loadMySubmissions() {
  const user = getUser();
  const list = document.getElementById('my-submissions-list');
  const empty = document.getElementById('my-submissions-empty');

  if (!user || !list) return;

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!projects || projects.length === 0) {
    list.innerHTML = '';
    empty?.classList.add('visible');
    return;
  }

  empty?.classList.remove('visible');

  // For approved projects, get player cards WITH emails (owner view)
  const approvedIds = projects.filter(p => p.status === 'approved').map(p => p.id);
  const cardsByProject = {};
  if (approvedIds.length > 0) {
    const { data: cards } = await supabase
      .from('player_cards')
      .select('*')
      .in('project_id', approvedIds);
    (cards || []).forEach(c => {
      if (!cardsByProject[c.project_id]) cardsByProject[c.project_id] = [];
      cardsByProject[c.project_id].push(c);
    });
  }

  list.innerHTML = projects.map(p => {
    const date = new Date(p.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    const cards = cardsByProject[p.id] || [];
    return `
      <div class="submission-item">
        <div class="submission-item-header">
          <strong>${escapeHtml(p.name)}</strong>
          <span class="status-badge ${p.status}">${p.status}</span>
        </div>
        <div class="submission-meta">Track: ${p.track === 'mvp' ? 'MVP' : 'Idea'} · Submitted ${date}${p.total_score !== null ? ` · Score: ${p.total_score}/100` : ''}</div>
        ${p.status === 'revision' && p.feedback ? `
          <div class="revision-box">
            <div class="rev-label">Committee Feedback</div>
            <div class="rev-feedback">${escapeHtml(p.feedback)}</div>
            <button class="btn-resubmit" data-project-id="${escapeHtml(p.id)}">Edit &amp; Resubmit</button>
          </div>
        ` : (p.feedback ? `<div class="feedback-box">${escapeHtml(p.feedback)}</div>` : '')}
        ${p.status === 'approved' && cards.length > 0 ? `
          <div class="applicants-section">
            <h4 style="font-size:14px; margin: 16px 0 8px;">People who want to join (${cards.length})</h4>
            <div class="player-cards-grid">
              ${cards.map(card => renderTradingCard(card, true)).join('')}
            </div>
          </div>
        ` : ''}
        ${p.status === 'approved' && cards.length === 0 ? `
          <div class="empty-applicants">No applicants yet. Share your project to attract teammates!</div>
        ` : ''}
      </div>
    `;
  }).join('');

  // Store projects for resubmit lookup
  window.__myProjects = projects;
}

// Global helper for resubmit — looks up project from cached list
window.__prefillAndEdit = function(projectId) {
  const projects = window.__myProjects || [];
  const project = projects.find(p => p.id === projectId);
  if (project) prefillAndEdit(project.id, project);
};
