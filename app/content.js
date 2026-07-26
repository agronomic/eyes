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
