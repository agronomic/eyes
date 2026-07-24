"use client";

import React, { useEffect, useRef } from 'react';
import '@fontsource-variable/inter';
import '@fontsource/atkinson-hyperlegible';

import Navigation from '../Navigation';
import experiments from '../../public/content/experiments.json';

export default function ExperimentsPage() {
  const gridRef = useRef(null);

  // Browsers often ignore the autoplay attribute — kick play() on muted videos
  useEffect(() => {
    const root = gridRef.current;
    if (!root) return;
    root.querySelectorAll('video').forEach((video) => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }, []);

  return (
    <div className="container">
      <Navigation />

      {experiments.length === 0 ? (
        <div className="placeholderText">
          Add media to public/content/experiments.json
        </div>
      ) : (
        <div className="experiments-grid" ref={gridRef}>
          {experiments.map((item, index) => (
            <div key={item.id || index} className="media-container">
              {item.type === 'image' && (
                <img src={item.url} alt={item.alt || ''} loading="lazy" decoding="async" />
              )}
              {item.type === 'video' && (
                <video
                  src={item.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="video-player"
                />
              )}
              {item.type === 'audio' && (
                <audio src={item.url} controls className="audio-player" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
