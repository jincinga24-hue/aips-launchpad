// js/submit.js — Project submission form
import { supabase } from './supabase.js';
import { getUser } from './auth.js';
import { fireConfetti } from './effects.js';
import { CATEGORIES } from './utils.js';

let currentTrack = 'idea';
let editingProjectId = null;

export function initSubmit() {
  const form = document.getElementById('submit-form');
  if (!form) return;

  form.addEventListener('submit', handleSubmit);

  // Populate category dropdown
  const categorySelect = document.getElementById('f-category');
  if (categorySelect) {
    CATEGORIES.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  }

  // Track toggle
  document.getElementById('btn-track-idea')?.addEventListener('click', () => setTrack('idea'));
  document.getElementById('btn-track-mvp')?.addEventListener('click', () => setTrack('mvp'));

  // Role chips — event delegation
  document.getElementById('roles-grid')?.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      const chip = e.target.closest('.role-chip');
      if (chip) chip.classList.toggle('selected', e.target.checked);
    }
  });
}

const FORM_LABELS = {
  idea: {
    problem: 'Problem Statement',
    problemHint: 'Aim for 2-4 sentences. Specificity wins.',
    solution: 'Your Proposed Solution',
    solutionHint: '',
    target: 'Target User',
    targetHint: 'Who specifically? The more precise, the better.',
    scope: 'MVP Scope',
    scopeHint: 'Think: one core feature, working end-to-end.',
  },
  mvp: {
    problem: 'What problem does your product solve?',
    problemHint: 'Describe the problem your MVP addresses. Include any evidence of demand.',
    solution: 'What does your MVP do?',
    solutionHint: 'Describe what your prototype currently does, not what you plan to build.',
    target: 'Who is using it?',
    targetHint: 'Do you have real users? How many? Who are they?',
    scope: "What's next?",
    scopeHint: 'What features or improvements do you need help building next?',
  },
};

export function setTrack(track) {
  currentTrack = track;
  document.getElementById('btn-track-idea')?.classList.toggle('active', track === 'idea');
  document.getElementById('btn-track-mvp')?.classList.toggle('active', track === 'mvp');
  const mvpFields = document.getElementById('mvp-fields');
  if (mvpFields) {
    if (track === 'mvp') mvpFields.classList.add('visible');
    else mvpFields.classList.remove('visible');
  }
  const formCard = document.querySelector('.form-card');
  if (formCard) {
    if (track === 'mvp') formCard.classList.add('submit-track-mvp');
    else formCard.classList.remove('submit-track-mvp');
  }

  // Update labels and hints based on track
  const labels = FORM_LABELS[track] || FORM_LABELS.idea;
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set('label-problem', labels.problem + ' <span>*</span>');
  set('hint-problem', labels.problemHint);
  set('label-solution', labels.solution + ' <span>*</span>');
  set('hint-solution', labels.solutionHint);
  set('label-target', labels.target + ' <span>*</span>');
  set('hint-target', labels.targetHint);
  set('label-scope', labels.scope + ' <span>*</span>');
  set('hint-scope', labels.scopeHint);
}

function getSelectedRoles() {
  return Array.from(document.querySelectorAll('#roles-grid input:checked')).map(cb => cb.value);
}

async function handleSubmit(e) {
  e.preventDefault();
  const user = getUser();
  if (!user) return;

  const errorAlert = document.getElementById('submit-alert-error');
  const successAlert = document.getElementById('submit-alert-success');
  errorAlert.classList.remove('visible');
  successAlert.classList.remove('visible');

  const name = document.getElementById('f-name').value.trim();
  const problem = document.getElementById('f-problem').value.trim();
  const solution = document.getElementById('f-solution').value.trim();
  const targetUser = document.getElementById('f-target').value.trim();
  const mvpScope = document.getElementById('f-scope').value.trim();
  const category = document.getElementById('f-category').value;
  const roles = getSelectedRoles();
  const email = document.getElementById('f-email').value.trim();
  const contactMethod = document.getElementById('f-contact-method').value.trim();
  const demoLink = document.getElementById('f-demo')?.value.trim() || null;
  const videoLink = document.getElementById('f-video')?.value.trim() || null;
  const currentTeam = document.getElementById('f-team')?.value.trim() || null;

  if (!name || !problem || !solution || !targetUser || !mvpScope || !category || roles.length === 0 || !email) {
    errorAlert.textContent = 'Please fill in all required fields and select at least one role.';
    errorAlert.classList.add('visible');
    return;
  }

  const safeUrl = /^https?:\/\//i;
  if (demoLink && !safeUrl.test(demoLink)) {
    errorAlert.textContent = 'Demo link must start with http:// or https://';
    errorAlert.classList.add('visible');
    return;
  }
  if (videoLink && !safeUrl.test(videoLink)) {
    errorAlert.textContent = 'Video link must start with http:// or https://';
    errorAlert.classList.add('visible');
    return;
  }
  if (currentTrack === 'mvp' && !currentTeam) {
    errorAlert.textContent = 'Please describe your current team for MVP submissions.';
    errorAlert.classList.add('visible');
    return;
  }

  const projectData = {
    user_id: user.id,
    track: currentTrack,
    name,
    problem,
    solution,
    target_user: targetUser,
    mvp_scope: mvpScope,
    category,
    roles_needed: roles,
    contact_email: email,
    contact_method: contactMethod || null,
    demo_link: demoLink,
    video_link: videoLink,
    current_team: currentTeam,
  };

  let error;
  if (editingProjectId) {
    ({ error } = await supabase
      .from('projects')
      .update({ ...projectData, status: 'pending', scores: null, total_score: null, feedback: null })
      .eq('id', editingProjectId));
    editingProjectId = null;
  } else {
    ({ error } = await supabase.from('projects').insert(projectData));
  }

  if (error) {
    errorAlert.textContent = error.message || 'Something went wrong. Please try again.';
    errorAlert.classList.add('visible');
    return;
  }

  // Reset form
  document.getElementById('submit-form').reset();
  document.querySelectorAll('.role-chip').forEach(c => c.classList.remove('selected'));
  setTrack('idea');

  successAlert.innerHTML = 'Your submission has been received! Track your status in <strong>My Submissions</strong>.';
  successAlert.classList.add('visible');
  successAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  fireConfetti();
}

export function prefillAndEdit(projectId, project) {
  editingProjectId = projectId;
  setTrack(project.track);
  document.getElementById('f-name').value = project.name || '';
  document.getElementById('f-problem').value = project.problem || '';
  document.getElementById('f-solution').value = project.solution || '';
  document.getElementById('f-target').value = project.target_user || '';
  document.getElementById('f-scope').value = project.mvp_scope || '';
  document.getElementById('f-email').value = project.contact_email || '';
  document.getElementById('f-contact-method').value = project.contact_method || '';
  if (document.getElementById('f-category')) document.getElementById('f-category').value = project.category || '';
  if (document.getElementById('f-demo')) document.getElementById('f-demo').value = project.demo_link || '';
  if (document.getElementById('f-video')) document.getElementById('f-video').value = project.video_link || '';
  if (document.getElementById('f-team')) document.getElementById('f-team').value = project.current_team || '';

  // Set roles
  document.querySelectorAll('#roles-grid .role-chip').forEach(chip => {
    const cb = chip.querySelector('input');
    const isSelected = (project.roles_needed || []).includes(cb.value);
    cb.checked = isSelected;
    chip.classList.toggle('selected', isSelected);
  });

  window.__showTab('submit');
  document.getElementById('submit-form').scrollIntoView({ behavior: 'smooth' });
}
