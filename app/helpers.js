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

/** Match fadeSlideInSequential's duration — keep in sync with Styles.css */
const STAGGER_DURATION_MS = 500;

/** Buffer a preview without letting it run ahead of its poster. */
function warmVideo(video) {
  video.muted = true;
  video.preload = 'auto';
  const pin = () => {
    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      // Some browsers reject seeks before metadata
    }
  };
  video.addEventListener('loadeddata', pin, { once: true });
  if (video.readyState >= 2) pin();
  else video.load();
}

/**
 * Grid loops only while on screen. Previews stay paused on frame 0 until that
 * tile's cascade has finished and the file can play — then play + fade together
 * so the handoff from the still is seamless.
 */
export function playVisibleMutedVideos(root) {
  if (!root) return () => {};

  const videos = root.querySelectorAll('video');
  const cascadeStarted = performance.now();
  const stepMs =
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--stagger-step')
    ) || 90;
  const timers = new Set();
  const warmed = new WeakSet();
  const queued = new WeakSet();
  const pendingCanPlay = new WeakMap();

  const cascadeDoneAt = (video) => {
    const tile = video.closest('.media-container');
    const stagger = Number.parseFloat(getComputedStyle(tile).getPropertyValue('--stagger')) || 0;
    return cascadeStarted + stagger * stepMs + STAGGER_DURATION_MS;
  };

  const startLive = (video) => {
    if (video.classList.contains('is-live')) return;
    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      // ignore
    }
    video.muted = true;
    video.classList.add('is-live');
    video.play().catch(() => {});
  };

  const revealWhenReady = (video) => {
    if (video.classList.contains('is-live')) return;

    const afterCascade = () => {
      if (video.classList.contains('is-live')) return;
      if (video.readyState >= 2) {
        startLive(video);
        return;
      }
      const onReady = () => {
        pendingCanPlay.delete(video);
        startLive(video);
      };
      pendingCanPlay.set(video, onReady);
      video.addEventListener('canplay', onReady, { once: true });
    };

    const wait = Math.max(0, cascadeDoneAt(video) - performance.now());
    const timer = setTimeout(() => {
      timers.delete(timer);
      afterCascade();
    }, wait);
    timers.add(timer);
  };

  const arm = (video) => {
    if (!warmed.has(video)) {
      warmed.add(video);
      warmVideo(video);
    }
    if (!queued.has(video)) {
      queued.add(video);
      revealWhenReady(video);
    }
  };

  if (typeof IntersectionObserver === 'undefined') {
    videos.forEach((video) => arm(video));
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      pendingCanPlay.forEach((onReady, video) => {
        video.removeEventListener('canplay', onReady);
      });
    };
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          arm(video);
          if (video.classList.contains('is-live')) {
            video.play().catch(() => {});
          }
        } else {
          video.pause();
        }
      });
    },
    { rootMargin: '200px 0px' }
  );

  videos.forEach((video) => observer.observe(video));
  return () => {
    timers.forEach((timer) => clearTimeout(timer));
    pendingCanPlay.forEach((onReady, video) => {
      video.removeEventListener('canplay', onReady);
    });
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
