"use client";

import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { marked } from 'marked';

import cv, {
  getArchiveProjects,
  getCaseStudies,
  PROJECT_FILTERS,
  slugify,
} from './content';
import Navigation from './navigation';
import Colophon from './colophon';
import ExperimentsHome from './experiments-home';
import {
  bpMobile,
  easeElementHeight,
  mediaQuality,
  mediaSizes,
  mediaSrc,
  useStaggerReady,
} from './helpers';
import { mountCylinder } from './cylinder-tile';

const PRIORITY_LOAD_THRESHOLD = 3;

/** Featured cover: animated cylinder mount (see cylinder-tile.js). */
function FeaturedCylinder({ stagger }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return undefined;
    const { remove } = mountCylinder(ref.current);
    return () => remove();
  }, []);

  return (
    <div
      ref={ref}
      className="media-container featured-cylinder"
      style={{ '--stagger': stagger }}
    >
      <p className="featured-cylinder-label featured-cylinder-label-tl">
        Product & design strategy, storytelling, leadership,
        {'\n'}0 → 1 systems
      </p>
      <svg
        className="featured-cylinder-connector"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          x1="0"
          y1="50"
          x2="100"
          y2="50"
          stroke="#1a4a4a"
          strokeWidth="1"
          strokeDasharray="1 5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <p className="featured-cylinder-label featured-cylinder-label-br">
        Building practical tools in service of more ethical systems.
      </p>
    </div>
  );
}

function Featured() {
  const caseStudies = getCaseStudies();
  const staggerReady = useStaggerReady('featured');
  if (caseStudies.length === 0) return null;

  return (
    <div className={`projects-featured${staggerReady ? ' stagger-ready' : ''}`}>
      <p className="archive-heading stagger-item" style={{ '--stagger': 0 }}>
        Featured
      </p>
      {caseStudies.map((project, index) => {
        const cover = project.attachments[0];
        const href = `/p/${slugify(project.title || project.heading)}`;
        const useCylinder = project.featuredCover === 'cylinder';
        return (
          <Link
            key={project.id}
            href={href}
            className="projects-featured-link"
          >
            {useCylinder ? (
              <FeaturedCylinder stagger={index + 1} />
            ) : (
              <div className="media-container" style={{ '--stagger': index + 1 }}>
                {cover?.type === 'image' ? (
                  <Image
                    src={mediaSrc(cover.url, 'stage')}
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
            )}
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
  const [activeFilter, setActiveFilter] = useState('product');
  /* Chrome once on mount; grid re-cascades when the filter changes */
  const chromeReady = useStaggerReady('archive-chrome');
  const gridReady = useStaggerReady(activeFilter);

  useEffect(() => {
    setIsMobile(window.matchMedia(`(max-width: ${bpMobile}px)`).matches);
  }, []);

  const visible =
    activeFilter === 'all'
      ? projects
      : projects.filter((project) => {
          const filter = PROJECT_FILTERS.find((f) => f.id === activeFilter);
          return filter?.tags.some((tag) => project.tags?.includes(tag));
        });

  const selectFilter = (id) => {
    if (id === activeFilter) return;
    easeElementHeight(gridRef.current, () => {
      flushSync(() => setActiveFilter(id));
    });
  };

  if (projects.length === 0) {
    return (
      <div className={`archive section-split${chromeReady ? ' stagger-ready' : ''}`}>
        <p className="section-label archive-heading stagger-item" style={{ '--stagger': 0 }}>
          Archive
        </p>
        <div className="section-body">
          <div className="placeholderText stagger-item" style={{ '--stagger': 1 }}>
            Add at least one project or side project with an image or video.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`archive section-split${chromeReady ? ' stagger-ready' : ''}`}>
      <p className="section-label archive-heading stagger-item" style={{ '--stagger': 0 }}>
        Archive
      </p>

      <div className="section-body">
        <div
          className="project-filters stagger-item"
          style={{ '--stagger': 1 }}
          role="toolbar"
          aria-label="Filter projects"
        >
          {PROJECT_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={activeFilter === filter.id ? 'active' : undefined}
              onClick={() => selectFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
          <button
            type="button"
            className={activeFilter === 'all' ? 'active' : undefined}
            onClick={() => selectFilter('all')}
          >
            All
          </button>
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
                key={`${activeFilter}-${project.id || index}`}
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
                        src={mediaSrc(cover.url, 'cover')}
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
          const company = experience.company || experience.heading;
          const title = experience.title;
          const canExpand = Boolean(experience.description);
          return (
            <li
              key={experience.id || index}
              className={`experience-item${isOpen ? ' is-open' : ''}`}
            >
              <div
                className="experience-item-grid"
                role={canExpand ? 'button' : undefined}
                tabIndex={canExpand ? 0 : undefined}
                aria-expanded={canExpand ? isOpen : undefined}
                onClick={
                  canExpand
                    ? () => setOpenIndex(isOpen ? null : index)
                    : undefined
                }
                onKeyDown={
                  canExpand
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setOpenIndex(isOpen ? null : index);
                        }
                      }
                    : undefined
                }
              >
                <span className="experience-year">{experience.year}</span>
                <div className="experience-main-header">
                  <span className="experience-title">{title || '\u00a0'}</span>
                  <span className="experience-company">{company}</span>
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
              </div>
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

      <section className="about-section section section-split">
        <p className="section-label">About</p>
        <div
          className="section-body"
          dangerouslySetInnerHTML={{ __html: marked(cv.general.about) }}
        />
      </section>

      <Experience />

      <ExperimentsHome />

      <Colophon />
    </div>
  );
}
