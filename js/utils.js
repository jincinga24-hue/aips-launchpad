// js/utils.js — Shared utilities

// ─── SVG ICON LIBRARY ─────────────────────────────────────────────────────────
// Lucide/Feather style: thin stroke, no fill, currentColor, 18x18 default
export const ICONS = {
  rocket: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3"/></svg>',
  users: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  lightbulb: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>',
  star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  message: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  pencil: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 014 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  handshake: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>',
  inbox: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>',
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  refresh: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
  clipboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
  user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  folder: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
  calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  trophy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M6 3H3v7a6 6 0 006 6 6 6 0 006-6V3h-3"/><line x1="6" y1="3" x2="18" y2="3"/></svg>',
  instagram: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
};

export const AVAILABILITY_OPTIONS = {
  looking: { label: 'Looking for projects', color: '#2DB757' },
  open:    { label: 'Open to chat',         color: '#007AFF' },
  busy:    { label: 'Busy',                 color: '#86868b' },
};

export const CATEGORIES = ['FinTech', 'EdTech', 'Health', 'Social Impact', 'AI/ML', 'Sustainability', 'Productivity', 'Entertainment', 'Other'];

export const CATEGORY_COLORS = {
  'FinTech':        { bg: '#e8f0fe', color: '#1a56db' },
  'EdTech':         { bg: '#fce8ff', color: '#9333ea' },
  'Health':         { bg: '#ffe8e8', color: '#e53e3e' },
  'Social Impact':  { bg: '#fff3e0', color: '#dd6b20' },
  'AI/ML':          { bg: '#e6fffa', color: '#047481' },
  'Sustainability': { bg: '#e8f7ed', color: '#276749' },
  'Productivity':   { bg: '#ebe8fe', color: '#5850ec' },
  'Entertainment':  { bg: '#fff0f5', color: '#d53f8c' },
  'Other':          { bg: '#f5f5f7', color: '#86868b' },
};

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const CRITERIA = [
  { key: 'problemClarity', label: 'Problem Clarity' },
  { key: 'solutionFeasibility', label: 'Solution Feasibility' },
  { key: 'targetUser', label: 'Target User' },
  { key: 'mvpScope', label: 'MVP Scope' },
  { key: 'teamNeeds', label: 'Team Needs' },
];

export const ADVANCED_CRITERIA = [
  { key: 'marketDemand', label: 'Market Demand' },
  { key: 'differentiation', label: 'Differentiation' },
  { key: 'technicalFeasibility', label: 'Technical Feasibility' },
  { key: 'businessModel', label: 'Business Model' },
  { key: 'teamReadiness', label: 'Team Readiness' },
  { key: 'presentationQuality', label: 'Presentation Quality' },
];

export const ROLE_COLORS = {
  Build: '#007AFF',
  Design: '#FF2D55',
  Research: '#5856D6',
  Grow: '#FF9500',
  Advise: '#34C759',
};

export const ABILITIES = [
  { id: 'coding', label: 'Coding' },
  { id: 'design', label: 'Design' },
  { id: 'research', label: 'Research' },
  { id: 'comm', label: 'Communication' },
  { id: 'domain', label: 'Domain' },
];

export function renderRadarSvg(svgId, values, color, cx, cy, maxR) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const n = values.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  let svgContent = '';
  // Grid rings
  [0.33, 0.66, 1].forEach(ring => {
    const r = maxR * ring;
    let points = '';
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      points += `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)} `;
    }
    svgContent += `<polygon points="${points.trim()}" fill="none" stroke="#e0e0e0" stroke-width="1"/>`;
  });
  // Axis lines
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    svgContent += `<line x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(angle)}" y2="${cy + maxR * Math.sin(angle)}" stroke="#e0e0e0" stroke-width="1"/>`;
  }
  // Data polygon
  let dataPoints = '';
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    const r = (values[i] / 10) * maxR;
    dataPoints += `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)} `;
  }
  svgContent += `<polygon points="${dataPoints.trim()}" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>`;
  // Data points
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    const r = (values[i] / 10) * maxR;
    svgContent += `<circle cx="${cx + r * Math.cos(angle)}" cy="${cy + r * Math.sin(angle)}" r="3" fill="${color}"/>`;
  }
  // Labels
  const labels = ABILITIES.map(a => a.label);
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    const lx = cx + (maxR + 14) * Math.cos(angle);
    const ly = cy + (maxR + 14) * Math.sin(angle);
    const anchor = Math.abs(Math.cos(angle)) < 0.01 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
    svgContent += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" font-size="9" fill="#86868b">${labels[i]}</text>`;
  }
  svg.innerHTML = svgContent;
}

export function renderMiniRadar(values, color) {
  const cx = 50, cy = 50, maxR = 40, n = values.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;
  let svgContent = '';
  [0.5, 1].forEach(ring => {
    const r = maxR * ring;
    let points = '';
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      points += `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)} `;
    }
    svgContent += `<polygon points="${points.trim()}" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>`;
  });
  let dataPoints = '';
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    const r = (values[i] / 10) * maxR;
    dataPoints += `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)} `;
  }
  svgContent += `<polygon points="${dataPoints.trim()}" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="1.5"/>`;
  return `<svg width="100" height="100" viewBox="0 0 100 100" class="mini-radar-svg">${svgContent}</svg>`;
}
