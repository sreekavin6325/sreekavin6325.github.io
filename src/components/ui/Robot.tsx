"use client";

import type { Application } from "@splinetool/runtime";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// The Spline runtime is large, so load it only in the browser, after the page renders.
const Spline = lazy(() => import("@splinetool/react-spline"));

// Interactive 3D robot (hosted on Spline) whose head follows the cursor.
const SCENE_URL = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

interface RobotProps {
  className?: string;
  /** Receives the loaded scene, e.g. to pose the robot (see robot-puppet.ts). */
  onLoad?: (app: Application) => void;
  /** Mount the scene straight away instead of waiting for it to near the viewport. */
  eager?: boolean;
}

function Loader() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground"
        aria-label="Loading robot"
      />
    </div>
  );
}

export default function Robot({ className, onLoad, eager = false }: RobotProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [mounted, setMounted] = useState(eager);
  const [loaded, setLoaded] = useState(false);

  // Every robot on the page is its own WebGL scene, and each one keeps drawing even when it
  // has scrolled away - which is what makes slower devices crawl. So: don't download/start a
  // scene until it comes within a screen of the viewport, and pause its render loop (and
  // input handling) whenever it leaves again.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true);
        const app = appRef.current;
        if (!app) return;
        if (entry.isIntersecting) app.play();
        else app.stop();
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    // data-robot / data-loaded let the site LoadingScreen wait for the scene before finishing.
    <div
      ref={hostRef}
      className={cn(className)}
      role="img"
      aria-label="A 3D robot that follows your cursor"
      data-robot
      data-loaded={loaded}
    >
      {mounted && (
        <Suspense fallback={<Loader />}>
          <Spline
            scene={SCENE_URL}
            className="h-full w-full"
            onLoad={(app) => {
              appRef.current = app;
              setLoaded(true);
              onLoad?.(app);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
