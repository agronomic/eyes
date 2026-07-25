'use client';

import { useEffect, useState } from 'react';

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
