'use client';

import { useEffect, useRef, useState } from 'react';

/** Long enough for the climb to register as a climb, short enough to stay out
    of the way when everything is already cached. */
const FLOOR = 800;
const SESSION_KEY = 'media-counter-played';

/** Private browsing can throw on storage access; then the counter just plays
    again next time, which is harmless. */
function playedThisSession() {
  try {
    return Boolean(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return false;
  }
}

function rememberPlayed() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Nothing to remember it with
  }
}

/** Covers the page while media decodes, counting to 100 before handing over to
    the reveal. Plays once a session; later visits skip straight to onDone. */
export default function MediaCounter({ loaded, total, done, onDone }) {
  const [phase, setPhase] = useState('idle'); // idle → counting → leaving → gone
  const [percent, setPercent] = useState(1);
  const progress = useRef({ loaded, total, done });

  useEffect(() => {
    progress.current = { loaded, total, done };
  }, [loaded, total, done]);

  // sessionStorage has no server value, so the choice waits for the client
  useEffect(() => {
    setPhase(playedThisSession() ? 'gone' : 'counting');
  }, []);

  useEffect(() => {
    if (phase === 'gone') onDone();
  }, [phase, onDone]);

  useEffect(() => {
    if (phase !== 'counting') return undefined;

    const floor = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : FLOOR;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const media = progress.current;
      const real = media.done
        ? 100
        : (media.total ? (media.loaded / media.total) * 100 : 0);
      // Never overstate what has loaded, never outrun the floor
      const shown = floor ? Math.min(real, ((now - start) / floor) * 100) : real;

      setPercent(Math.min(100, Math.max(1, Math.floor(shown))));

      if (shown >= 100) {
        rememberPlayed();
        setPhase('leaving');
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  // The fade end is the normal handover; this only covers it never arriving
  useEffect(() => {
    if (phase !== 'leaving') return undefined;
    const timer = setTimeout(() => setPhase('gone'), 1000);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'counting' && phase !== 'leaving') return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [phase]);

  if (phase !== 'counting' && phase !== 'leaving') return null;

  return (
    <div
      className={`media-counter${phase === 'leaving' ? ' is-leaving' : ''}`}
      onTransitionEnd={() => setPhase('gone')}
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <span aria-hidden="true">{percent}%</span>
    </div>
  );
}
