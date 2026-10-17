/*
 * Builds public/resume.html from the same data the site uses, so the résumé never drifts from the portfolio.
 *   npm run build:resume            -> writes public/resume.html
 * Then print it to PDF with Chrome (see README):
 *   chrome --headless=new --print-to-pdf=public/AbhishekChauhan-Resume.pdf --no-pdf-header-footer public/resume.html
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EDUCATION_DATA, EXPERIENCE_DATA, PROFILE_DATA, PROJECTS_DATA, SKILLS_GROUPED } from '../data/portfolio';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const month = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present');
const year = (d: string | null) => (d ? new Date(d).getFullYear() : '');
const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

const p = PROFILE_DATA;
// The résumé shows the featured projects plus a few side projects with public code
const projects = PROJECTS_DATA.filter((pr) => pr.is_featured || [16, 12].includes(pr.id)).slice(0, 8);

const links = [
  p.email && `<a href="mailto:${p.email}">${p.email}</a>`,
  p.phone && `<a href="tel:${p.phone.replace(/\s+/g, '')}">${p.phone}</a>`,
  p.website_url && `<a href="${p.website_url}">${host(p.website_url)}</a>`,
  p.github_url && `<a href="${p.github_url}">${host(p.github_url)}</a>`,
  p.linkedin_url && `<a href="${p.linkedin_url}">linkedin.com/in/abhishek-chauhan</a>`,
].filter(Boolean);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(p.full_name)} - Resume</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 14mm 15mm 14mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Inter, "Segoe UI", Arial, sans-serif; color: #1c1612; font-size: 10.1pt; line-height: 1.42; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  a { color: inherit; text-decoration: none; }
  header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; border-bottom: 2.5px solid #1f7a3f; padding-bottom: 8px; }
  h1 { font-size: 22pt; margin: 0; letter-spacing: -0.01em; line-height: 1.05; }
  .title { font-size: 11pt; font-weight: 600; color: #1f7a3f; margin-top: 3px; }
  .contact { text-align: right; font-size: 9pt; color: #4a4038; line-height: 1.5; max-width: 62mm; }
  .contact a { display: block; }
  .tagline { margin: 9px 0 0; color: #4a4038; }
  h2 { font-size: 9.2pt; text-transform: uppercase; letter-spacing: 0.12em; color: #1f7a3f; margin: 13px 0 5px; padding-bottom: 2px; border-bottom: 1px solid #d9d0c2; }
  .job { margin-top: 7px; page-break-inside: avoid; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .row b { font-size: 10.6pt; }
  .meta { color: #6b6058; font-size: 9pt; white-space: nowrap; }
  .sub { color: #4a4038; font-size: 9.4pt; margin: 1px 0 3px; }
  ul { margin: 2px 0 0; padding-left: 15px; }
  li { margin: 0 0 1.5px; }
  .tech { color: #6b6058; font-size: 8.8pt; margin-top: 3px; }
  .proj { margin-top: 5px; page-break-inside: avoid; }
  .proj .row b { font-size: 10pt; }
  .proj p { margin: 1px 0 0; }
  .skills { display: grid; grid-template-columns: 34mm 1fr; row-gap: 3px; column-gap: 8px; margin-top: 4px; }
  .skills dt { font-weight: 600; }
  .skills dd { margin: 0; color: #2e2622; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
</style>
</head>
<body>
<header>
  <div>
    <h1>${esc(p.full_name)}</h1>
    <div class="title">${esc(p.title)} · Laravel, React, FastAPI, AI-assisted tools</div>
  </div>
  <div class="contact">
    <span>${esc(p.location ?? '')}${p.availability_status === 'available' ? ' · Immediate joiner' : ''}</span>
    ${links.join('\n    ')}
  </div>
</header>
<p class="tagline">${esc(p.summary ?? '')}</p>

<h2>Work experience</h2>
${EXPERIENCE_DATA.map((e) => `
<div class="job">
  <div class="row"><b>${esc(e.company)} — ${esc(e.position)}</b><span class="meta">${month(e.start_date)} – ${month(e.end_date)}</span></div>
  <div class="sub">${esc(e.location ?? '')}${e.duration_label ? ` · ${esc(e.duration_label)}` : ''}</div>
  <ul>${(e.responsibilities ?? []).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
  <div class="tech">${(e.technologies ?? []).join(' · ')}</div>
</div>`).join('')}

<h2>Selected projects</h2>
${projects.map((pr) => `
<div class="proj">
  <div class="row"><b>${esc(pr.title)}</b><span class="meta">${[pr.client, pr.website_url ? host(pr.website_url) : pr.github_url ? host(pr.github_url) : null].filter(Boolean).map((s) => esc(String(s))).join(' · ')}</span></div>
  <p>${esc(pr.description ?? '')}</p>
  <div class="tech">${(pr.technologies ?? []).join(' · ')}</div>
</div>`).join('')}

<h2>Skills</h2>
<dl class="skills">
${Object.entries(SKILLS_GROUPED).map(([group, list]) => `  <dt>${esc(group)}</dt><dd>${list.map((s) => esc(s.name)).join(', ')}</dd>`).join('\n')}
</dl>

<div class="two">
  <div>
    <h2>Education</h2>
    ${EDUCATION_DATA.filter((ed) => ed.degree !== 'High School').map((ed) => `
    <div class="job">
      <div class="row"><b>${esc(ed.degree)}${ed.field_of_study ? `, ${esc(ed.field_of_study)}` : ''}</b><span class="meta">${year(ed.start_date)} – ${year(ed.end_date)}</span></div>
      <div class="sub">${esc(ed.institution)}${ed.location ? `, ${esc(ed.location)}` : ''}</div>
      ${ed.description ? `<p style="margin:2px 0 0">${esc(ed.description)}</p>` : ''}
    </div>`).join('')}
  </div>
  <div>
    <h2>Languages</h2>
    <p style="margin:6px 0 0">${(p.languages ?? []).join(' · ')}</p>
    <h2>Open to</h2>
    <p style="margin:6px 0 0">${(p.open_to ?? []).join(' · ')} · Remote or Meerut / Delhi NCR</p>
  </div>
</div>
</body>
</html>
`;

const out = resolve(process.cwd(), 'public/resume.html');
writeFileSync(out, html);
console.log(`wrote ${out} (${html.length} bytes)`);
