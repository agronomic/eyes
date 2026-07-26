"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import Navigation from '../navigation';
import experiments from '../../public/content/experiments.json';
import {
  mediaQuality,
  mediaSizes,
  playMutedVideos,
  useStaggerReady,
} from '../helpers';

export default function ExperimentsPage() {
  const gridRef = useRef(null);
  const expandRef = useRef(null);
  const staggerReady = useStaggerReady();
  const [openIndex, setOpenIndex] = useState(null);

  const openItem = openIndex == null ? null : experiments[openIndex];

  useEffect(() => {
    playMutedVideos(gridRef.current);
  }, []);

  useEffect(() => {
    if (openItem?.type === 'video') {
      playMutedVideos(expandRef.current);
    }
  }, [openItem]);

  useEffect(() => {
    if (openIndex == null) return;

    const onKey = (e) => {
      if (e.key === 'Escape') setOpenIndex(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [openIndex]);

  const close = () => setOpenIndex(null);

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
          {experiments.map((item, index) => {
            const expandable = item.type === 'image' || item.type === 'video';
            return (
              <div
                key={item.id || index}
                className={`media-container${expandable ? ' is-expandable' : ''}`}
                style={{ '--stagger': index }}
                onClick={expandable ? () => setOpenIndex(index) : undefined}
                role={expandable ? 'button' : undefined}
                tabIndex={expandable ? 0 : undefined}
                onKeyDown={
                  expandable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setOpenIndex(index);
                        }
                      }
                    : undefined
                }
              >
                {item.type === 'image' && (
                  <Image
                    src={item.url}
                    alt={item.alt || ''}
                    width={item.width || 800}
                    height={item.height || 600}
                    sizes={mediaSizes('experiment')}
                    quality={mediaQuality}
                    style={{ width: '100%', height: 'auto' }}
                  />
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
            );
          })}
        </div>
      )}

      {openItem && (
        <div
          className="experiments-expand"
          ref={expandRef}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={openItem.alt || 'Expanded media'}
        >
          {openItem.type === 'image' ? (
            <Image
              src={openItem.url}
              alt={openItem.alt || ''}
              width={openItem.width || 1600}
              height={openItem.height || 1200}
              sizes={mediaSizes('stage')}
              quality={mediaQuality}
              priority
            />
          ) : (
            <video
              src={openItem.url}
              autoPlay
              muted
              loop
              playsInline
              className="video-player"
            />
          )}
        </div>
      )}
    </div>
  );
}
