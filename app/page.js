"use client";

import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { marked } from 'marked';

import cv, { getProjects, PROJECT_TAGS, slugify } from './content';
import Navigation from './navigation';
import {
  bpMobile,
  easeElementHeight,
  mediaQuality,
  mediaSizes,
  useStaggerReady,
} from './helpers';

const PRIORITY_LOAD_THRESHOLD = 3;

function Projects() {
  const projects = getProjects();
  const gridRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  // Same cascade on first load and whenever the filter changes
  const staggerReady = useStaggerReady(activeTag);

  useEffect(() => {
    setIsMobile(window.matchMedia(`(max-width: ${bpMobile}px)`).matches);
  }, []);

  const visible = activeTag
    ? projects.filter((project) => project.tags?.includes(activeTag))
    : projects;

  const selectTag = (tag) => {
    if (tag === activeTag) return;
    easeElementHeight(gridRef.current, () => {
      flushSync(() => setActiveTag(tag));
    });
  };

  if (projects.length === 0) {
    return (
      <div className="projects-overview">
        <div className="placeholderText">
          Add at least one project or side project with an image or video.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="project-filters" role="toolbar" aria-label="Filter projects">
        <button
          type="button"
          className={activeTag == null ? 'active' : undefined}
          onClick={() => selectTag(null)}
        >
          All
        </button>
        {PROJECT_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            className={activeTag === tag ? 'active' : undefined}
            onClick={() => selectTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <div
        ref={gridRef}
        className={`projects-overview${staggerReady ? ' stagger-ready' : ''}`}
      >
        {visible.map((project, index) => {
          const href = `/p/${slugify(project.title || project.heading)}`;
          const cover = project.attachments[0];
          return (
            <Link
              key={`${activeTag ?? 'all'}-${project.id || index}`}
              href={href}
              className="project-overview"
            >
              <div className="project-overview-images">
                <div
                  className="media-container"
                  style={{ '--stagger': index }}
                >
                  {cover.type === 'image' ? (
                    <Image
                      src={cover.url}
                      alt={`${project.title} cover image`}
                      width={cover.width || 400}
                      height={cover.height || 267}
                      sizes={mediaSizes('cover')}
                      style={{
                        display: 'block',
                        width: '100%',
                        height: 'auto',
                        cursor: 'pointer',
                      }}
                      priority={index < PRIORITY_LOAD_THRESHOLD}
                      quality={mediaQuality}
                    />
                  ) : (
                    cover.type === 'video' && (
                      <video
                        src={cover.url}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        autoPlay={index < PRIORITY_LOAD_THRESHOLD}
                        className={`video-player ${isMobile ? 'no-controls' : ''}`}
                      />
                    )
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <section className="about-section section">
        <p>About</p>
        <div dangerouslySetInnerHTML={{ __html: marked(cv.general.about) }} />
      </section>

      <section className="experience-section section">
        <p>Experience</p>
        <ul className="experience-list">
          {cv.workExperience.map((experience, index) => (
            <li key={index} className="experience-item">
              <div className="experience-title-year">
                <div className="experience-year">{experience.year}</div>
                <div className="experience-title">
                  {experience.url ? (
                    <a href={experience.url} target="_blank" rel="noopener noreferrer">
                      {experience.heading}
                    </a>
                  ) : (
                    experience.heading
                  )}
                </div>
              </div>
              {experience.description && (
                <div className="experience-description">
                  <div dangerouslySetInnerHTML={{ __html: marked(experience.description) }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="contact-section section">
        <p>Contact</p>
        <ul className="contact-list">
          {cv.contact.map((contactItem, index) => (
            <li key={index} className="contact-item">
              {contactItem.platform}:{' '}
              <a href={contactItem.url} target="_blank" rel="noopener noreferrer">
                {contactItem.handle}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <div className="container">
      <Navigation />
      <Projects />
    </div>
  );
}
