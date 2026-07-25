"use client";

import React, { useEffect, useRef } from 'react';

import Navigation from '../navigation';
import experiments from '../../public/content/experiments.json';
import { playMutedVideos, useStaggerReady } from '../helpers';

export default function ExperimentsPage() {
  const gridRef = useRef(null);
  const staggerReady = useStaggerReady();

  useEffect(() => {
    playMutedVideos(gridRef.current);
  }, []);

  return (
    <div className="container">
      <Navigation />

      {experiments.length === 0 ? (
        <div className="placeholderText">
          Add media to public/content/experiments.json
        </div>
      ) : (
        <div
          className={`experiments-grid${staggerReady ? ' stagger-ready' : ''}`}
          ref={gridRef}
        >
          {experiments.map((item, index) => (
            <div
              key={item.id || index}
              className="media-container"
              style={{ '--stagger': index }}
            >
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
