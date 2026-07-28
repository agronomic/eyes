'use client';

import Link from 'next/link';

import { getArchiveProjects, slugify } from './content';
import { useStaggerReady } from './helpers';

/** Offset so the Archive block cascades after gallery-text (--stagger: 2). */
const STAGGER_BASE = 3;

/** Simple archive index — numbered title + year, links to each project. */
export default function ArchiveList({ currentSlug }) {
  const projects = getArchiveProjects();
  const staggerReady = useStaggerReady(currentSlug);

  if (projects.length === 0) return null;

  return (
    <nav
      className={`archive-list${staggerReady ? ' stagger-ready' : ''}`}
      aria-label="Archive"
    >
      <p
        className="archive-heading stagger-item"
        style={{ '--stagger': STAGGER_BASE }}
      >
        Archive
      </p>
      {projects.map((project, index) => {
        const title = project.title || project.heading;
        const href = `/p/${slugify(title)}`;
        const isCurrent = href === `/p/${currentSlug}`;
        const number = index < 9 ? `0${index + 1}` : String(index + 1);
        const style = { '--stagger': STAGGER_BASE + 1 + index };
        const row = (
          <>
            <span className="archive-list-number">{number}</span>
            <span className="archive-list-title">{title}</span>
            <span className="archive-list-year">{project.year}</span>
          </>
        );

        if (isCurrent) {
          return (
            <div
              key={project.id || href}
              className="archive-list-row stagger-item is-current"
              style={style}
            >
              {row}
            </div>
          );
        }

        return (
          <Link
            key={project.id || href}
            href={href}
            className="archive-list-row stagger-item"
            style={style}
          >
            {row}
          </Link>
        );
      })}
    </nav>
  );
}
