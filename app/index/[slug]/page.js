"use client";

import React, { useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { marked } from 'marked';
import '@fontsource-variable/inter';
import '@fontsource/atkinson-hyperlegible';

import Navigation from '../../Navigation';
import { getProjectBySlug } from '../../projects';

const PRIORITY_LOAD_THRESHOLD = 3;

export default function ProjectPage() {
  const params = useParams();
  const slug = params?.slug;
  const project = typeof slug === 'string' ? getProjectBySlug(slug) : null;

  useEffect(() => {
    document.querySelectorAll('.project-content video').forEach((video) => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }, [project]);

  if (!project) {
    notFound();
  }

  const title = project.title || project.heading;

  return (
    <div className="container">
      <Navigation />

      <div className="project-content">
        <div className="gallery-header fade-slide-in">
          <h3>{title}</h3>
          <span className="project-year">{project.year}</span>
        </div>

        <div className="gallery-images grid-view fade-slide-in">
          {project.attachments.map((attachment, i) => (
            <div key={i} className="media-container">
              {attachment.type === 'image' ? (
                <img
                  src={attachment.url}
                  alt={`${title} image ${i + 1}`}
                  loading={i < PRIORITY_LOAD_THRESHOLD ? 'eager' : 'lazy'}
                  fetchPriority={i < PRIORITY_LOAD_THRESHOLD ? 'high' : 'auto'}
                  decoding="async"
                />
              ) : (
                <video
                  src={attachment.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="video-player"
                />
              )}
            </div>
          ))}
        </div>

        <div className="gallery-text fade-slide-in">
          <div dangerouslySetInnerHTML={{ __html: marked(project.description || '') }} />
        </div>
      </div>
    </div>
  );
}
