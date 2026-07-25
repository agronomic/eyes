'use client';

import { useEffect, useState } from 'react';

/** Keep in sync with --bp-mobile / --bp-narrow in Styles.css */
export const bpMobile = 767;
export const bpNarrow = 499;

/** First stage frame eager; thumbs + later slides defer (need width/height for layout). */
export function mediaLoading(role, index = 0) {
  if (role === 'thumb') return 'lazy';
  return index === 0 ? 'eager' : 'lazy';
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
