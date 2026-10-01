"use client";

// Experience as a space flight: a long winding flight path runs down the page through
// open space, with one job per waypoint, about a screen apart, so the visitor meets them
// one at a time. The ship rides the line on screen where the path starts at the top of
// the page: ScrollTrigger maps how much of the path has passed that line to a position
// along it, and one GSAP ticker pass eases toward it and writes every transform (ship
// position and heading, path fill, engine flame, thruster sparks) straight to the DOM,
// so scrolling never re-renders React - only the active waypoint is state.
// (Internally the path is still called the "road" and the ship the "car".)

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlowButton } from "@/components/ui/flow-button";
import { experience } from "@/data/experience";
import { cn, siteConfig } from "@/lib/utils";

const COUNT = experience.length;

/* Road length in svh: half a screen from START to the first checkpoint, a checkpoint
   every GAP after that, and half a screen on to END - so one checkpoint fills the view
   at a time. */
const LEAD = 50;
const GAP = 90;
const ROAD_SVH = LEAD * 2 + (COUNT - 1) * GAP;

/** Where each checkpoint sits along the road, from 0 (START) to 1 (END). */
const STOPS = experience.map((_, i) => (LEAD + i * GAP) / ROAD_SVH);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const nearestStop = (pos: number) =>
  STOPS.reduce((best, stop, i) => (Math.abs(stop - pos) < Math.abs(STOPS[best] - pos) ? i : best), 0);

/* ---------------------------------------------------------------------------------
   Road shape: a sine wave down the stage, one half-wave between checkpoints.
   Desktop: the road swings out toward each checkpoint's card (cards alternate sides,
   so the road snakes between them) - cards sit beyond the road's widest swing, so it
   never runs under one.
   Phones: a gentler wiggle that crosses the centre line at every checkpoint, so the
   single column of cards lines up with it.
   --------------------------------------------------------------------------------- */

const HALF_WAVE = GAP / ROAD_SVH;
const SAMPLES = 240;

interface Geometry {
  width: number;
  height: number;
  desktop: boolean;
  centre: number; // x of the road's centre line
  amplitude: number; // how far the road swings either side
  roadWidth: number;
}

function roadX(t: number, g: Geometry) {
  const angle = ((t - STOPS[0]) / HALF_WAVE) * Math.PI;
  return g.centre + g.amplitude * (g.desktop ? -Math.cos(angle) : Math.sin(angle));
}

/** Samples the road into an SVG path plus cumulative lengths (for the travelled fill). */
function traceRoad(g: Geometry) {
  const lengths = [0];
  let d = "";
  let prevX = 0;
  let prevY = 0;
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const x = roadX(t, g);
    const y = t * g.height;
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    if (i) lengths.push(lengths[i - 1] + Math.hypot(x - prevX, y - prevY));
    prevX = x;
    prevY = y;
  }
  return { d, lengths, total: lengths[SAMPLES] };
}

type Road = ReturnType<typeof traceRoad>;

function lengthAt(t: number, lengths: number[]) {
  const x = clamp(t, 0, 1) * SAMPLES;
  const i = Math.min(Math.floor(x), SAMPLES - 1);
  return lengths[i] + (lengths[i + 1] - lengths[i]) * (x - i);
}

function measure(box: HTMLElement): Geometry {
  const width = box.clientWidth;
  const height = box.clientHeight;
  const desktop = window.matchMedia("(min-width: 768px)").matches; // Tailwind `md`
  return desktop
    ? { width, height, desktop, centre: width / 2, amplitude: Math.min(110, width * 0.1), roadWidth: 72 }
    : { width, height, desktop, centre: 40, amplitude: 16, roadWidth: 52 };
}

/* ---------------------------------------------------------------------------------
   Scenery: monochrome space either side of the flight path - sparkling stars, drifting
   asteroids, planets and ringed planets over a field of star dust. Positions come from
   a seeded random generator, so the sky is the same on every visit; everything keeps
   off the path and out from behind the experience cards.
   --------------------------------------------------------------------------------- */

type TreeKind = "star" | "asteroid" | "planet" | "ringed";

interface Tree {
  kind: TreeKind;
  x: number; // base (ground) point
  y: number;
  h: number; // height
  tone: number; // 0-1, dark to light grey
}

interface Tuft {
  x: number;
  y: number;
  s: number;
}

/** Small deterministic PRNG (mulberry32). */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const grey = (tone: number, lift = 0) => {
  const v = Math.round(52 + tone * 44 + lift);
  return `rgb(${v},${v},${v})`;
};

function plantScenery(g: Geometry): { trees: Tree[]; tufts: Tuft[] } {
  const random = seeded(7);
  const scale = g.desktop ? 1 : 0.7;
  const cell = g.desktop ? 58 : 44;
  const bleed = g.desktop ? 320 : 0; // spill past the content column on wide screens
  // Cards hang down from their checkpoint (top 40px above it), so the clearing does too.
  const cardTop = 40 + 24;
  const cardBottom = g.desktop ? 470 : 520;

  // Rectangles to keep clear: where each experience card sits.
  const cardZones = STOPS.map((stop, i) => {
    const y = stop * g.height;
    if (!g.desktop) return { left: 68, right: g.width + 10, top: y - cardTop, bottom: y + cardBottom };
    const place = besideRoad(i, g);
    const width = place.width as number;
    const left = typeof place.left === "number" ? place.left : g.width - (place.right as number) - width;
    return { left: left - 24, right: left + width + 24, top: y - cardTop, bottom: y + cardBottom };
  });

  const distanceToRoad = (x: number, y: number) => {
    let nearest = Infinity;
    for (let dy = -70; dy <= 70; dy += 10) {
      const t = clamp((y + dy) / g.height, 0, 1);
      nearest = Math.min(nearest, Math.hypot(x - roadX(t, g), y - t * g.height));
    }
    return nearest;
  };
  const clearOf = (left: number, right: number, top: number, bottom: number) =>
    !cardZones.some((z) => right > z.left && left < z.right && bottom > z.top && top < z.bottom);

  const trees: Tree[] = [];
  const tufts: Tuft[] = [];
  for (let y = 40; y < g.height + cell; y += cell) {
    for (let x = -bleed; x < g.width + bleed; x += cell) {
      const tx = x + random() * cell;
      const ty = y + random() * cell;
      const roll = random();

      if (roll < 0.3) {
        const kindRoll = random();
        const kind: TreeKind = kindRoll < 0.55 ? "star" : kindRoll < 0.82 ? "asteroid" : kindRoll < 0.94 ? "planet" : "ringed";
        const base = { star: 10, asteroid: 12, planet: 34, ringed: 30 }[kind];
        const h = (base + random() * base * 0.7) * scale;
        const halfWidth = (kind === "ringed" ? h * 1.1 : h * 0.5) + 2;
        // Keep the whole silhouette (base to crown) off the road and away from the cards.
        const clearance = g.roadWidth / 2 + halfWidth + 8;
        if (distanceToRoad(tx, ty) < clearance || distanceToRoad(tx, ty - h * 0.6) < clearance) continue;
        if (!clearOf(tx - halfWidth, tx + halfWidth, ty - h, ty + 4)) continue;
        trees.push({ kind, x: tx, y: ty, h, tone: random() });
      } else if (roll < 0.95) {
        const sz = (0.7 + random() * 0.6) * scale;
        if (distanceToRoad(tx, ty) < g.roadWidth / 2 + 8) continue;
        if (!clearOf(tx - 6, tx + 6, ty - 8, ty)) continue;
        tufts.push({ x: tx, y: ty, s: sz });
      }
    }
  }
  // Depth: draw from the back (top of the page) to the front.
  trees.sort((a, b) => a.y - b.y);
  return { trees, tufts };
}

/** One space object, sitting on its base point (0, 0). Lit from the top-left. */
function TreeShape({ tree }: { tree: Tree }) {
  const { kind, h, tone } = tree;
  const body = grey(tone * 0.6, -14);
  const lit = grey(tone, 40);
  const r = h / 2;

  if (kind === "star") {
    // Four-point sparkle with a soft glow
    const k = r * 0.18;
    return (
      <g transform={`translate(0 ${-r})`}>
        <circle r={r * 0.9} fill="#fff" opacity={0.06 + tone * 0.06} />
        <path
          d={`M0 ${-r} L${k} ${-k} L${r} 0 L${k} ${k} L0 ${r} L${-k} ${k} L${-r} 0 L${-k} ${-k} Z`}
          fill="#fff"
          opacity={0.35 + tone * 0.5}
        />
      </g>
    );
  }

  if (kind === "asteroid") {
    // A lumpy rock: a ring of points pushed in and out by the tone
    const points = Array.from({ length: 9 }, (_, i) => {
      const angle = (i / 9) * Math.PI * 2;
      const wobble = 0.72 + ((Math.sin(i * 12.9898 + tone * 78.233) * 43758.5453) % 1 + 1) % 1 * 0.35;
      return `${(Math.cos(angle) * r * wobble).toFixed(1)},${(Math.sin(angle) * r * wobble - r).toFixed(1)}`;
    });
    return (
      <g>
        <polygon points={points.join(" ")} fill={body} stroke={lit} strokeOpacity={0.5} strokeWidth={0.8} />
        <circle cx={r * 0.2} cy={-r * 1.1} r={r * 0.18} fill="#000" opacity={0.35} />
      </g>
    );
  }

  const pr = kind === "ringed" ? r * 0.62 : r;
  const planet = (
    <>
      <circle cx={0} cy={-r} r={pr + 3} fill="#fff" opacity={0.04} />
      <circle cx={0} cy={-r} r={pr} fill={body} />
      {/* Lit crescent on the top-left */}
      <circle cx={-pr * 0.25} cy={-r - pr * 0.25} r={pr * 0.78} fill={lit} opacity={0.35} />
      <path d={`M${-pr * 0.9} ${-r + pr * 0.2} Q0 ${-r + pr * 0.45} ${pr * 0.9} ${-r + pr * 0.2}`} stroke="#000" strokeOpacity={0.3} />
      <circle cx={0} cy={-r} r={pr} stroke="#fff" strokeOpacity={0.25} />
    </>
  );
  if (kind === "planet") return planet;

  return (
    <g>
      {/* Ring: the back half behind the planet, the front half over it */}
      <g transform={`rotate(-18 0 ${-r})`}>
        <path d={`M${-r * 1.1} ${-r} A${r * 1.1} ${r * 0.28} 0 0 1 ${r * 1.1} ${-r}`} stroke={lit} strokeOpacity={0.5} strokeWidth={1.4} />
      </g>
      {planet}
      <g transform={`rotate(-18 0 ${-r})`}>
        <path d={`M${-r * 1.1} ${-r} A${r * 1.1} ${r * 0.28} 0 0 0 ${r * 1.1} ${-r}`} stroke={lit} strokeOpacity={0.8} strokeWidth={1.4} />
      </g>
    </g>
  );
}

/** Thruster sparks: a small pool of glowing particles, recycled as they fade. */
const PUFFS = 36;
interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
}

export default function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const suspensionRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const hudFillRef = useRef<HTMLSpanElement>(null);
  const hudPctRef = useRef<HTMLSpanElement>(null);
  const puffRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [active, setActive] = useState(0);
  const [reached, setReached] = useState(0); // checkpoints the car has driven past
  const [revealed, setRevealed] = useState(0); // cards shown so far: each appears as the car nears it

  const road = useMemo(() => (geometry ? traceRoad(geometry) : null), [geometry]);
  const scenery = useMemo(() => (geometry ? plantScenery(geometry) : null), [geometry]);

  // The ticker reads the latest road shape from here (it changes only on resize).
  const shapeRef = useRef<{ g: Geometry; road: Road } | null>(null);
  useEffect(() => {
    shapeRef.current = geometry && road ? { g: geometry, road } : null;
  }, [geometry, road]);

  // Measure the stage; re-trace the road when it resizes.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => setGeometry(measure(box));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const box = boxRef.current;
    const car = carRef.current;
    const body = bodyRef.current;
    const suspension = suspensionRef.current;
    const trail = trailRef.current;
    const hint = hintRef.current;
    if (!box || !car || !body || !suspension || !trail || !hint) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // `pos` is the car's eased position along the road. Scroll sets the target;
    // quickTo glides toward it for the smooth, slightly weighted feel.
    const state = { pos: 0 };
    const glideTo = reduced
      ? (value: number) => {
          state.pos = value;
        }
      : gsap.quickTo(state, "pos", { duration: 0.9, ease: "power3.out" });

    // Progress = how much of the road has passed the car's line on screen.
    // The car rides the screen line where the road starts (just below the title), so it
    // sits at START on arrival and keeps that height as the page scrolls.
    const carLine = () => Math.round(box.getBoundingClientRect().top + window.scrollY);
    const trigger = ScrollTrigger.create({
      trigger: box,
      start: () => `top ${carLine()}px`,
      end: () => `bottom ${carLine()}px`,
      invalidateOnRefresh: true,
      onUpdate: (self) => glideTo(self.progress),
    });
    state.pos = trigger.progress;

    let lastAlong: number | null = null;
    let facing = 1; // 1 = driving down the road, -1 = back up
    let arrivedAt = -1;
    let lastActive = -1;
    let lastReached = -1;
    let lastRevealed = -1;
    const puffs: Puff[] = Array.from({ length: PUFFS }, () => ({ x: 0, y: 0, vx: 0, vy: 0, age: 1, life: 1, size: 1 }));
    let nextPuff = 0;
    let puffBudget = 0;

    const tick = (_time: number, deltaMs: number) => {
      const shape = shapeRef.current;
      if (!shape) return;
      const { g, road } = shape;
      const pos = state.pos;

      // Position on the curve, nose turned along it.
      const x = roadX(pos, g);
      const y = pos * g.height;
      const eps = 0.002;
      const slope = roadX(pos + eps, g) - roadX(pos - eps, g);
      const heading = (-Math.atan2(slope, 2 * eps * g.height) * 180) / Math.PI;
      car.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${heading}deg)`;

      // Travelled road: reveal the fill paths up to the car.
      const along = lengthAt(pos, road.lengths);
      const offset = String(road.total - along);
      if (washRef.current) washRef.current.style.strokeDashoffset = offset;
      if (lineRef.current) lineRef.current.style.strokeDashoffset = offset;
      const ds = lastAlong === null ? 0 : along - lastAlong; // px driven this frame
      lastAlong = along;

      // The engine flame stretches and a little blur shows speed.
      const speed = reduced ? 0 : Math.min(Math.abs(ds) / 10, 1);
      trail.style.opacity = String(0.45 + speed * 0.55);
      trail.style.transform = `translateX(-50%) scaleY(${0.35 + speed * 1.2})`;
      body.style.filter = speed > 0.08 ? `blur(${(speed * 0.9).toFixed(2)}px)` : "none";

      // Turn round to face the direction of travel.
      if (Math.abs(ds) > 0.6 && Math.sign(ds) !== facing) {
        facing = Math.sign(ds);
        gsap.to(body, {
          rotation: facing > 0 ? 0 : 180,
          duration: reduced ? 0 : 0.6,
          ease: "power2.inOut",
        });
      }

      // Thruster sparks from the engines: a steady idle stream, more when flying faster.
      if (!reduced) {
        const dt = Math.min(deltaMs, 50) / 1000;
        const rad = (heading * Math.PI) / 180;
        const noseX = -Math.sin(rad) * facing; // unit vector the car's nose points along
        const noseY = Math.cos(rad) * facing;
        puffBudget += dt * (14 + speed * 50);
        while (puffBudget >= 1) {
          puffBudget -= 1;
          const puff = puffs[nextPuff];
          nextPuff = (nextPuff + 1) % PUFFS;
          puff.x = x - noseX * 54 + (Math.random() - 0.5) * 6;
          puff.y = y - noseY * 54 + (Math.random() - 0.5) * 6;
          puff.vx = -noseX * (60 + speed * 120) + (Math.random() - 0.5) * 22;
          puff.vy = -noseY * (60 + speed * 120) + (Math.random() - 0.5) * 22;
          puff.age = 0;
          puff.life = 0.35 + Math.random() * 0.45;
          puff.size = 8 + Math.random() * 8;
        }
        puffs.forEach((puff, i) => {
          const el = puffRefs.current[i];
          if (!el) return;
          if (puff.age >= puff.life) {
            el.style.opacity = "0";
            return;
          }
          puff.age += dt;
          puff.x += puff.vx * dt;
          puff.y += puff.vy * dt;
          puff.vx *= 0.96;
          puff.vy *= 0.96;
          const k = Math.min(puff.age / puff.life, 1);
          const scale = 1 - k * 0.7;
          el.style.opacity = String((1 - k) * 0.95);
          el.style.transform = `translate3d(${puff.x}px, ${puff.y}px, 0) translate(-50%, -50%) scale(${scale})`;
          el.style.width = el.style.height = `${puff.size}px`;
        });
      }

      // A small thrust pulse on arriving at a waypoint.
      const at = STOPS.findIndex((stop) => Math.abs(stop - pos) < 0.006);
      if (at !== -1 && at !== arrivedAt) {
        arrivedAt = at;
        if (!reduced) {
          gsap.fromTo(
            suspension,
            { scaleY: 0.9, scaleX: 1.05, y: 2 },
            { scaleY: 1, scaleX: 1, y: 0, duration: 0.8, ease: "elastic.out(1, 0.35)", overwrite: true },
          );
        }
      } else if (arrivedAt !== -1 && Math.abs(STOPS[arrivedAt] - pos) > 0.03) {
        arrivedAt = -1;
      }

      const nearest = nearestStop(pos);
      if (nearest !== lastActive) {
        lastActive = nearest;
        setActive(nearest);
      }
      const passed = STOPS.filter((stop) => pos >= stop - 0.01).length;
      if (passed !== lastReached) {
        lastReached = passed;
        setReached(passed);
      }
      const shown = STOPS.filter((stop) => pos >= stop - 0.05).length;
      if (shown !== lastRevealed) {
        lastRevealed = shown;
        setRevealed(shown);
      }

      hint.style.opacity = String(Math.max(0, 1 - pos * 12));

      // Mission HUD: progress bar and percentage, shown once the flight has started.
      if (hudRef.current) hudRef.current.style.opacity = pos > 0.01 && pos < 0.995 ? "1" : "0";
      if (hudFillRef.current) hudFillRef.current.style.transform = `scaleY(${pos.toFixed(4)})`;
      if (hudPctRef.current) hudPctRef.current.textContent = `${String(Math.round(pos * 100)).padStart(3, "0")}%`;
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      trigger.kill();
      gsap.killTweensOf([body, suspension, state]);
    };
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="experience-heading" className="relative overflow-x-clip">
      {/* Title */}
      <div className="flex flex-col items-center pt-12 pb-12 text-center sm:pt-16">
        <p className="font-mono text-[11px] tracking-[0.4em] text-muted uppercase">Career Journey</p>
        <h1 id="experience-heading" className="mt-2 text-4xl font-semibold tracking-tight sm:text-6xl">
          Experience
        </h1>
        <p
          ref={hintRef}
          className="mt-4 font-mono text-[10px] tracking-[0.3em] text-muted uppercase"
          aria-hidden
        >
          Scroll to fly ↓
        </p>
      </div>

      <div>
        <div ref={boxRef} className="relative mx-auto max-w-6xl" style={{ height: `${ROAD_SVH}svh` }}>
          {/* Space either side of the flight path */}
          {geometry && scenery && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox={`0 0 ${geometry.width} ${geometry.height}`}
              aria-hidden
            >
              {/* Star dust */}
              <g fill="#fff">
                {scenery.tufts.map((tuft, i) => (
                  <circle
                    key={i}
                    cx={tuft.x.toFixed(1)}
                    cy={tuft.y.toFixed(1)}
                    r={(tuft.s * 1.1).toFixed(2)}
                    opacity={(0.15 + (i % 7) * 0.07).toFixed(2)}
                  />
                ))}
              </g>
              {scenery.trees.map((tree, i) => (
                <g key={i} transform={`translate(${tree.x.toFixed(1)} ${tree.y.toFixed(1)})`}>
                  <TreeShape tree={tree} />
                </g>
              ))}
            </svg>
          )}

          {/* Flight path */}
          {geometry && road && (
            <>
              <svg
                className="absolute inset-0 h-full w-full overflow-visible"
                viewBox={`0 0 ${geometry.width} ${geometry.height}`}
                fill="none"
                aria-hidden
              >
                {/* A faint corridor of light, then the travelled part: a wash plus a glowing line */}
                <path d={road.d} stroke="rgba(255,255,255,0.025)" strokeWidth={geometry.roadWidth} strokeLinecap="round" />
                <path
                  ref={washRef}
                  d={road.d}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={geometry.roadWidth}
                  strokeLinecap="round"
                  strokeDasharray={road.total}
                  strokeDashoffset={road.total}
                />
                {/* Plotted course ahead: a dotted line */}
                <path d={road.d} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeDasharray="1 9" strokeLinecap="round" />
                <path
                  ref={lineRef}
                  d={road.d}
                  stroke="#fafafa"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray={road.total}
                  strokeDashoffset={road.total}
                  style={{ filter: "drop-shadow(0 0 5px rgba(255,255,255,0.7))" }}
                />
              </svg>

              {/* Launch pad under the ship's starting point */}
              <span
                className="pointer-events-none absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 [background:repeating-radial-gradient(circle,transparent_0_10px,rgba(255,255,255,0.05)_10px_11px)]"
                style={{ left: roadX(0, geometry), top: 0 }}
                aria-hidden
              />
              <span
                className="absolute -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] text-muted/70"
                style={{ left: Math.max(28, roadX(0, geometry)), top: -30 }}
              >
                LAUNCH
              </span>
              <span
                className="absolute -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] text-muted/70"
                style={{ left: Math.max(28, roadX(1, geometry)), top: geometry.height + 16 }}
              >
                ARRIVAL
              </span>

              {/* Checkpoints */}
              {STOPS.map((stop, i) => (
                <span
                  key={stop}
                  className={cn(
                    "absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-dashed bg-background transition-colors duration-500",
                    i < reached ? "border-foreground" : "border-white/30",
                  )}
                  style={{ left: roadX(stop, geometry), top: stop * geometry.height }}
                  aria-hidden
                >
                  <span
                    className={cn(
                      "absolute top-1/2 hidden -translate-y-1/2 font-mono text-[10px] tracking-[0.25em] whitespace-nowrap transition-colors duration-500 md:block",
                      i % 2 === 0 ? "left-9" : "right-9",
                      i < reached ? "text-foreground/80" : "text-muted/50",
                    )}
                  >
                    WP-{String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition-all duration-500",
                      i < reached ? "bg-foreground shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "bg-white/20",
                    )}
                  />
                </span>
              ))}
            </>
          )}

          {/* Thruster sparks, positioned by the ticker */}
          <div className="pointer-events-none absolute inset-0 z-[15]" aria-hidden>
            {Array.from({ length: PUFFS }, (_, i) => (
              <span
                key={i}
                ref={(el) => {
                  puffRefs.current[i] = el;
                }}
                className="absolute top-0 left-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,1),rgba(255,255,255,0)_70%)] opacity-0 will-change-transform"
              />
            ))}
          </div>

          {/* Ship: positioned and turned along the path by the ticker */}
          <div ref={carRef} className="absolute top-0 left-0 z-20 will-change-transform" aria-hidden>
            <div ref={bodyRef}>
              <Ship trailRef={trailRef} suspensionRef={suspensionRef} />
            </div>
          </div>

          {/* Checkpoint cards */}
          {experience.map((job, i) => {
            const isActive = i === active;
            const onLeft = i % 2 === 0;
            return (
              <div
                key={`${job.company}-${job.role}`}
                className={cn(
                  "absolute right-4 left-[88px] transition-opacity duration-500",
                  "-translate-y-10",
                  // Nothing shows at the START; each card appears as the car approaches it.
                  i >= revealed && "pointer-events-none opacity-0",
                )}
                style={{ top: `${STOPS[i] * 100}%`, ...(geometry?.desktop ? besideRoad(i, geometry) : {}) }}
              >
                {/* Connector to the road */}
                <span
                  className={cn(
                    "absolute h-px w-[22px] -left-[22px] transition-colors duration-500 md:w-7",
                    "top-10",
                    onLeft ? "md:left-auto md:-right-7" : "md:-left-7",
                    isActive ? "bg-white/60" : i < active ? "bg-white/15" : "bg-transparent",
                  )}
                  aria-hidden
                />
                <article
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "rounded-2xl border p-3.5 backdrop-blur-xl transition-all duration-500 ease-out sm:p-5",
                    onLeft ? "origin-left md:origin-right" : "origin-left",
                    isActive
                      ? "scale-[1.03] border-white/30 bg-white/[0.07] shadow-[0_0_60px_-12px_rgba(255,255,255,0.18)]"
                      : i < active
                        ? "border-white/10 bg-white/[0.03] opacity-55"
                        : // Not reached yet: hidden until the car gets close.
                          "pointer-events-none translate-y-8 border-white/10 bg-white/[0.02] opacity-0",
                  )}
                >
                  <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
                    {String(i + 1).padStart(2, "0")} · {job.date}
                    {job.location && ` · ${job.location}`}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground sm:text-2xl">
                    {job.role}
                  </h2>
                  <p className="text-sm text-muted sm:text-base">{job.company}</p>

                  {/* Details reveal on the active card */}
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-500 ease-out",
                      isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="mt-3 text-sm leading-relaxed text-muted">{job.description}</p>
                      {job.highlights && (
                        <ul className="mt-3 space-y-1.5 text-[13px] leading-snug text-muted sm:text-sm">
                          {job.highlights.map((highlight) => (
                            <li key={highlight} className="flex gap-2.5">
                              <span className="mt-[0.5em] h-1 w-1 shrink-0 rounded-full bg-foreground/70" aria-hidden />
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      )}
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {job.skills.map((skill) => (
                          <li
                            key={skill}
                            className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[11px] text-muted"
                          >
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        {/* Arrival: the destination planet and where the journey goes next */}
        <div className="relative flex min-h-[70svh] flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 [background:radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.14),rgba(255,255,255,0.02)_45%,transparent_70%)] shadow-[0_0_120px_-30px_rgba(255,255,255,0.35)]"
            aria-hidden
          >
            <span className="absolute inset-[-40px] rounded-full border border-dashed border-white/10" />
          </div>
          <p className="relative font-mono text-[11px] tracking-[0.4em] text-muted uppercase">
            Destination · {String(COUNT).padStart(2, "0")} waypoints logged
          </p>
          <h2 className="relative mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            The journey continues.
          </h2>
          <p className="relative mt-4 max-w-md text-muted">
            Next stop could be your team. Let&apos;s talk about what we can build together.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-4">
            <FlowButton href="/contact" text="Get in touch" />
            <FlowButton href={siteConfig.resume} text="Resume" external />
          </div>
        </div>
      </div>

      {/* Mission HUD (desktop): progress through the flight, fixed at the right edge */}
      <div
        ref={hudRef}
        className="pointer-events-none fixed top-1/2 right-6 z-30 hidden -translate-y-1/2 items-center gap-3 font-mono text-[10px] tracking-[0.25em] text-muted opacity-0 transition-opacity duration-500 lg:flex"
        aria-hidden
      >
        <div className="flex flex-col items-end gap-1 text-right">
          <span>MISSION</span>
          <span ref={hudPctRef} className="text-base tracking-normal text-foreground">000%</span>
          <span>WP {String(Math.min(reached + 1, COUNT)).padStart(2, "0")}/{String(COUNT).padStart(2, "0")}</span>
        </div>
        <div className="relative h-56 w-px bg-white/15">
          <span ref={hudFillRef} className="absolute inset-0 origin-top scale-y-0 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          {STOPS.map((stop, i) => (
            <span
              key={stop}
              className={cn(
                "absolute left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-500",
                i < reached ? "border-white bg-white" : "border-white/40 bg-black",
              )}
              style={{ top: `${stop * 100}%` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Desktop card placement: 64px beside the checkpoint, on the side the road bends toward. */
function besideRoad(i: number, g: Geometry): React.CSSProperties {
  const x = roadX(STOPS[i], g);
  const gap = 64;
  const margin = 16;
  return i % 2 === 0
    ? { left: "auto", right: g.width - x + gap, width: Math.min(420, x - gap - margin) }
    : { left: x + gap, right: "auto", width: Math.min(420, g.width - x - gap - margin) };
}

/** Top-down monochrome spaceship, nose pointing down the page, engine flame behind. */
function Ship({
  trailRef,
  suspensionRef,
}: {
  trailRef: React.RefObject<HTMLDivElement | null>;
  suspensionRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="relative">
      {/* Engine flame behind the ship (stretched with speed by the ticker) */}
      <div
        ref={trailRef}
        className="absolute bottom-[calc(100%-14px)] left-1/2 h-32 w-6 origin-bottom rounded-full bg-gradient-to-t from-white via-white/50 to-transparent opacity-50 blur-[2px]"
      />
      {/* Scanner beam ahead */}
      <div className="absolute top-[calc(100%-8px)] left-1/2 h-40 w-36 -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.16),transparent_70%)] [clip-path:polygon(42%_0,58%_0,100%_100%,0_100%)]" />

      <div ref={suspensionRef} className="relative h-[104px] w-[82px] drop-shadow-[0_0_14px_rgba(255,255,255,0.25)]">
        <svg viewBox="0 0 54 68" className="h-full w-full">
          <defs>
            <linearGradient id="ship-hull" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8a8a8a" />
              <stop offset="50%" stopColor="#f5f5f5" />
              <stop offset="100%" stopColor="#8a8a8a" />
            </linearGradient>
          </defs>
          {/* Wings */}
          <path d="M27 16 L52 40 L50 46 L33 40 Z" fill="#6b6b6b" stroke="#d4d4d4" strokeWidth={0.8} />
          <path d="M27 16 L2 40 L4 46 L21 40 Z" fill="#6b6b6b" stroke="#d4d4d4" strokeWidth={0.8} />
          {/* Engines (at the back, the top of the page) */}
          <rect x={18} y={2} width={6} height={10} rx={2} fill="#404040" stroke="#d4d4d4" strokeWidth={0.6} />
          <rect x={30} y={2} width={6} height={10} rx={2} fill="#404040" stroke="#d4d4d4" strokeWidth={0.6} />
          <rect x={19} y={1} width={4} height={2} rx={1} fill="#fff" />
          <rect x={31} y={1} width={4} height={2} rx={1} fill="#fff" />
          {/* Hull, pointed nose at the bottom */}
          <path d="M27 66 C35 52 36 30 34 10 L20 10 C18 30 19 52 27 66 Z" fill="url(#ship-hull)" stroke="#fff" strokeOpacity={0.8} strokeWidth={0.8} />
          {/* Cockpit */}
          <path d="M27 54 C31 48 31 40 30 36 L24 36 C23 40 23 48 27 54 Z" fill="#111" />
          <path d="M26 50 C25 46 25 42 25.5 39" stroke="#fff" strokeOpacity={0.5} strokeWidth={0.8} fill="none" />
          {/* Hull seam and wing-tip lights */}
          <line x1={27} y1={12} x2={27} y2={34} stroke="#000" strokeOpacity={0.25} />
          <circle cx={51} cy={43} r={1.4} fill="#fff" />
          <circle cx={3} cy={43} r={1.4} fill="#fff" />
        </svg>
      </div>
    </div>
  );
}
