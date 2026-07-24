"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import cv from './cv';

export default function Navigation() {
  const pathname = usePathname();
  const onProjectPage = pathname?.startsWith('/index/');

  if (onProjectPage) {
    return (
      <div className="navigation-bar">
        <div className="title">
          <Link href="/">← Back to Projects</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="navigation-bar">
      <div className="title">
        <Link href="/">
          {cv.general.displayName}
        </Link>
      </div>
      <div className="nav-links">
        <Link href="/" className={pathname === '/' ? 'active' : ''}>
          Projects
        </Link>
        <Link href="/experiments" className={pathname === '/experiments' ? 'active' : ''}>
          Experiments
        </Link>
      </div>
    </div>
  );
}
