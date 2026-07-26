'use client';

import { useEffect, useRef, useState } from 'react';
import { usePacedPercent, videoBufferedRatio } from './helpers';

/** Don't leave someone staring at a number forever on a stalled download. */
const EXPAND_TIMEOUT = 15000;

/**
 * Expand-view video: poster first, paced percent while the full file buffers,
 * then unmuted playback. Mount inside the click that opened it (flushSync) so
 * the browser treats sound as part of the user gesture.
 */
export default function ExpandVideo({ src, poster, width, height }) {
  const videoRef = useRef(null);
  const [buffer, setBuffer] = useState(0);
  const [ready, setReady] = useState(false);
  const percent = usePacedPercent(buffer, {
    active: !ready,
    done: ready,
    floor: 600,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    let settled = false;
    const sync = () => setBuffer(videoBufferedRatio(video));
    const settle = () => {
      if (settled) return;
      settled = true;
      setReady(true);
      setBuffer(1);
    };

    sync();
    if (video.readyState >= 3) settle();

    video.addEventListener('progress', sync);
    video.addEventListener('canplay', sync);
    video.addEventListener('canplaythrough', settle);
    video.addEventListener('playing', settle);
    video.addEventListener('error', settle);
    const timer = setTimeout(settle, EXPAND_TIMEOUT);

    video.muted = false;
    video.play().catch(() => {
      // Gesture may have been lost; still show the piece muted.
      video.muted = true;
      video.play().catch(() => {});
    });

    return () => {
      clearTimeout(timer);
      video.removeEventListener('progress', sync);
      video.removeEventListener('canplay', sync);
      video.removeEventListener('canplaythrough', settle);
      video.removeEventListener('playing', settle);
      video.removeEventListener('error', settle);
    };
  }, [src]);

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        width={width || undefined}
        height={height || undefined}
        autoPlay
        loop
        playsInline
        preload="auto"
        className="video-player"
      />
      {!ready && (
        <span className="media-percent" aria-live="polite">
          {percent}%
        </span>
      )}
    </>
  );
}
