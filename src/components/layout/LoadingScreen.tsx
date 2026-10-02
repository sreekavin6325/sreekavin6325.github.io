"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FlowButton } from "@/components/ui/flow-button";
import { cn } from "@/lib/utils";

const HINTS: Array<[number, string]> = [
  [0, "Preparing assets"],
  [30, "Fetching data"],
  [60, "Building interface"],
  [90, "Almost there"],
];

// Never keep visitors waiting longer than this, even if something fails to load.
const MAX_WAIT_MS = 10_000;

/** The page is ready once the window has loaded and any 3D robot on it has finished loading. */
function isPageReady() {
  if (document.readyState !== "complete") return false;
  const robot = document.querySelector("[data-robot]");
  return !robot || robot.getAttribute("data-loaded") === "true";
}

type Phase = "loading" | "done" | "leaving" | "gone";

/**
 * Full-screen loader shown on the first page load only (the root layout persists across
 * client-side navigation). Styles live in globals.css under `.site-loader`.
 * When loading finishes it waits for an "Enter" click: browsers only allow sound after a
 * user gesture, so that click is what lets the background music (ui/music-toggle) start
 * the moment the loader closes.
 */
export default function LoadingScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");

  // Reloading any page starts the visitor back on the home page (hidden behind the loader).
  // Direct visits to a shared link are left alone.
  useEffect(() => {
    const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (navigation?.type === "reload" && window.location.pathname !== "/") {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    const start = performance.now();
    let value = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const ready = isPageReady() || performance.now() - start > MAX_WAIT_MS;
      // Creep toward 90% while loading, then finish quickly once the page is ready.
      value = ready
        ? Math.min(100, value + 10 + Math.random() * 10)
        : Math.min(90, value + 2 + Math.random() * 6);
      setProgress(value);

      if (value < 100) {
        timeout = setTimeout(tick, 80 + Math.random() * 80);
        return;
      }
      setPhase("done");
    };

    tick();
    return () => clearTimeout(timeout);
  }, []);

  // Leaving: fade out, then unmount.
  useEffect(() => {
    if (phase !== "leaving") return;
    const timeout = setTimeout(() => setPhase("gone"), 500);
    return () => clearTimeout(timeout);
  }, [phase]);

  if (phase === "gone") return null;

  const percent = Math.round(progress);
  const done = phase !== "loading";
  const hint = done ? "Welcome" : HINTS.filter(([threshold]) => percent >= threshold).pop()![1];

  return (
    <div
      id="site-loader"
      className={cn("site-loader", done && "is-done", phase === "leaving" && "is-leaving")}
    >
      <div className="site-loader__inner">
        <div className="site-loader__mark" aria-hidden>
          <span />
          <span />
          <span />
        </div>

        <div className="site-loader__meta" aria-hidden>
          <span className="site-loader__label">{done ? "Ready" : "Loading"}</span>
          <span className="site-loader__pct">{percent}%</span>
        </div>

        <div
          className="site-loader__bar"
          role="progressbar"
          aria-label="Loading site"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className="site-loader__fill" style={{ width: `${percent}%` }} />
        </div>

        <p className="site-loader__hint" role="status" aria-live="polite">
          {hint}
        </p>

        {/* Enter: the click also starts the music (see the note above) */}
        <div inert={!done} className={cn("transition-opacity duration-500", done ? "opacity-100" : "pointer-events-none opacity-0")}>
          <FlowButton text="Enter" onClick={() => setPhase("leaving")} />
        </div>
      </div>
    </div>
  );
}
