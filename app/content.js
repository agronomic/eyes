import profileData from '../public/content/profileData.json';

/** Site content from profileData.json */
const cv = { ...profileData };

export default cv;

/** Home grid filter pills — keep in sync with tags on projects / sideProjects. */
export const PROJECT_TAGS = ['Product', 'Brand', 'Civic', 'Personal'];

/** Project URLs live under /p/ with an a- prefix on the slug. */
export function slugify(title) {
  const base = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `a-${base}`;
}

export function getProjects() {
  const all = [...cv.projects, ...cv.sideProjects].filter(
    (x) => x.attachments && x.attachments.length > 0
  );
  return sortProjectsByYear([...all]);
}

/** Long-form graduates — featured on home, case-study layout on /p. */
export function getCaseStudies() {
  return getProjects().filter((p) => p.caseStudy);
}

/** Thumbnail archive — everything that is not a case study. */
export function getArchiveProjects() {
  return getProjects().filter((p) => !p.caseStudy);
}

/**
 * Walk attachments into rows for the case-study media block.
 * Two consecutive layout:"pair" items share a row; anything else is full-width.
 */
export function groupCaseStudyMedia(attachments = []) {
  const rows = [];
  let i = 0;
  while (i < attachments.length) {
    const item = attachments[i];
    const next = attachments[i + 1];
    if (item.layout === 'pair' && next?.layout === 'pair') {
      rows.push({ type: 'pair', items: [item, next] });
      i += 2;
    } else {
      rows.push({ type: 'full', items: [item] });
      i += 1;
    }
  }
  return rows;
}

/**
 * Case-study meta: pull trailing "Credits: …" out of description (or use project.credits).
 */
export function splitProjectCopy(project = {}) {
  const raw = String(project.description || '').trim();
  if (project.credits) {
    return {
      description: raw.replace(/\s*Credits:\s*[\s\S]+$/i, '').trim(),
      credits: String(project.credits).trim(),
    };
  }
  const match = raw.match(/^(.*?)\s*Credits:\s*([\s\S]+)$/i);
  if (!match) return { description: raw, credits: null };
  return { description: match[1].trim(), credits: match[2].trim() };
}

export function getProjectBySlug(slug) {
  return getProjects().find(
    (p) => slugify(p.title || p.heading) === slug
  );
}

function sortProjectsByYear(projects) {
  return projects.sort((a, b) => {
    if (a.year === 'Ongoing' && b.year !== 'Ongoing') return -1;
    if (a.year !== 'Ongoing' && b.year === 'Ongoing') return 1;
    if (a.year === 'Ongoing' && b.year === 'Ongoing') return 0;
    const yearA = parseInt(a.year) || 0;
    const yearB = parseInt(b.year) || 0;
    return yearB - yearA;
  });
}
