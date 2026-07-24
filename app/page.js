"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { marked } from 'marked';
import '@fontsource-variable/inter';
import '@fontsource/atkinson-hyperlegible';

import cv from './cv';
import Navigation from './Navigation';
import { getProjects, slugify } from './projects';

const MOBILE_BREAKPOINT = 767;
const PRIORITY_LOAD_THRESHOLD = 3;

function Projects() {
  const projects = getProjects();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches);
  }, []);

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
      <div className="projects-overview">
        {projects.map((project, index) => {
          const href = `/index/${slugify(project.title || project.heading)}`;
          return (
            <Link
              key={project.id || index}
              href={href}
              className="project-overview"
            >
              <div className="project-overview-images">
                <div className="media-container">
                  {project.attachments[0].type === 'image' ? (
                    <Image
                      src={project.attachments[0].url}
                      alt={`${project.title} cover image`}
                      width={400}
                      height={267}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{
                        display: 'block',
                        width: '100%',
                        height: 'auto',
                        cursor: 'pointer'
                      }}
                      priority={index < PRIORITY_LOAD_THRESHOLD}
                      quality={85}
                    />
                  ) : (
                    project.attachments[0].type === 'video' && (
                      <video
                        src={project.attachments[0].url}
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

      <section className="contact-section section">
        <p>Contact</p>
        <ul className="contact-list">
          {cv.contact.map((contactItem, index) => (
            <li key={index} className="contact-item">
              {contactItem.platform}: <a href={contactItem.url} target="_blank" rel="noopener noreferrer">{contactItem.handle}</a>
            </li>
          ))}
        </ul>
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
              {experience.attachments && experience.attachments.length > 0 && (
                <div className="experience-attachments">
                  {experience.attachments.map((attachment, i) => (
                    <img key={i} src={attachment.url} alt={`Attachment ${i + 1}`} />
                  ))}
                </div>
              )}
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
