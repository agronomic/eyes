'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { marked } from 'marked';

import { groupCaseStudyMedia, splitProjectCopy } from './content';
import { mediaQuality, mediaSizes, playMutedVideos } from './helpers';

function CaseMedia({ item, title, index, pair }) {
  if (item.type === 'image') {
    return (
      <Image
        src={item.url}
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

/** Long-form case study: stacked meta + tight full/pair media rows. */
export default function CaseStudy({ project }) {
  const mediaRef = useRef(null);
  const title = project.title || project.heading;
  const tags = project.tags || [];
  const { description, credits } = splitProjectCopy(project);
  const rows = groupCaseStudyMedia(project.attachments || []);

  useEffect(() => {
    playMutedVideos(mediaRef.current);
  }, [project]);

  return (
    <div className="case-study">
      <div className="case-study-meta">
        <p>Title: {title}</p>
        {project.year && <p>Year: {project.year}</p>}
        {tags.length > 0 && <p>Type: {tags.join(', ')}</p>}
        {description && (
          <div
            className="case-study-description"
            dangerouslySetInnerHTML={{
              __html: marked(`Description: ${description}`),
            }}
          />
        )}
      </div>

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

      {credits && <p className="case-study-credits">Credits: {credits}</p>}
    </div>
  );
}
