import cv from './content';

/** Site colophon — contact, typeface, copyright. */
export default function Colophon() {
  return (
    <section className="colophon-section section">
      <p>Colophon</p>
      <ul className="colophon-list">
        <li>
          Contact:{' '}
          <a href={`mailto:${cv.general.colophon.email}`}>
            {cv.general.colophon.email}
          </a>
        </li>
        <li>Typeface: {cv.general.colophon.typeface}</li>
        <li>
          Copyright: {new Date().getFullYear()} {cv.general.displayName}
        </li>
      </ul>
    </section>
  );
}
