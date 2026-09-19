'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { marked } from 'marked';

import { groupCaseStudyMedia } from './content';
import { mediaQuality, mediaSizes, mediaSrc, playMutedVideos } from './helpers';

function CaseMedia({ item, title, index, pair }) {
  if (item.type === 'image') {
    return (
      <Image
        src={mediaSrc(item.url, pair ? 'case-pair' : 'stage')}
        alt={`${title} image ${index + 1}`}
        width={item.width || 1600}
        height={item.height || 1067}
        sizes={mediaSizes(pair ? 'case-pair' : 'stage')}
        quality={mediaQuality}
        priority={index === 0}
        loading={index === 0 ? 'eager' : 'lazy'}
        fetchPriority={index === 0 ? 'high' : 'low'}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    );
  }

  if (item.type === 'video') {
    return (
      <video
        src={item.url}
        width={item.width || undefined}
        height={item.height || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload={index === 0 ? 'auto' : 'metadata'}
        className="video-player"
      />
    );
  }

  return null;
}

/** Nested case-study writeups — continuous blog-style sections. */
function CaseStories({ stories }) {
  if (!stories?.length) return null;

  return (
    <div className="case-stories">
      {stories.map((story, index) => {
        const heading = [story.audience, story.title].filter(Boolean).join('. ');
        return (
          <section key={story.title || index} className="case-story">
            {heading ? (
              <h2 className="case-story-heading">{heading}.</h2>
            ) : null}
            <div
              className="case-story-prose"
              dangerouslySetInnerHTML={{
                __html: marked(story.body || ''),
              }}
            />
          </section>
        );
      })}
    </div>
  );
}

/** Shared blurb: Title / Year / Type / Description (+ optional Credits). */
export function ProjectMeta({ project, includeCredits = false }) {
  const title = project.title || project.heading;
  const tags = project.tags || [];
  const description = project.description;
  const credits = project.credits;
  const stories = project.stories;
  const showBody =
    Boolean(description) ||
    Boolean(stories?.length) ||
    (includeCredits && credits);

  return (
    <div className="project-meta">
      <div className="project-meta-facts">
        <p>Title: {title}</p>
        {project.year && <p>Year: {project.year}</p>}
        {tags.length > 0 && <p>Type: {tags.join(', ')}</p>}
      </div>
      {showBody && (
        <div className="project-meta-body">
          {description && (
            <div
              className="project-meta-description"
              dangerouslySetInnerHTML={{
                __html: marked(description),
              }}
            />
          )}
          <CaseStories stories={stories} />
          {includeCredits && credits && (
            <p className="project-meta-credits">Credits: {credits}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Credits line for placement after media (case studies). */
export function ProjectCredits({ project }) {
  if (!project.credits) return null;
  return <p className="project-meta-credits">Credits: {project.credits}</p>;
}

/** Long-form case study: meta + tight full/pair media rows + credits. */
export default function CaseStudy({ project }) {
  const mediaRef = useRef(null);
  const title = project.title || project.heading;
  const rows = groupCaseStudyMedia(project.attachments || []);

  useEffect(() => {
    playMutedVideos(mediaRef.current);
  }, [project]);

  return (
    <div className="case-study">
      <ProjectMeta project={project} />

      <div className="case-study-media" ref={mediaRef}>
        {rows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className={`case-study-row is-${row.type}`}
          >
            {row.items.map((item, j) => {
              const index = project.attachments.indexOf(item);
              return (
                <div key={item.url || `${rowIndex}-${j}`} className="media-container">
                  <CaseMedia
                    item={item}
                    title={title}
                    index={index < 0 ? rowIndex : index}
                    pair={row.type === 'pair'}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <ProjectCredits project={project} />
    </div>
  );
}
