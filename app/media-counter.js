'use client';

import { useEffect, useState } from 'react';
import { usePacedPercent } from './helpers';

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
  // Starts covering the page from the very first paint, so the nav is never
  // shown only to be hidden a moment later. Being the page's own black, that
  // costs nothing to look at while the client makes up its mind.
  const [phase, setPhase] = useState('blocking'); // → counting → leaving → gone
  const real = done ? 1 : total ? loaded / total : 0;
  const percent = usePacedPercent(real, {
    active: phase === 'counting',
    done: done && phase === 'counting',
    floor: 800,
  });

  // sessionStorage has no server value, so the choice waits for the client
  useEffect(() => {
    setPhase(playedThisSession() ? 'gone' : 'counting');
  }, []);

  useEffect(() => {
    if (phase === 'gone') onDone();
  }, [phase, onDone]);

  useEffect(() => {
    if (phase !== 'counting' || percent < 100) return;
    rememberPlayed();
    setPhase('leaving');
  }, [phase, percent]);

  // The fade end is the normal handover; this only covers it never arriving
  useEffect(() => {
    if (phase !== 'leaving') return undefined;
    const timer = setTimeout(() => setPhase('gone'), 1000);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'gone') return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [phase]);

  if (phase === 'gone') return null;

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
      {phase !== 'blocking' && <span aria-hidden="true">{percent}%</span>}
    </div>
  );
}
