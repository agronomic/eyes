'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const ExperimentsSection = dynamic(() => import('./experiments-section'), {
  ssr: false,
});

/** Homepage embed: defer JS/media until the section is near the viewport. */
export default function ExperimentsHome() {
  const anchorRef = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShow(true);
        io.disconnect();
      },
      { rootMargin: '240px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="experiments"
      className="experiments-home section"
      ref={anchorRef}
    >
      <p>Experiments</p>
      <p className="experiments-home-blurb">
        A log of studies and objects made outside of the boundaries of my career.
      </p>
      {show ? (
        <ExperimentsSection lite />
      ) : (
        <div className="experiments-home-slot" aria-hidden="true" />
      )}
    </section>
  );
}
