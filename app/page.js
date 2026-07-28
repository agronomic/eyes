"use client";

import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { marked } from 'marked';

import cv, {
  getArchiveProjects,
  getCaseStudies,
  PROJECT_TAGS,
  slugify,
} from './content';
import Navigation from './navigation';
import {
  bpMobile,
  easeElementHeight,
  mediaQuality,
  mediaSizes,
  useStaggerReady,
} from './helpers';

const PRIORITY_LOAD_THRESHOLD = 3;

function Featured() {
  const caseStudies = getCaseStudies();
  const staggerReady = useStaggerReady('featured');
  if (caseStudies.length === 0) return null;

  return (
    <div className={`projects-featured${staggerReady ? ' stagger-ready' : ''}`}>
      {caseStudies.map((project, index) => {
        const cover = project.attachments[0];
        const href = `/p/${slugify(project.title || project.heading)}`;
        return (
          <Link
            key={project.id}
            href={href}
            className="projects-featured-link"
          >
            <div className="media-container" style={{ '--stagger': index }}>
              {cover?.type === 'image' ? (
                <Image
                  src={cover.url}
                  alt={`${project.title || project.heading} cover`}
                  width={cover.width || 1600}
                  height={cover.height || 1067}
                  sizes={mediaSizes('stage')}
                  quality={mediaQuality}
                  priority
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              ) : (
                cover?.type === 'video' && (
                  <video
                    src={cover.url}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="auto"
                    className="video-player"
                  />
                )
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function Archive() {
  const projects = getArchiveProjects();
  const gridRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  /* Chrome once on mount; grid re-cascades when the filter changes */
  const chromeReady = useStaggerReady('archive-chrome');
  const gridReady = useStaggerReady(activeTag);

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
      <div className="archive">
        <div className={chromeReady ? 'stagger-ready' : undefined}>
          <p className="archive-heading stagger-item" style={{ '--stagger': 0 }}>
            Archive
          </p>
          <div className="placeholderText stagger-item" style={{ '--stagger': 1 }}>
            Add at least one project or side project with an image or video.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="archive">
      <div className={chromeReady ? 'stagger-ready' : undefined}>
        <p className="archive-heading stagger-item" style={{ '--stagger': 0 }}>
          Archive
        </p>

        <div
          className="project-filters stagger-item"
          style={{ '--stagger': 1 }}
          role="toolbar"
          aria-label="Filter projects"
        >
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
      </div>

      <div
        ref={gridRef}
        className={`projects-overview${gridReady ? ' stagger-ready' : ''}`}
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
    </div>
  );
}

function Experience() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="experience-section section">
      <p>Experience</p>
      <ul className="experience-list">
        {cv.workExperience.map((experience, index) => {
          const isOpen = openIndex === index;
          return (
            <li
              key={experience.id || index}
              className={`experience-item${isOpen ? ' is-open' : ''}`}
            >
              <div
                className="index-row experience-row"
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setOpenIndex(isOpen ? null : index);
                  }
                }}
              >
                <span className="index-row-title">{experience.heading}</span>
                <span className="index-row-year">{experience.year}</span>
              </div>
              {experience.description && (
                <div className="experience-description">
                  <div className="experience-description-inner">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: marked(experience.description),
                      }}
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function App() {
  return (
    <div className="container">
      <Navigation />
      {cv.general.statement && (
        <p className="site-statement">{cv.general.statement}</p>
      )}
      <Featured />
      <Archive />

      <section className="about-section section">
        <p>About</p>
        <div dangerouslySetInnerHTML={{ __html: marked(cv.general.about) }} />
      </section>

      <Experience />

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
