"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useParams, notFound } from 'next/navigation';
import { marked } from 'marked';

import Navigation from '../../navigation';
import CaseStudy from '../../case-study';
import ArchiveList from '../../archive-list';
import { getProjectBySlug } from '../../content';
import {
  mediaQuality,
  mediaSizes,
  playMutedVideos,
  useStaggerReady,
  watchMediaReady,
} from '../../helpers';

/** Slides kept loading ahead of the one in view, so scrolling never waits. */
const STAGE_WINDOW = 10;

export default function ProjectPage() {
  const params = useParams();
  const slug = params?.slug;
  const project = typeof slug === 'string' ? getProjectBySlug(slug) : null;

  const [activeIndex, setActiveIndex] = useState(0);
  const [stageReady, setStageReady] = useState(() => new Set());
  const swipeRef = useRef(null);
  const staggerReady = useStaggerReady(slug);

  useEffect(() => {
    if (!project || project.caseStudy) return undefined;
    setStageReady(new Set());

    return watchMediaReady(swipeRef.current, (index) => {
      setStageReady((prev) => {
        if (prev.has(index)) return prev;
        const next = new Set(prev);
        next.add(index);
        return next;
      });
    });
  }, [slug, project]);

  useEffect(() => {
    if (!project || project.caseStudy) return;
    playMutedVideos(swipeRef.current);
  }, [project]);

  const scrollToImage = (index) => {
    const container = swipeRef.current;
    if (!container) return;
    const slides = container.querySelectorAll(':scope > .media-container');
    const target = slides[index];
    if (!target) return;
    const scrollLeft =
      target.offsetLeft - (container.clientWidth - target.offsetWidth) / 2;
    container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
  };

  useEffect(() => {
    if (!project || project.caseStudy) return undefined;
    const container = swipeRef.current;
    if (!container) return undefined;

    let ticking = false;
    const syncActive = () => {
      const slides = container.querySelectorAll(':scope > .media-container');
      if (!slides.length) return;
      const mid = container.scrollLeft + container.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((el, i) => {
        const center = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActiveIndex(best);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        syncActive();
        ticking = false;
      });
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [project]);

  if (!project) {
    notFound();
  }

  if (project.caseStudy) {
    return (
      <div className="container">
        <Navigation />
        <CaseStudy project={project} />
      </div>
    );
  }

  const title = project.title || project.heading;
  const attachments = project.attachments;
  const eagerThrough = Math.max(STAGE_WINDOW, activeIndex + STAGE_WINDOW);

  return (
    <div className="container">
      <Navigation />

      <div className="project-content">
        <div className="gallery-header">
          <h3>{title}</h3>
          <span className="project-year">{project.year}</span>
        </div>

        <div className="gallery-images swipe-view" ref={swipeRef}>
          {attachments.map((attachment, i) => (
            <div
              key={`stage-${attachment.url}-${i}`}
              className={`media-container${stageReady.has(i) ? '' : ' is-pending'}`}
              style={{
                '--stagger': i,
                ...(attachment.width && attachment.height
                  ? { '--media-ratio': `${attachment.width} / ${attachment.height}` }
                  : {}),
              }}
            >
              {attachment.type === 'image' ? (
                <Image
                  src={attachment.url}
                  alt={`${title} image ${i + 1}`}
                  width={attachment.width || 1600}
                  height={attachment.height || 1067}
                  sizes={mediaSizes('stage')}
                  quality={mediaQuality}
                  priority={i === 0}
                  loading={i <= eagerThrough ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'low'}
                />
              ) : (
                <video
                  src={attachment.url}
                  width={attachment.width || undefined}
                  height={attachment.height || undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="video-player"
                />
              )}
            </div>
          ))}
        </div>

        <div
          className={`gallery-images grid-view gallery-thumbs${staggerReady ? ' stagger-ready' : ''}`}
        >
          {attachments.map((attachment, i) => (
            <button
              key={`thumb-${attachment.url}-${i}`}
              type="button"
              className={`media-container${activeIndex === i ? ' is-active' : ''}`}
              style={{ '--stagger': i }}
              onClick={() => scrollToImage(i)}
              aria-label={`Go to image ${i + 1}`}
            >
              {attachment.type === 'image' ? (
                <Image
                  src={attachment.url}
                  alt=""
                  width={attachment.width || 400}
                  height={attachment.height || 267}
                  sizes={mediaSizes('thumb')}
                  quality={mediaQuality}
                  style={{ width: '100%', height: 'auto' }}
                />
              ) : (
                <video
                  src={attachment.url}
                  muted
                  playsInline
                  preload="metadata"
                />
              )}
            </button>
          ))}
        </div>

        <div className="gallery-text">
          <div dangerouslySetInnerHTML={{ __html: marked(project.description || '') }} />
        </div>

        <ArchiveList currentSlug={slug} />
      </div>
    </div>
  );
}
