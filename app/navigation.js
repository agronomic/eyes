'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import cv from './content';

export default function Navigation() {
  const pathname = usePathname();
  const onOverview = pathname === '/';
  const showBack = !onOverview;

  if (showBack) {
    return (
      <div className="navigation-bar">
        <div className="title">
          <Link href="/">← Back to Overview</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="navigation-bar">
      <div className="title">
        <Link href="/">{cv.general.displayName}</Link>
      </div>
      <div className="nav-links">
        <Link href="/experiments">Experiments</Link>
      </div>
    </div>
  );
}
