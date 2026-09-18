/** Animated wireframe cylinder — mounts SVG into a sized DOM container. */
const RADIUS = 1;
const HEIGHT = 2;
const MARGIN = 0.12;
/** Full 360° spin duration (continuous, no holds). */
const CYCLE_MS = 16000;
const SIDES = [0, Math.PI];
const SVG_NS = 'http://www.w3.org/2000/svg';
const STROKE_SQUARE = 'rgba(0, 161, 255, 1)';
const STROKE_CIRCLE = 'rgba(224, 14, 0, 1)';
const FLAT_EPS = 0.6;

/** Continuous yaw — steady spin, no pause on square/circle. */
function yawAt(elapsed) {
  const t = ((elapsed % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;
  return (t / CYCLE_MS) * Math.PI * 2;
}

/**
 * Color snaps when the spin arrives at a cardinal pose, then holds through
 * the turn to the next — same timing as the old pause-on-shape version.
 * 0, π → blue (square); π/2, 3π/2 → red (circle).
 */
function strokeForYaw(yaw) {
  const twoPi = Math.PI * 2;
  const a = ((yaw % twoPi) + twoPi) % twoPi;
  const sector = Math.floor(a / (Math.PI / 2)) % 4;
  return sector % 2 === 0 ? STROKE_SQUARE : STROKE_CIRCLE;
}

function ellipseAt(halfH, yaw) {
  const s = Math.sin(yaw);
  return {
    cx: 0,
    cy: halfH * Math.cos(yaw),
    rx: RADIUS,
    ry: RADIUS * Math.abs(s),
    depth: halfH * s,
  };
}

function rotateY(x, y, z, yaw) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x, y: y * c - z * s };
}

function project(pt, ox, oy, scale) {
  return { x: ox + pt.x * scale, y: oy - pt.y * scale };
}

function fitScale(w, h) {
  const diag = 2 * Math.SQRT2;
  return (Math.min(w, h) * (1 - 2 * MARGIN)) / diag;
}

function sideEdges(yaw) {
  const halfH = HEIGHT / 2;
  return SIDES.map((a) => {
    const x = RADIUS * Math.cos(a);
    const z = RADIUS * Math.sin(a);
    return [rotateY(x, halfH, z, yaw), rotateY(x, -halfH, z, yaw)];
  });
}

function el(name) {
  return document.createElementNS(SVG_NS, name);
}

function stroke(node, width, color) {
  node.setAttribute('fill', 'none');
  node.setAttribute('stroke', color);
  node.setAttribute('stroke-linejoin', 'round');
  node.setAttribute('stroke-linecap', 'round');
  node.setAttribute('stroke-width', String(width));
}

function makeCap() {
  const group = el('g');
  const ellipse = el('ellipse');
  const flat = el('line');
  stroke(ellipse, 1, STROKE_SQUARE);
  stroke(flat, 1, STROKE_SQUARE);
  group.append(ellipse, flat);
  return { group, ellipse, flat, depth: 0 };
}

/**
 * Draw an animated cylinder into `element`. Element needs a real size
 * (e.g. width + aspect-ratio). Returns { remove() } for cleanup.
 */
export function mountCylinder(element) {
  if (!(element instanceof HTMLElement)) {
    throw Error('mountCylinder(element) needs a DOM element to draw into.');
  }

  if (getComputedStyle(element).position === 'static') {
    element.style.position = 'relative';
  }
  element.style.overflow = 'hidden';

  const svg = el('svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.style.inset = '0';
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.display = 'block';
  svg.style.pointerEvents = 'none';

  const bg = el('rect');
  bg.setAttribute('class', 'cylinder-tile-bg');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  /* Transparent — container CSS background is what eases on hover */
  bg.setAttribute('fill', 'transparent');

  const top = makeCap();
  const bottom = makeCap();
  const edgeA = el('line');
  const edgeB = el('line');
  stroke(edgeA, 1, STROKE_SQUARE);
  stroke(edgeB, 1, STROKE_SQUARE);

  svg.append(bg, top.group, bottom.group, edgeA, edgeB);
  element.append(svg);

  const started = performance.now();
  let frame = 0;

  const syncSize = () => {
    const w = Math.max(1, Math.round(element.clientWidth));
    const h = Math.max(1, Math.round(element.clientHeight));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
  };

  const ro = new ResizeObserver(syncSize);
  ro.observe(element);
  syncSize();

  const drawCap = (cap, halfH, yaw, ox, oy, scale, sw, color) => {
    const e = ellipseAt(halfH, yaw);
    const c = project({ x: e.cx, y: e.cy }, ox, oy, scale);
    const rx = e.rx * scale;
    const ry = e.ry * scale;
    cap.depth = e.depth;
    stroke(cap.ellipse, sw, color);
    stroke(cap.flat, sw, color);

    if (ry < FLAT_EPS) {
      cap.ellipse.setAttribute('visibility', 'hidden');
      cap.flat.setAttribute('visibility', 'visible');
      cap.flat.setAttribute('x1', String(c.x - rx));
      cap.flat.setAttribute('y1', String(c.y));
      cap.flat.setAttribute('x2', String(c.x + rx));
      cap.flat.setAttribute('y2', String(c.y));
      return;
    }

    cap.flat.setAttribute('visibility', 'hidden');
    cap.ellipse.setAttribute('visibility', 'visible');
    cap.ellipse.setAttribute('cx', String(c.x));
    cap.ellipse.setAttribute('cy', String(c.y));
    cap.ellipse.setAttribute('rx', String(rx));
    cap.ellipse.setAttribute('ry', String(ry));
  };

  const tick = () => {
    const elapsed = performance.now() - started;
    const w = Math.max(1, Math.round(element.clientWidth));
    const h = Math.max(1, Math.round(element.clientHeight));
    const yaw = yawAt(elapsed);
    const color = strokeForYaw(yaw);
    const scale = fitScale(w, h);
    const ox = w / 2;
    const oy = h / 2;
    const halfH = HEIGHT / 2;
    const baseSw = 1;

    const topE = ellipseAt(halfH, yaw);
    const botE = ellipseAt(-halfH, yaw);

    drawCap(top, halfH, yaw, ox, oy, scale, baseSw, color);
    drawCap(bottom, -halfH, yaw, ox, oy, scale, baseSw, color);

    const near = topE.depth <= botE.depth ? top : bottom;
    const far = near === top ? bottom : top;
    stroke(edgeA, baseSw, color);
    stroke(edgeB, baseSw, color);

    const sides = sideEdges(yaw);
    const a0 = project(sides[0][0], ox, oy, scale);
    const a1 = project(sides[0][1], ox, oy, scale);
    const b0 = project(sides[1][0], ox, oy, scale);
    const b1 = project(sides[1][1], ox, oy, scale);

    edgeA.setAttribute('x1', String(a0.x));
    edgeA.setAttribute('y1', String(a0.y));
    edgeA.setAttribute('x2', String(a1.x));
    edgeA.setAttribute('y2', String(a1.y));
    edgeB.setAttribute('x1', String(b0.x));
    edgeB.setAttribute('y1', String(b0.y));
    edgeB.setAttribute('x2', String(b1.x));
    edgeB.setAttribute('y2', String(b1.y));

    svg.append(bg, near.group, edgeA, edgeB, far.group);
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  return {
    remove: () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      svg.remove();
    },
  };
}
