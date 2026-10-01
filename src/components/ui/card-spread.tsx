"use client";

// A hand of cards dealt left to right. One card is "picked up": it leaves the
// shared baseline and scale of its neighbours - lifted upward, toward the viewer,
// larger, straighter, with a deeper shadow - and the cards beside it part slightly
// to make room. Hovering raises a card a little; the whole hand and each card
// tilt in 3D with the cursor. All motion is spring-driven (framer-motion).

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface CardSpreadItem {
  id: string;
  title: string;
  image: string;
  /** Small caption in the card's top-right corner, e.g. a year. */
  meta?: string;
}

interface CardSpreadProps {
  items: CardSpreadItem[];
  focusedIndex: number;
  onFocusChange: (index: number) => void;
  /** Called when the already-focused card is clicked (or Enter is pressed on it). */
  onOpen?: (index: number) => void;
  className?: string;
}

/* Geometry, in px at scale 1. The spread is scaled down as a whole on small stages. */
const CARD_W = 210;
const CARD_H = 300;
const SPACING = 150; // horizontal distance between neighbouring cards (so they overlap)
const FAN = 7; // degrees of rotation per card away from the centre
const ARC = 14; // how far the outer cards drop, per card squared
const PART = 26; // how far the focused card's neighbours move aside
const LIFT = 86; // how far the focused card rises above the hand's baseline
const FOCUS_SCALE = 1.24;
const HOVER_LIFT = 18;
const HOVER_SCALE = 1.04;

const SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;
const TILT_SPRING = { stiffness: 180, damping: 18 };

const SHADOW_REST = "0 18px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4)";
const SHADOW_HOVER = "0 26px 56px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.45)";
const SHADOW_FOCUS = "0 50px 100px rgba(0,0,0,0.75), 0 15px 35px rgba(0,0,0,0.45)";

function layoutFor(index: number, count: number, focused: number, hovered: number | null) {
  const k = index - (count - 1) / 2; // position from the centre of the hand
  const fromFocus = index - focused;
  const isFocused = fromFocus === 0;
  const isHovered = !isFocused && hovered === index;

  return {
    x: k * SPACING + (isFocused ? 0 : Math.sign(fromFocus) * PART),
    y: k * k * ARC - (isFocused ? LIFT : isHovered ? HOVER_LIFT : 0),
    z: isFocused ? 90 : isHovered ? 20 : 0,
    // A picked-up card straightens in the hand.
    rotate: k * FAN * (isFocused ? 0.35 : 1),
    scale: isFocused ? FOCUS_SCALE : isHovered ? HOVER_SCALE : 1,
    boxShadow: isFocused ? SHADOW_FOCUS : isHovered ? SHADOW_HOVER : SHADOW_REST,
    filter: isFocused
      ? "grayscale(0) brightness(1)"
      : isHovered
        ? "grayscale(0.6) brightness(0.85)"
        : "grayscale(1) brightness(0.62)",
  };
}

export function CardSpread({ items, focusedIndex, onFocusChange, onOpen, className }: CardSpreadProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const stageRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [fit, setFit] = useState(1);
  const count = items.length;

  // Scale the whole spread to fit the stage.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const neededW = (count - 1) * SPACING + 2 * PART + CARD_W * FOCUS_SCALE + 80;
    const neededH = CARD_H * FOCUS_SCALE + LIFT + ARC * ((count - 1) / 2) ** 2 + 60;
    const read = () =>
      setFit(Math.min(1, stage.clientWidth / neededW, stage.clientHeight / neededH));
    read();
    const observer = new ResizeObserver(read);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [count]);

  // The whole hand leans slightly with the cursor.
  const handX = useMotionValue(0);
  const handY = useMotionValue(0);
  const handRotateY = useSpring(handX, TILT_SPRING);
  const handRotateX = useSpring(handY, TILT_SPRING);
  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (event: globalThis.PointerEvent) => {
      handX.set((event.clientX / window.innerWidth - 0.5) * 6);
      handY.set((event.clientY / window.innerHeight - 0.5) * -4);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [handX, handY, reduceMotion]);

  const select = (index: number) => {
    if (index === focusedIndex) onOpen?.(index);
    else onFocusChange(index);
  };

  return (
    <div
      ref={stageRef}
      className={cn("flex items-center justify-center [perspective:1200px]", className)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") onFocusChange(Math.min(focusedIndex + 1, count - 1));
        else if (event.key === "ArrowLeft") onFocusChange(Math.max(focusedIndex - 1, 0));
        else return;
        event.preventDefault();
      }}
    >
      <motion.div
        className="relative [transform-style:preserve-3d]"
        style={{
          width: 1,
          height: 1,
          scale: fit,
          rotateX: handRotateX,
          rotateY: handRotateY,
          // Visual centre sits a little below the middle so the lifted card has headroom.
          y: LIFT * 0.7 * fit,
        }}
      >
        {items.map((item, index) => (
          <Card
            key={item.id}
            item={item}
            index={index}
            layout={layoutFor(index, count, focusedIndex, hovered)}
            focused={index === focusedIndex}
            zIndex={index === focusedIndex ? 100 : hovered === index ? 50 : index + 1}
            reduceMotion={reduceMotion}
            onHover={(on) => setHovered((current) => (on ? index : current === index ? null : current))}
            onSelect={() => select(index)}
          />
        ))}
      </motion.div>
    </div>
  );
}

interface CardProps {
  item: CardSpreadItem;
  index: number;
  layout: ReturnType<typeof layoutFor>;
  focused: boolean;
  zIndex: number;
  reduceMotion: boolean;
  onHover: (on: boolean) => void;
  onSelect: () => void;
}

function Card({ item, index, layout, focused, zIndex, reduceMotion, onHover, onSelect }: CardProps) {
  // Per-card tilt toward the cursor.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, TILT_SPRING) as MotionValue<number>;
  const rotateY = useSpring(tiltY, TILT_SPRING) as MotionValue<number>;

  const handleMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    tiltY.set(nx * 12);
    tiltX.set(ny * -10);
  };

  const handleLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
    onHover(false);
  };

  return (
    <motion.button
      type="button"
      aria-label={focused ? `${item.title} (selected) — open project` : `Select ${item.title}`}
      aria-current={focused ? "true" : undefined}
      className="group absolute cursor-pointer overflow-hidden rounded-[20px] border border-white/15 bg-surface-2 text-left outline-none select-none focus-visible:ring-2 focus-visible:ring-foreground"
      style={{
        left: -CARD_W / 2,
        top: -CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        zIndex,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      initial={false}
      animate={layout}
      transition={reduceMotion ? { duration: 0 } : { ...SPRING, boxShadow: { duration: 0.4 }, filter: { duration: 0.4 } }}
      onPointerEnter={() => onHover(true)}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onClick={onSelect}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- remote cover, sized by the card */}
      <img src={item.image} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />

      {/* Legibility gradient and a soft top-left sheen. */}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" aria-hidden />
      <span
        className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.18),transparent_40%)]"
        aria-hidden
      />

      <span className="absolute top-4 left-5 text-4xl font-bold tracking-tight text-white">
        {String(index + 1).padStart(2, "0")}
      </span>
      {item.meta && (
        <span className="absolute top-5 right-5 font-mono text-xs text-white/60">{item.meta}</span>
      )}
      <span className="absolute right-5 bottom-5 left-5 text-xs font-medium tracking-[0.18em] text-white/80 uppercase">
        {item.title}
      </span>
    </motion.button>
  );
}

export default CardSpread;
