'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import Image from 'next/image';

import ExpandVideo from './expand-video';
import MediaCounter from './media-counter';
import experiments from '../public/content/experiments.json';
import {
  assignColumnStagger,
  mediaQuality,
  mediaSizes,
  mediaSrc,
  playVisibleMutedVideos,
  useMediaReady,
} from './helpers';

/**
 * Experiments masonry + expand overlay.
 * lite: no full-page MediaCounter; lazy images — for homepage embed.
 */
export default function ExperimentsSection({ lite = false }) {
  const gridRef = useRef(null);
  const { ready, loaded, total } = useMediaReady(gridRef);
  const [countedIn, setCountedIn] = useState(lite);
  const onCounted = useCallback(() => setCountedIn(true), []);
  const [staggerReady, setStaggerReady] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const openItem = openIndex == null ? null : experiments[openIndex];
  const gateOpen = lite ? true : ready && countedIn;

  useEffect(() => {
    if (!gateOpen) {
      setStaggerReady(false);
      return undefined;
    }
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      assignColumnStagger(gridRef.current);
      inner = requestAnimationFrame(() => {
        assignColumnStagger(gridRef.current);
        setStaggerReady(true);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [gateOpen, ready]);

  useEffect(() => {
    if (!staggerReady) return undefined;
    return playVisibleMutedVideos(gridRef.current);
  }, [staggerReady]);

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
    flushSync(() => setOpenIndex(index));
  };

  const close = () => setOpenIndex(null);

  if (experiments.length === 0) {
    return (
      <div className="placeholderText">
        Add media to public/content/experiments.json
      </div>
    );
  }

  const loading = lite ? 'lazy' : 'eager';

  return (
    <>
      {!lite && (
        <MediaCounter
          loaded={loaded}
          total={total}
          done={ready}
          onDone={onCounted}
        />
      )}

      <div
        className={`experiments-grid${staggerReady ? ' stagger-ready' : ''}`}
        ref={gridRef}
      >
        {experiments.map((item, index) => {
          const expandable = item.type === 'image' || item.type === 'video';
          const hasRatio = Boolean(item.width && item.height);
          const ratioStyle = hasRatio
            ? {
                aspectRatio: `${item.width} / ${item.height}`,
                '--media-ratio': `${item.width} / ${item.height}`,
              }
            : undefined;
          return (
            <div
              key={item.id || index}
              className={`media-container${expandable ? ' is-expandable' : ''}${hasRatio ? ' has-ratio' : ''}`}
              style={ratioStyle}
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
                  src={mediaSrc(item.url, 'experiment')}
                  alt={item.alt || ''}
                  width={item.width || 800}
                  height={item.height || 600}
                  sizes={mediaSizes('experiment')}
                  quality={mediaQuality}
                  loading={loading}
                />
              )}
              {item.type === 'video' && (
                <>
                  {item.poster ? (
                    <Image
                      src={mediaSrc(item.poster, 'experiment')}
                      alt={item.alt || ''}
                      width={item.width || 800}
                      height={item.height || 600}
                      sizes={mediaSizes('experiment')}
                      quality={mediaQuality}
                      loading={loading}
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

      {portalReady &&
        openItem &&
        createPortal(
          <div
            className="experiments-expand"
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={openItem.alt || 'Expanded media'}
          >
            <div className="experiments-expand-frame">
              {openItem.type === 'image' ? (
                <Image
                  src={mediaSrc(openItem.url, 'stage')}
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
          </div>,
          document.body
        )}
    </>
  );
}
