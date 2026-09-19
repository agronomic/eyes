'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { marked } from 'marked';

import { groupCaseStudyMedia } from './content';
import { mediaQuality, mediaSizes, mediaSrc, playMutedVideos } from './helpers';
import MetaLabel from './meta-label';
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

/** Nested case-study writeups — quote left / copy right, stacks on mobile. */
function CaseStories({ stories, footnotes = [], staggerBase = 1 }) {
  if (!stories?.length) return null;

  const footnoteByStory = new Map(
    footnotes.map((fn) => [fn.storyIndex, fn])
  );

  return (
    <div className="case-stories">
      {stories.map((story, index) => {
        const exhibit = String(index + 1).padStart(2, '0');
        const rest = [story.audience, story.title].filter(Boolean).join('. ');
        const footnote = footnoteByStory.get(index);
        return (
          <section
            key={story.title || index}
            className="case-story section-split"
            style={{ '--stagger': staggerBase + index }}
          >
            <div className="case-story-aside">
              {story.quote ? (
                <blockquote className="case-story-quote">
                  <span className="quote">{story.quote}</span>
                  {footnote ? (
                    <a
                      className="footnote-ref"
                      href={`#fn-${footnote.n}`}
                      id={`fnref-${footnote.n}`}
                      aria-label={`Footnote ${footnote.n}`}
                    >
                      <sup>{footnote.n}</sup>
                    </a>
                  ) : null}
                </blockquote>
              ) : null}
            </div>
            <div className="case-story-copy">
              <h2 className="case-story-heading">
                <MetaLabel>Exhibit {exhibit}.</MetaLabel>
                {rest ? ` ${rest}.` : null}
              </h2>
              <div
                className="case-story-prose"
                dangerouslySetInnerHTML={{
                  __html: marked(story.body || ''),
                }}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Quote attributions as one endnote text block (same register as Credits). */
function CaseFootnotes({ footnotes, stagger = 0 }) {
  if (!footnotes.length) return null;

  return (
    <p className="case-footnotes" style={{ '--stagger': stagger }}>
      <MetaLabel>Notes:</MetaLabel>{' '}
      {footnotes.map((fn, i) => (
        <span key={fn.n} className="case-footnote" id={`fn-${fn.n}`}>
          {i > 0 ? ' ' : null}
          {fn.n}. {fn.text}
          <a
            className="case-footnote-back"
            href={`#fnref-${fn.n}`}
            aria-label={`Back to reference ${fn.n}`}
          >
            ↩
          </a>
        </span>
      ))}
    </p>
  );
}

/** Numbered quote attributions from case-study stories. */
function collectQuoteFootnotes(stories = []) {
  const footnotes = [];
  stories.forEach((story, storyIndex) => {
    if (!story.quote || !story.quoteAttr) return;
    footnotes.push({
      n: footnotes.length + 1,
      storyIndex,
      text: story.quoteAttr,
    });
  });
  return footnotes;
}

/** Shared blurb: Title / Year / Type / Description (+ optional Credits). */
export function ProjectMeta({ project, includeCredits = false }) {
  const title = project.title || project.heading;
  const tags = project.tags || [];
  const description = project.description;
  const credits = project.credits;
  const showBody = Boolean(description) || (includeCredits && credits);

  return (
    <div className="project-meta">
      <div className="project-meta-facts">
        <p>
          <MetaLabel>Title:</MetaLabel> {title}
        </p>
        {project.year && (
          <p>
            <MetaLabel>Year:</MetaLabel> {project.year}
          </p>
        )}
        {tags.length > 0 && (
          <p>
            <MetaLabel>Type:</MetaLabel> {tags.join(', ')}
          </p>
        )}
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
          {includeCredits && credits && (
            <p className="project-meta-credits">
              <MetaLabel>Credits:</MetaLabel>{' '}
              <span
                dangerouslySetInnerHTML={{
                  __html: marked.parseInline(credits),
                }}
              />
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Credits line for placement after media (case studies). */
export function ProjectCredits({ project, stagger = 0 }) {
  if (!project.credits) return null;
  return (
    <p className="project-meta-credits" style={{ '--stagger': stagger }}>
      <MetaLabel>Credits:</MetaLabel>{' '}
      <span
        dangerouslySetInnerHTML={{
          __html: marked.parseInline(project.credits),
        }}
      />
    </p>
  );
}

/** Long-form case study: meta + exhibits + tight full/pair media rows + footnotes + credits. */
export default function CaseStudy({ project }) {
  const mediaRef = useRef(null);
  const title = project.title || project.heading;
  const rows = groupCaseStudyMedia(project.attachments || []);
  const storyCount = project.stories?.length || 0;
  const footnotes = collectQuoteFootnotes(project.stories);
  const mediaStaggerBase = 1 + storyCount;
  const footnotesStagger = mediaStaggerBase + rows.length;
  const creditsStagger = footnotesStagger + (footnotes.length ? 1 : 0);

  useEffect(() => {
    playMutedVideos(mediaRef.current);
  }, [project]);

  return (
    <div className="case-study">
      <ProjectMeta project={project} />

      <CaseStories
        stories={project.stories}
        footnotes={footnotes}
        staggerBase={1}
      />

      <div className="case-study-media" ref={mediaRef}>
        {rows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className={`case-study-row is-${row.type}`}
            style={{ '--stagger': mediaStaggerBase + rowIndex }}
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

      <CaseFootnotes footnotes={footnotes} stagger={footnotesStagger} />

      <ProjectCredits project={project} stagger={creditsStagger} />
    </div>
  );
}
