// js/admin.js — Admin panel
import { supabase } from './supabase.js';
import { escapeHtml, CRITERIA } from './utils.js';
import { isAdmin } from './auth.js';
import { fireConfetti } from './effects.js';

export function initAdmin() {
  // Nothing to init — renderAdmin is called on tab switch
}

export async function renderAdmin() {
  if (!isAdmin()) return;

  const list = document.getElementById('admin-pending-list');
  const empty = document.getElementById('admin-empty');
  if (!list) return;

  const { data: pending } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (!pending || pending.length === 0) {
    list.innerHTML = '';
    empty?.classList.add('visible');
    return;
  }

  empty?.classList.remove('visible');
  list.innerHTML = pending.map(p => {
    const id = p.id;
    return `
      <div class="admin-item" id="admin-item-${escapeHtml(id)}">
        <div class="admin-item-header">
          <h3 class="admin-item-title">${escapeHtml(p.name)}</h3>
          <span class="stage-tag ${p.track}">${p.track === 'mvp' ? 'MVP' : 'Idea'}</span>
        </div>
        <div class="admin-item-meta">${escapeHtml(p.contact_email)} · Submitted ${new Date(p.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</div>

        <div class="admin-item-field"><strong>Problem:</strong> ${escapeHtml(p.problem)}</div>
        <div class="admin-item-field"><strong>Solution:</strong> ${escapeHtml(p.solution)}</div>
        <div class="admin-item-field-sm"><strong>Target User:</strong> ${escapeHtml(p.target_user)}</div>
        <div class="admin-item-field"><strong>MVP Scope:</strong> ${escapeHtml(p.mvp_scope)}</div>
        ${p.current_team ? `<div class="admin-item-field-sm"><strong>Current Team:</strong> ${escapeHtml(p.current_team)}</div>` : ''}

        <div class="scoring-section">
          <h4>Score Each Criterion (0-20)</h4>
          ${CRITERIA.map(c => `
            <div class="scoring-row">
              <label>${c.label}</label>
              <input type="range" min="0" max="20" value="10" class="score-slider" data-id="${escapeHtml(id)}" data-key="${c.key}"
                oninput="this.nextElementSibling.textContent = this.value; window.__updateTotal('${escapeHtml(id)}')" />
              <span class="score-val">10</span>
            </div>
          `).join('')}
          <div class="score-total">Total Score: <span id="total-${escapeHtml(id)}" class="score-total-num">50</span>/100</div>
        </div>

        <div class="form-group">
          <label class="feedback-label">Written Feedback</label>
          <textarea id="feedback-${escapeHtml(id)}" rows="2" placeholder="Provide feedback for the team..."></textarea>
        </div>

        <div class="admin-actions">
          <button class="btn btn-primary" id="approve-${escapeHtml(id)}" onclick="window.__adminDecision('${escapeHtml(id)}', 'approved')">Approve &amp; Publish</button>
          <button class="btn btn-secondary" onclick="window.__adminDecision('${escapeHtml(id)}', 'revision')">Return for Revision</button>
        </div>
        <div class="approval-error-msg alert alert-error" id="admin-error-${escapeHtml(id)}"></div>
      </div>
    `;
  }).join('');

  // Update totals and button states after render
  pending.forEach(p => window.__updateTotal(p.id));
}

window.__updateTotal = function(id) {
  const sliders = document.querySelectorAll(`.score-slider[data-id="${id}"]`);
  let total = 0;
  sliders.forEach(s => total += parseInt(s.value, 10));
  const el = document.getElementById('total-' + id);
  if (el) {
    el.textContent = total;
    el.className = total >= 60 ? 'score-total-num pass' : 'score-total-num fail';
  }
  const approveBtn = document.getElementById('approve-' + id);
  if (approveBtn) approveBtn.disabled = total < 60;
};

window.__adminDecision = async function(id, decision) {
  const sliders = document.querySelectorAll(`.score-slider[data-id="${id}"]`);
  const scores = {};
  let total = 0;
  sliders.forEach(s => {
    scores[s.dataset.key] = parseInt(s.value, 10);
    total += parseInt(s.value, 10);
  });
  const feedback = document.getElementById('feedback-' + id)?.value.trim() || '';
  const errEl = document.getElementById('admin-error-' + id);

  if (decision === 'revision' && !feedback) {
    if (errEl) {
      errEl.textContent = 'Please provide feedback when returning for revision.';
      errEl.classList.add('visible');
    }
    return;
  }

  const { error } = await supabase
    .from('projects')
    .update({
      status: decision,
      scores,
      total_score: total,
      feedback: feedback || null,
    })
    .eq('id', id);

  if (error) {
    if (errEl) {
      errEl.textContent = error.message;
      errEl.classList.add('visible');
    }
    return;
  }

  if (decision === 'approved') fireConfetti();
  renderAdmin();
};
