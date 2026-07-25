/**
 * Archived Index list UI.
 * Kept for a future changelog section (long-form entries by year).
 * Not mounted in the live site.
 *
 * Note: live Styles.css no longer includes Index-only rules.
 * If you revive this, restore styles from git history or add an archive stylesheet.
 */
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { marked } from 'marked';
import { getProjects } from '../content';

const ANIMATION_STAGGER_MS = 100;
const LAZY_LOAD_THRESHOLD_INDEX = 3;
const ZERO_PADDING_THRESHOLD = 9;

function getImageLoadingProps(index, lazyThreshold = LAZY_LOAD_THRESHOLD_INDEX) {
  return {
    loading: index < lazyThreshold ? "eager" : "lazy",
    fetchPriority: index < 3 ? "high" : "auto",
    decoding: "async"
  };
}

function ImageCounter({ currentImageIndex, totalImages }) {
  return (
    <div className="image-counter">
      {currentImageIndex + 1} — {totalImages}
    </div>
  );
}

export default function ProjectIndex() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const imageIndexRef = useRef(currentImageIndex);
  const contentRefs = useRef([]);
  const projects = getProjects();

  useEffect(() => {
    const projectItems = document.querySelectorAll('.project-item');

    projectItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('loaded');
      }, index * ANIMATION_STAGGER_MS);
    });

    setTimeout(() => {
      projectItems.forEach(item => {
        item.style.transform = 'none';
      });
    }, projects.length * ANIMATION_STAGGER_MS + 500);

    projectItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        projectItems.forEach(otherItem => {
          if (otherItem !== item && otherItem !== projectItems[activeIndex]) {
            otherItem.style.opacity = '0.25';
          }
        });
      });

      item.addEventListener('mouseleave', () => {
        projectItems.forEach(otherItem => {
          if (otherItem !== projectItems[activeIndex]) {
            otherItem.style.opacity = '1';
          }
        });
      });
    });

    return () => {
      projectItems.forEach(item => {
        item.removeEventListener('mouseenter', null);
        item.removeEventListener('mouseleave', null);
      });
    };
  }, [projects, activeIndex]);

  const handleProjectClick = (index) => {
    const projectItems = document.querySelectorAll('.project-item');

    if (activeIndex === index) {
      setActiveIndex(null);
      setCurrentImageIndex(0);
      imageIndexRef.current = 0;

      projectItems.forEach(item => {
        item.style.opacity = '1';
      });

      const content = contentRefs.current[index];
      if (content) {
        content.style.maxHeight = 0;
      }
    } else {
      if (activeIndex !== null) {
        const prevContent = contentRefs.current[activeIndex];
        if (prevContent) {
          prevContent.style.maxHeight = 0;
        }
      }

      setActiveIndex(index);
      setCurrentImageIndex(0);
      imageIndexRef.current = 0;
      setTotalImages(projects[index].attachments.length);

      const content = contentRefs.current[index];
      if (content) {
        content.style.maxHeight = content.scrollHeight + "px";
      }
    }
  };

  const handleImageChange = (newIndex) => {
    if (newIndex >= 0 && newIndex < totalImages) {
      setCurrentImageIndex(newIndex);
      imageIndexRef.current = newIndex;
    }
  };

  // Swipe was via react-swipeable (removed from live deps). Restore when reviving Index.
  const swipeHandlers = {};

  return (
    <div className="project-index">
      {projects.map((project, index) => (
        <div
          key={index}
          className={`project-item ${activeIndex === index ? 'expanded' : ''}`}
        >
          <div
            className="project-index-header"
            onClick={() => handleProjectClick(index)}
          >
            <span className="project-index-number">
              {index < ZERO_PADDING_THRESHOLD ? `0${index + 1}` : index + 1}
            </span>
            <h3>
              {project.title || project.heading}
            </h3>
            <span className="project-year">{project.year}</span>
          </div>
          <div
            className="project-details"
            ref={(el) => (contentRefs.current[index] = el)}
            style={{
              maxHeight: activeIndex === index ? contentRefs.current[index]?.scrollHeight : 0,
              overflow: 'hidden',
              transition: 'max-height 0.5s ease',
            }}
          >
            <div className="details-right">
              <div className="project-description" dangerouslySetInnerHTML={{ __html: marked(project.description || '') }} />
            </div>
            <ImageCounter
              currentImageIndex={currentImageIndex}
              totalImages={totalImages}
            />
            <div
              {...swipeHandlers}
              className="project-images-horizontal"
            >
              {project.attachments.map((attachment, i) => (
                attachment.type === 'image' ? (
                  <img
                    key={i}
                    src={attachment.url}
                    alt={`${project.title} image ${i + 1}`}
                    {...getImageLoadingProps(i)}
                    onClick={() => handleImageChange(i)}
                  />
                ) : (
                  <video
                    key={i}
                    src={attachment.url}
                    controls
                    autoPlay
                    muted
                    className="video-player"
                    playsInline
                  >
                    <source src={attachment.url} type="video/mp4" />
                  </video>
                )
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
