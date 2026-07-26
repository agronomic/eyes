"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Image from 'next/image';

import Navigation from '../navigation';
import MediaCounter from '../media-counter';
import ExpandVideo from '../expand-video';
import experiments from '../../public/content/experiments.json';
import {
  mediaQuality,
  mediaSizes,
  playVisibleMutedVideos,
  useMediaReady,
} from '../helpers';

export default function ExperimentsPage() {
  const gridRef = useRef(null);
  const { ready, loaded, total } = useMediaReady(gridRef);
  const [countedIn, setCountedIn] = useState(false);
  const onCounted = useCallback(() => setCountedIn(true), []);
  // The cascade is the counter's handover, so it waits for both
  const staggerReady = ready && countedIn;
  const [openIndex, setOpenIndex] = useState(null);

  const openItem = openIndex == null ? null : experiments[openIndex];

  useEffect(() => playVisibleMutedVideos(gridRef.current), []);

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

  const open = (index) => {
    // Keep the click gesture alive so the expand video can start with sound.
    flushSync(() => setOpenIndex(index));
  };

  const close = () => setOpenIndex(null);

  return (
    <div className="container">
      <MediaCounter
        loaded={loaded}
        total={total}
        done={ready}
        onDone={onCounted}
      />
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
                onClick={expandable ? () => open(index) : undefined}
                role={expandable ? 'button' : undefined}
                tabIndex={expandable ? 0 : undefined}
                onKeyDown={
                  expandable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          open(index);
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
                    loading="eager"
                    style={{ width: '100%', height: 'auto' }}
                  />
                )}
                {item.type === 'video' && (
                  <>
                    {item.poster ? (
                      <Image
                        src={item.poster}
                        alt={item.alt || ''}
                        width={item.width || 800}
                        height={item.height || 600}
                        sizes={mediaSizes('experiment')}
                        quality={mediaQuality}
                        loading="eager"
                        className="video-still"
                      />
                    ) : null}
                    <video
                      src={item.preview || item.url}
                      poster={item.poster || undefined}
                      width={item.width || undefined}
                      height={item.height || undefined}
                      muted
                      loop
                      playsInline
                      preload="none"
                      className="video-player"
                    />
                  </>
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
            <ExpandVideo
              src={openItem.url}
              poster={openItem.poster}
              width={openItem.width}
              height={openItem.height}
            />
          )}
        </div>
      )}
    </div>
  );
}
