"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useSwipeable } from 'react-swipeable';
import { marked } from 'marked'; // Importing marked for Markdown parsing
import '@fontsource-variable/inter';
import '@fontsource/atkinson-hyperlegible';

import cv from './cv';

export const dynamic = 'force-dynamic';

function App() {
  const [view, setView] = useState('overview'); // Use 'view' as the state variable

  return (
    <div className="container">
      <Navigation view={view} setView={setView} />
      
      {/* Conditional rendering based on the selected view */}
      {view === 'overview' && <Projects />}
      {view === 'index' && <ProjectIndex />}
      {view === 'about' && <AboutSections />}
    </div>
  );
}

function AboutSections() {
  useEffect(() => {
    const sections = document.querySelectorAll('.about-section, .contact-section, .experience-section');

    sections.forEach((section, index) => {
      setTimeout(() => {
        section.style.opacity = 1;
        section.style.transform = 'translateY(0)';
      }, index * 100); // Adjust delay as needed
    });
  }, []);

  return (
    <div>
      {/* About Section */}
      <section
        className="about-section section"
        style={{
          opacity: 0,
          transform: 'translateY(20px)',
          transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
        }}
      >
        <p>About</p>
        <div dangerouslySetInnerHTML={{ __html: marked(cv.general.about) }} />
      </section>

     {/* Contact Section */}
<section
  className="contact-section section"
  style={{
    opacity: 0,
    transform: 'translateY(20px)',
    transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
  }}
>
  <p>Contact</p>
  <ul className="contact-list">
    {cv.contact.map((contactItem, index) => (
      <li key={index} className="contact-item">
        {contactItem.platform}: <a href={contactItem.url} target="_blank" rel="noopener noreferrer">{contactItem.handle}</a>
      </li>
    ))}
  </ul>
</section>

   {/* Experience Section */}
<section
  className="experience-section section"
  style={{
    opacity: 0,
    transform: 'translateY(20px)',
    transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
  }}
>
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

function Experience(props) {
  let title;
  if (props.url) {
    title = <a href={props.url} target="_blank" rel="noopener noreferrer">{props.title}</a>;
  } else {
    title = props.title;
  }

  return (
    <div className="experience-item">
      <div className="experience-year">{props.year}</div>
      <div className="experience-title">
        {title}
        {props.description && (
          <div className="experience-description">
            <RichText text={props.description} />
          </div>
        )}
      </div>

      {/* Attachments section */}
      {props.attachments && props.attachments.length > 0 && (
        <div className="experience-attachments">
          {props.attachments.map((attachment, index) => (
            <div key={index} className="attachment-item">
              {attachment.type === 'image' && (
                <img src={attachment.url} alt={`Attachment ${index + 1}`} />
              )}
              {attachment.type === 'video' && (
                <video
                  src={attachment.url}
                  controls
                  className="video-player"
                />
              )}
              {attachment.type === 'document' && (
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                  View Document
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function ImageCounter({ currentImageIndex, totalImages }) {
  return (
    <div className="image-counter">
      {currentImageIndex + 1} — {totalImages}
    </div>
  );
}

function Navigation(props) {
  return (
    <div className="navigation-bar">
      <div className="title">
        <a href="/">
          {cv.general.displayName}
        </a>
      </div>
      <div className="nav-links">  
        <button onClick={() => props.setView('overview')} className={props.view === 'overview' ? 'active' : ''}>
          Overview
        </button>
        <button onClick={() => props.setView('index')} className={props.view === 'index' ? 'active' : ''}>
          Index
        </button>
      </div>
      <div className="about-link">
        <button onClick={() => props.setView('about')} className={props.view === 'about' ? 'active' : ''}>
          About
        </button>
      </div>
    </div>
  );
}


function ProjectIndex() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const imageIndexRef = useRef(currentImageIndex);
  const contentRefs = useRef([]); // Array to hold refs for each project's content

  // Combine projects and sideProjects, then sort by year (newest first, "Ongoing" first)
  const allProjects = [...cv.projects, ...cv.sideProjects].filter(x => x.attachments.length > 0);
  const projects = allProjects.sort((a, b) => {
    // Treat "Ongoing" as the most recent (highest priority)
    if (a.year === 'Ongoing' && b.year !== 'Ongoing') return -1;
    if (a.year !== 'Ongoing' && b.year === 'Ongoing') return 1;
    if (a.year === 'Ongoing' && b.year === 'Ongoing') return 0;
    
    // Convert year strings to numbers for sorting (descending order - newest first)
    const yearA = parseInt(a.year) || 0;
    const yearB = parseInt(b.year) || 0;
    return yearB - yearA;
  });

  useEffect(() => {
    const projectItems = document.querySelectorAll('.project-item');

    projectItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('loaded');
      }, index * 100);
    });

    setTimeout(() => {
      projectItems.forEach(item => {
        item.style.transform = 'none';
      });
    }, projects.length * 100 + 500);

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
      
      // Reset opacity for all items when closing a project
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

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const nextIndex = imageIndexRef.current + 1 < totalImages ? imageIndexRef.current + 1 : imageIndexRef.current;
      handleImageChange(nextIndex);
    },
    onSwipedRight: () => {
      const nextIndex = imageIndexRef.current - 1 >= 0 ? imageIndexRef.current - 1 : imageIndexRef.current;
      handleImageChange(nextIndex);
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

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
              {index < 9 ? `0${index + 1}` : index + 1}
            </span>
            <h3>
              {project.title || project.heading}
            </h3>
            <span className="project-year">{project.year}</span>
          </div>
          <div
            className="project-details"
            ref={(el) => (contentRefs.current[index] = el)} // Attach ref to the content element
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
                    loading={i < 3 ? "eager" : "lazy"}
                    decoding="async"
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


function Projects(props) {
  // Combine projects and sideProjects, then sort by year (newest first, "Ongoing" first)
  const allProjects = [...cv.projects, ...cv.sideProjects].filter(x => x.attachments.length > 0);
  const projects = allProjects.sort((a, b) => {
    // Treat "Ongoing" as the most recent (highest priority)
    if (a.year === 'Ongoing' && b.year !== 'Ongoing') return -1;
    if (a.year !== 'Ongoing' && b.year === 'Ongoing') return 1;
    if (a.year === 'Ongoing' && b.year === 'Ongoing') return 0;
    
    // Convert year strings to numbers for sorting (descending order - newest first)
    const yearA = parseInt(a.year) || 0;
    const yearB = parseInt(b.year) || 0;
    return yearB - yearA;
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [isGridView, setIsGridView] = useState(true);
  const swipeRef = useRef(null);
  const [imageToScrollTo, setImageToScrollTo] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    }
  }, []);

  const openProject = (project) => {
    setSelectedProject(project);
    setIsGridView(true);
    setImageToScrollTo(null);
  };

  const closeProject = () => {
    setSelectedProject(null);
    setImageToScrollTo(null);
  };

  const toggleView = () => {
    setIsGridView(!isGridView);
  };

  const scrollToImage = (index) => {
    if (swipeRef.current) {
      const container = swipeRef.current;
      const mediaContainers = container.querySelectorAll('.media-container');
      if (mediaContainers[index]) {
        const targetContainer = mediaContainers[index];
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetContainer.getBoundingClientRect();
        const scrollLeft = container.scrollLeft + (targetRect.left - containerRect.left) - (containerRect.width / 2) + (targetRect.width / 2);
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth',
        });
      }
    }
  };

  useEffect(() => {
    if (!isGridView && imageToScrollTo !== null) {
      // Wait for DOM to update after view change
      setTimeout(() => {
        scrollToImage(imageToScrollTo);
      }, 50);
    }
  }, [isGridView, imageToScrollTo]);

  useEffect(() => {
    if (selectedProject) {
      const mediaContainers = document.querySelectorAll('.project-content .media-container');
      mediaContainers.forEach((container, index) => {
        setTimeout(() => {
          container.style.opacity = 1;
          container.style.transform = 'translateY(0)';
        }, index * 100);
      });
    }
  }, [selectedProject]);

  useEffect(() => {
    const projectItems = document.querySelectorAll('.project-overview');
    projectItems.forEach((item, index) => {
      setTimeout(() => {
        item.style.opacity = 1;
        item.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }, [projects]);

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
      {!selectedProject && (
        <div className="projects-overview">
          {projects.map((project, index) => (
            <div 
              key={index} 
              className="project-overview"
              style={{
                opacity: 0,
                transform: 'translateY(20px)',
                transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
              }}
              onClick={() => openProject(project)}
            >
              {/* <h3>{project.title}</h3> */}
              <div className="project-overview-images">
                <div className="media-container">
                  {project.attachments[0].type === 'image' ? (
                    <img 
                      src={project.attachments[0].url} 
                      alt={`${project.title} cover image`} 
                      style={{ display: 'block' }} 
                      loading={index < 6 ? "eager" : "lazy"}
                      fetchPriority={index < 3 ? "high" : "auto"}
                      decoding="async"
                      onClick={() => {
                        setImageToScrollTo(0); // Scroll to the first image in swipe view
                        toggleView();
                      }}
                    />
                  ) : (
                    project.attachments[0].type === 'video' && (
                      <video 
                        src={project.attachments[0].url} 
                        autoPlay
                        muted
                        loop
                        playsInline
                        className={`video-player ${isMobile ? 'no-controls' : ''}`}
                        onClick={() => {
                          setImageToScrollTo(0); // Scroll to the first video in swipe view
                          toggleView();
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <div className="project-content">
          <div className={`gallery-images ${isGridView ? 'grid-view' : 'swipe-view'} fade-slide-in`} ref={swipeRef}>
            {selectedProject.attachments.map((attachment, i) => (
              <div 
                key={i} 
                className="media-container"
                style={{
                  opacity: 0,
                  transform: 'translateY(20px)',
                  transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
                }}
              >
                {attachment.type === 'image' ? (
                  <img 
                    src={attachment.url}
                    alt={`${selectedProject.title} image ${i + 1}`}
                    loading="eager"
                    fetchPriority={i < 3 ? "high" : "auto"}
                    decoding="async"
                    onClick={() => {
                      setImageToScrollTo(i);
                      if (isGridView) {
                        toggleView();
                      } else {
                        // If already in swipe view, scroll to the clicked image
                        setTimeout(() => scrollToImage(i), 10);
                      }
                    }}
                  />
                ) : (
                  <video 
                    src={attachment.url} 
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="video-player"
                    onClick={() => {
                      setImageToScrollTo(i);
                      if (isGridView) {
                        toggleView();
                      } else {
                        // If already in swipe view, scroll to the clicked image
                        setTimeout(() => scrollToImage(i), 10);
                      }
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="gallery-header fade-slide-in">
            <h3>
              {selectedProject.title || selectedProject.heading}
            </h3>
            <button className="toggle-view-button" onClick={toggleView}>
              {isGridView ? 'Fullscreen' : 'Grid'}
            </button>
          </div>

          <div className="gallery-text fade-slide-in">
            <div dangerouslySetInnerHTML={{ __html: marked(selectedProject.description || '') }} />
          </div>

          <button className="close-project-button fade-slide-in" onClick={closeProject}>← Back to Projects</button>
        </div>
      )}
    </div>
  );
}


export default App;