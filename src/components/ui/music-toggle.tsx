"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Background music (public/audio/vynto.m4a), looping at low volume. Browsers block sound
// until the visitor interacts, so playback starts on the first click/key/touch unless they
// muted it. The choice is remembered. Lives in the Header, so it keeps playing across pages.

const SRC = "/audio/vynto.m4a";
const VOLUME = 0.1;
const STORAGE_KEY = "music-muted";

export function MusicToggle({ className }: { className?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = VOLUME;

    let stored = false;
    try {
      stored = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {}
    setMuted(stored);
    if (stored) return;

    const start = () => {
      audio.play().then(
        () => removeListeners(),
        () => {}, // still blocked; wait for the next interaction
      );
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    const removeListeners = () => events.forEach((e) => window.removeEventListener(e, start));
    events.forEach((e) => window.addEventListener(e, start));
    start(); // works straight away if the browser allows autoplay
    return removeListeners;
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {}
    if (next) audio.pause();
    else audio.play().catch(() => {});
  };

  const on = playing && !muted;

  return (
    <>
      <audio
        ref={audioRef}
        src={SRC}
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={muted ? "Play music" : "Mute music"}
        aria-pressed={!muted}
        title={muted ? "Play music" : "Mute music"}
        className={cn(
          "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-foreground/40 text-foreground transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:rounded-[12px] hover:border-transparent hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.95]",
          className,
        )}
      >
        {/* Equaliser bars: bounce while playing, flat with a slash when muted */}
        <span className="relative flex h-3.5 items-end gap-[3px]" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn("w-[2px] origin-bottom rounded-full bg-current", on ? "animate-eq" : "h-[3px]")}
              style={on ? { animationDelay: `${i * 0.15}s`, height: "100%" } : undefined}
            />
          ))}
          {muted && <span className="absolute top-1/2 left-1/2 h-[1.5px] w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current" />}
        </span>
      </button>
    </>
  );
}
