"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { marked } from 'marked';
import '@fontsource-variable/inter';
import '@fontsource/atkinson-hyperlegible';

import Navigation from '../../Navigation';
import { getProjectBySlug } from '../../projects';

const ANIMATION_STAGGER_MS = 100;

export default function ProjectPage() {
  const params = useParams();
  const slug = params?.slug;
  const project = typeof slug === 'string' ? getProjectBySlug(slug) : null;

  const [isGridView, setIsGridView] = useState(true);
  const [imageToScrollTo, setImageToScrollTo] = useState(null);
  const swipeRef = useRef(null);

  // Staggered fade-in for each media tile (restores previous animation)
  useEffect(() => {
    if (!project) return;
    const mediaContainers = document.querySelectorAll('.project-content .media-container');
    const timers = [];
    mediaContainers.forEach((container, index) => {
      container.style.opacity = '0';
      container.style.transform = 'translateY(20px)';
      timers.push(setTimeout(() => {
        container.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      }, index * ANIMATION_STAGGER_MS));
    });
    return () => timers.forEach(clearTimeout);
  }, [project, isGridView]);

  useEffect(() => {
    document.querySelectorAll('.project-content video').forEach((video) => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }, [project, isGridView]);

  const scrollToImage = (index) => {
    const container = swipeRef.current;
    if (!container) return;
    const mediaContainers = container.querySelectorAll('.media-container');
    if (!mediaContainers[index]) return;
    const target = mediaContainers[index];
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
    if (!isGridView && imageToScrollTo !== null) {
      const t = setTimeout(() => scrollToImage(imageToScrollTo), 50);
      return () => clearTimeout(t);
    }
  }, [isGridView, imageToScrollTo]);

  useEffect(() => {
    if (isGridView) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setIsGridView(true);
        setImageToScrollTo(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isGridView]);

  if (!project) {
    notFound();
  }

  const title = project.title || project.heading;

  const openFullscreen = (index) => {
    if (isGridView) {
      setImageToScrollTo(index);
      setIsGridView(false);
      return;
    }
    if (imageToScrollTo === index) {
      setIsGridView(true);
      setImageToScrollTo(null);
    } else {
      setImageToScrollTo(index);
      setTimeout(() => scrollToImage(index), 10);
    }
  };

  return (
    <div className="container">
      <Navigation />

      <div className="project-content">
        <div className="gallery-header">
          <h3>{title}</h3>
          <span className="project-year">{project.year}</span>
        </div>

        <div
          className={`gallery-images ${isGridView ? 'grid-view' : 'swipe-view'}`}
          ref={swipeRef}
        >
          {project.attachments.map((attachment, i) => (
            <div key={`${attachment.url}-${i}`} className="media-container">
              {attachment.type === 'image' ? (
                <img
                  src={attachment.url}
                  alt={`${title} image ${i + 1}`}
                  loading="eager"
                  decoding="async"
                  style={{ cursor: 'pointer' }}
                  onClick={() => openFullscreen(i)}
                />
              ) : (
                <video
                  src={attachment.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="video-player"
                  style={{ cursor: 'pointer' }}
                  onClick={() => openFullscreen(i)}
                />
              )}
            </div>
          ))}
        </div>

        <div className="gallery-text">
          <div dangerouslySetInnerHTML={{ __html: marked(project.description || '') }} />
        </div>
      </div>
    </div>
  );
}
