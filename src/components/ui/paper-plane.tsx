"use client";

// The contact form's send animation. The button label folds away into a paper plane,
// which loops across the whole screen along one smooth curve (drawing a faint trail)
// and glides onto the form card, where it hovers until the message is saved. Then:
//   - success: the parent shows the "Message sent" panel and passes `target` - the
//     centre of its (still empty) tick circle. The plane flies into that circle, turns
//     upright and shrinks away while a ✓ draws itself in the same spot. `onDone` fires
//     as the tick completes, so the panel can swap in its own identical tick.
//   - failure: the plane drops out of sight, then `onDone` fires.
//
// The plane rides a CSS motion path (offset-path) so it banks into every turn by itself
// (offset-rotate: auto); framer-motion animates how far along the path it is.

import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface Point {
  x: number;
  y: number;
}

interface PaperPlaneProps {
  /** Where the flight starts (the send button), in viewport coordinates. */
  from: Point;
  /** Roughly where the plane lands (the form card), in viewport coordinates. */
  to: Point;
  /** The button text that folds into the plane. */
  label: string;
  /** Unknown until the message is saved; the plane hovers at the landing point meanwhile. */
  outcome: "success" | "failure" | null;
  /** Centre of the tick circle to turn into (success only; set once that circle is on screen). */
  target: Point | null;
  /** Called when the plane has landed and the save succeeded: time to show the tick circle. */
  onLandedSuccess: () => void;
  /** Called when the animation is finished (tick drawn, or plane gone after a failure). */
  onDone: () => void;
}

const FOLD = 0.35; // seconds: label → plane
const FLIGHT = 3; // seconds along the path
const FLIGHT_EASE = [0.4, 0, 0.2, 1] as const;

const clampTo = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * One smooth loop round the viewport from `from` to `to`, as an SVG path. Uses centripetal
 * Catmull-Rom splines (converted to cubic Béziers), which never form cusps or kinks, so
 * the curve - and the plane's heading along it - stays smooth everywhere.
 */
function flightPath(from: Point, to: Point) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const at = (fx: number, fy: number): Point => ({
    x: clampTo(fx * w, 60, w - 60),
    y: clampTo(fy * h, 100, h - 60),
  });

  // A wide counter-clockwise loop, with evenly spaced stops and gentle turns.
  const points: Point[] = [
    from,
    at(0.58, 0.42), // lift off up and to the left
    at(0.34, 0.16), // over the top, past the robot's head
    at(0.1, 0.42), // round the top-left corner
    at(0.2, 0.8), // down the left side
    at(0.52, 0.88), // along the bottom
    at(0.86, 0.62), // up the right side
    at(0.84, 0.24), // over the top-right
    to, // glide down onto the card
  ];

  // Virtual end points so the first and last segments have a tangent to follow.
  const first = { x: 2 * points[0].x - points[1].x, y: 2 * points[0].y - points[1].y };
  const n = points.length;
  const last = { x: 2 * points[n - 1].x - points[n - 2].x, y: 2 * points[n - 1].y - points[n - 2].y };
  const all = [first, ...points, last];

  const fmt = (p: Point) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  let d = `M ${fmt(points[0])}`;
  let endControl = points[n - 2];
  for (let i = 1; i < all.length - 2; i++) {
    const [p0, p1, p2, p3] = [all[i - 1], all[i], all[i + 1], all[i + 2]];
    const d1 = Math.max(Math.sqrt(dist(p0, p1)), 1e-3);
    const d2 = Math.max(Math.sqrt(dist(p1, p2)), 1e-3);
    const d3 = Math.max(Math.sqrt(dist(p2, p3)), 1e-3);
    const c1 = {
      x: (d1 * d1 * p2.x - d2 * d2 * p0.x + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1.x) / (3 * d1 * (d1 + d2)),
      y: (d1 * d1 * p2.y - d2 * d2 * p0.y + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1.y) / (3 * d1 * (d1 + d2)),
    };
    const c2 = {
      x: (d3 * d3 * p1.x - d2 * d2 * p3.x + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2.x) / (3 * d3 * (d3 + d2)),
      y: (d3 * d3 * p1.y - d2 * d2 * p3.y + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2.y) / (3 * d3 * (d3 + d2)),
    };
    d += ` C ${fmt(c1)}, ${fmt(c2)}, ${fmt(p2)}`;
    endControl = c2;
  }

  // The plane's heading as it arrives (degrees), so the final move can pick up from it.
  const arrival = sub(to, endControl);
  const endAngle = (Math.atan2(arrival.y, arrival.x) * 180) / Math.PI;
  return { d, endAngle };
}

/** The plane glyph, nose pointing along +x (lucide's Send points up-right). */
function Plane() {
  return (
    <Send size={30} strokeWidth={1.6} className="rotate-45 text-foreground drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]" />
  );
}

export function PaperPlaneFlight({ from, to, label, outcome, target, onLandedSuccess, onDone }: PaperPlaneProps) {
  const { d: path, endAngle } = useMemo(() => flightPath(from, to), [from, to]);
  const [landed, setLanded] = useState(false);
  const [reportedLanding, setReportedLanding] = useState(false);

  const failed = landed && outcome === "failure";
  const morphing = landed && outcome === "success" && target !== null;

  // Landed and saved: let the parent show the tick circle; it answers by setting `target`.
  useEffect(() => {
    if (landed && outcome === "success" && !reportedLanding) {
      setReportedLanding(true);
      onLandedSuccess();
    }
  }, [landed, outcome, reportedLanding, onLandedSuccess]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      {/* Faint trail, drawn in step with the flight */}
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        <motion.path
          d={path}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 1 }}
          animate={{ pathLength: 1, opacity: landed ? 0 : 1 }}
          transition={{
            pathLength: { delay: FOLD * 0.7, duration: FLIGHT, ease: FLIGHT_EASE },
            opacity: { duration: 0.8 },
          }}
        />
      </svg>

      {/* The button label folding away */}
      <motion.span
        className="absolute -translate-x-1/2 -translate-y-1/2 text-sm font-semibold whitespace-nowrap text-foreground"
        style={{ left: from.x, top: from.y }}
        initial={{ opacity: 1, scaleX: 1, scaleY: 1, filter: "blur(0px)" }}
        animate={{ opacity: 0, scaleX: 0.15, scaleY: 0.6, filter: "blur(3px)" }}
        transition={{ duration: FOLD, ease: "easeIn" }}
      >
        {label}
      </motion.span>

      {/* The plane, riding the path (until it turns into the tick, or drops out) */}
      <AnimatePresence onExitComplete={failed ? onDone : undefined}>
        {!failed && !morphing && (
          <motion.div
            key="plane"
            className="absolute top-0 left-0"
            style={{ offsetPath: `path("${path}")`, offsetRotate: "auto" }}
            initial={{ offsetDistance: "0%", opacity: 0, scale: 0.3 }}
            animate={{ offsetDistance: "100%", opacity: 1, scale: 1 }}
            exit={failed ? { opacity: 0, y: 30, transition: { duration: 0.4 } } : { opacity: 0, transition: { duration: 0 } }}
            transition={{
              offsetDistance: { delay: FOLD * 0.7, duration: FLIGHT, ease: FLIGHT_EASE },
              opacity: { duration: FOLD },
              scale: { duration: FOLD },
            }}
            onAnimationComplete={() => setLanded(true)}
          >
            {/* Waiting for the save to finish: hover gently where it landed */}
            <motion.span
              className="block"
              animate={landed ? { y: [0, -6, 0] } : { y: 0 }}
              transition={landed ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
            >
              <Plane />
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success: the plane flies into the tick circle, straightens up and becomes the ✓ */}
      {morphing && target && (
        <>
          <motion.div
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
            initial={{ x: to.x, y: to.y, rotate: endAngle, scale: 1, opacity: 1 }}
            animate={{ x: target.x, y: target.y, rotate: -90, scale: 0.35, opacity: 0 }}
            transition={{
              x: { duration: 0.55, ease: [0.3, 0, 0.2, 1] },
              y: { duration: 0.55, ease: [0.3, 0, 0.2, 1] },
              rotate: { duration: 0.55, ease: "easeInOut" },
              scale: { delay: 0.3, duration: 0.35, ease: "easeIn" },
              opacity: { delay: 0.4, duration: 0.25 },
            }}
          >
            <span className="block">
              <Plane />
            </span>
          </motion.div>

          <motion.svg
            viewBox="0 0 24 24"
            width={22}
            height={22}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute text-foreground"
            style={{ left: target.x - 11, top: target.y - 11 }}
          >
            <motion.path
              d="M20 6 9 17l-5-5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.45, ease: "easeOut" }}
              onAnimationComplete={onDone}
            />
          </motion.svg>
        </>
      )}
    </div>
  );
}
