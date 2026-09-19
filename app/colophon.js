import cv from './content';
import MetaLabel from './meta-label';

/** Site colophon — contact, typeface, copyright. */
export default function Colophon() {
  return (
    <section className="colophon-section section">
      <p>Colophon</p>
      <ul className="colophon-list">
        <li>
          <MetaLabel>Contact:</MetaLabel>{' '}
          <a href={`mailto:${cv.general.colophon.email}`}>
            {cv.general.colophon.email}
          </a>
        </li>
        <li>
          <MetaLabel>Typeface:</MetaLabel> {cv.general.colophon.typeface}
        </li>
        <li>
          <MetaLabel>Copyright:</MetaLabel> {new Date().getFullYear()}{' '}
          {cv.general.displayName}
        </li>
      </ul>
    </section>
  );
}
