// js/utils.js — Shared utilities

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
