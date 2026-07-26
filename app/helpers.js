'use client';

import { useEffect, useState } from 'react';

/** Keep in sync with --bp-mobile / --bp-narrow in Styles.css */
export const bpMobile = 767;
export const bpNarrow = 499;

export const mediaQuality = 85;

/** Stage slides need layout for thumb jump-scroll on iOS; thumbs can defer. */
export function mediaLoading(role) {
  return role === 'stage' ? 'eager' : 'lazy';
}

/** Responsive sizes for next/image — keep in sync with layout density. */
export function mediaSizes(role) {
  if (role === 'thumb') return '15vw';
  if (role === 'cover') {
    return `(max-width: ${bpMobile}px) 100vw, (max-width: 1200px) 50vw, 33vw`;
  }
  if (role === 'experiment') {
    return `(max-width: ${bpNarrow}px) 33vw, 150px`;
  }
  // stage + expand
  return '100vw';
}

/** After mount (and when resetKey changes), enable CSS grid stagger. */
export function useStaggerReady(resetKey) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [resetKey]);

  return ready;
}

/** Browsers often ignore muted autoplay — kick play() explicitly. */
export function playMutedVideos(root) {
  if (!root) return;
  root.querySelectorAll('video').forEach((video) => {
    video.muted = true;
    video.play().catch(() => {});
  });
}
