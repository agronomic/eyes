"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { marked } from 'marked';

import Navigation from '../../navigation';
import { getProjectBySlug } from '../../content';
import { mediaLoading, playMutedVideos, useStaggerReady } from '../../helpers';

export default function ProjectPage() {
  const params = useParams();
  const slug = params?.slug;
  const project = typeof slug === 'string' ? getProjectBySlug(slug) : null;

  const [activeIndex, setActiveIndex] = useState(0);
  const swipeRef = useRef(null);
  const staggerReady = useStaggerReady(slug);

  useEffect(() => {
    playMutedVideos(swipeRef.current);
  }, [project]);

  const scrollToImage = (index) => {
    const container = swipeRef.current;
    if (!container) return;
    const slides = container.querySelectorAll(':scope > .media-container');
    if (!slides[index]) return;
    const target = slides[index];
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const scrollLeft =
      container.scrollLeft +
      (targetRect.left - containerRect.left) -
      containerRect.width / 2 +
      targetRect.width / 2;
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  };

  useEffect(() => {
    const container = swipeRef.current;
    if (!container) return;

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

  const title = project.title || project.heading;
  const attachments = project.attachments;

  return (
    <div className="container">
      <Navigation />

      <div className="project-content">
        <div className="gallery-header">
          <h3>{title}</h3>
          <span className="project-year">{project.year}</span>
        </div>

        <div
          className={`gallery-images swipe-view${staggerReady ? ' stagger-ready' : ''}`}
          ref={swipeRef}
        >
          {attachments.map((attachment, i) => (
            <div
              key={`stage-${attachment.url}-${i}`}
              className="media-container"
              style={{ '--stagger': i }}
            >
              {attachment.type === 'image' ? (
                <img
                  src={attachment.url}
                  alt={`${title} image ${i + 1}`}
                  width={attachment.width || undefined}
                  height={attachment.height || undefined}
                  loading={mediaLoading('stage', i)}
                  decoding="async"
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
                  preload={i === 0 ? 'auto' : 'metadata'}
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
                <img
                  src={attachment.url}
                  alt=""
                  loading={mediaLoading('thumb')}
                  decoding="async"
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
      </div>
    </div>
  );
}
