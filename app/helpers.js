'use client';

import { useEffect, useRef, useState } from 'react';

/** Keep in sync with --bp-mobile / --bp-narrow in Styles.css */
export const bpMobile = 767;
export const bpNarrow = 499;

export const mediaQuality = 85;

/** Responsive sizes for next/image — keep in sync with layout density. */
export function mediaSizes(role) {
  if (role === 'thumb') return '15vw';
  if (role === 'cover') {
    return `(max-width: ${bpMobile}px) 100vw, (max-width: 1200px) 50vw, 33vw`;
  }
  if (role === 'experiment') {
    return `(max-width: ${bpNarrow}px) 33vw, 110px`;
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

/** Never hold a reveal past this, however slow the network is. Generous
    because the counter keeps the visitor informed while we wait. */
const READY_TIMEOUT = 3000;

/** Preloaded and cached media can finish before hydration, so the load event
    never reaches React. Read the DOM instead, then watch whatever is still
    loading. A container with nothing matching the selector has nothing to wait
    for, so it counts as ready. Returns a cleanup. */
export function watchMediaReady(root, onReady, selector = 'img, video') {
  if (!root) return () => {};

  const cleanups = [];

  root.querySelectorAll(':scope > .media-container').forEach((slide, index) => {
    const media = slide.querySelector(selector);
    if (!media) {
      onReady(index);
      return;
    }

    const isImage = media.tagName === 'IMG';
    const hasPixels = isImage
      ? media.complete && media.naturalWidth > 0
      : media.readyState >= 2;

    if (hasPixels) {
      onReady(index);
      return;
    }

    const done = () => onReady(index);
    const loadEvent = isImage ? 'load' : 'loadeddata';
    media.addEventListener(loadEvent, done);
    media.addEventListener('error', done);
    cleanups.push(() => {
      media.removeEventListener(loadEvent, done);
      media.removeEventListener('error', done);
    });
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

/** Same cascade as useStaggerReady, later trigger: hold a grid until its images
    have pixels, so it reveals as one motion instead of racing the network.
    Videos and audio stay out of the gate — they stream in on their own. The
    running count is the one honest source for anything reporting progress. */
export function useMediaReady(ref, resetKey) {
  const [progress, setProgress] = useState({ ready: false, loaded: 0, total: 0 });

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const total = root.querySelectorAll(':scope > .media-container').length;
    setProgress({ ready: false, loaded: 0, total });

    const loaded = new Set();
    const stopWatching = watchMediaReady(
      root,
      (index) => {
        loaded.add(index);
        setProgress({ ready: loaded.size >= total, loaded: loaded.size, total });
      },
      'img'
    );
    const timer = setTimeout(
      () => setProgress((prev) => ({ ...prev, ready: true })),
      READY_TIMEOUT
    );

    return () => {
      stopWatching();
      clearTimeout(timer);
    };
  }, [ref, resetKey]);

  return progress;
}

/** Browsers often ignore muted autoplay — kick play() explicitly. */
export function playMutedVideos(root) {
  if (!root) return;
  root.querySelectorAll('video').forEach((video) => {
    video.muted = true;
    video.play().catch(() => {});
  });
}

/** Grid loops only while on screen, so five clips don't all decode at once. */
export function playVisibleMutedVideos(root) {
  if (!root || typeof IntersectionObserver === 'undefined') {
    playMutedVideos(root);
    return () => {};
  }

  const videos = root.querySelectorAll('video');
  const onPlaying = (event) => event.target.classList.add('is-live');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        video.muted = true;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { rootMargin: '200px 0px' }
  );

  videos.forEach((video) => {
    video.addEventListener('playing', onPlaying);
    observer.observe(video);
  });
  return () => {
    videos.forEach((video) => video.removeEventListener('playing', onPlaying));
    observer.disconnect();
  };
}

/**
 * Turn a 0–1 signal into a climbing percent. Never overstates real progress;
 * a floor keeps the climb legible when the network is instant. Reads progress
 * from a ref so buffer ticks don't restart the floor.
 */
export function usePacedPercent(real, { active = true, floor = 800, done = false } = {}) {
  const [percent, setPercent] = useState(1);
  const progress = useRef({ real, done });
  progress.current = { real, done };

  useEffect(() => {
    if (!active) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pace = reduced ? 0 : floor;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const { real: ratio, done: isDone } = progress.current;
      const target = isDone ? 100 : Math.max(0, Math.min(100, ratio * 100));
      const shown = pace ? Math.min(target, ((now - start) / pace) * 100) : target;
      setPercent(Math.min(100, Math.max(1, Math.floor(shown))));
      if (shown < 100) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, floor]);

  return percent;
}

/** How much of a video has buffered, 0–1. */
export function videoBufferedRatio(video) {
  if (!video) return 0;
  if (video.readyState >= 3) return 1;
  const { buffered, duration } = video;
  if (!duration || !buffered.length) return 0;
  return Math.min(1, buffered.end(buffered.length - 1) / duration);
}
