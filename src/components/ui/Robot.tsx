"use client";

import type { Application } from "@splinetool/runtime";
import { lazy, Suspense, useState } from "react";
import { cn } from "@/lib/utils";

// The Spline runtime is large, so load it only in the browser, after the page renders.
const Spline = lazy(() => import("@splinetool/react-spline"));

// Interactive 3D robot (hosted on Spline) whose head follows the cursor.
const SCENE_URL = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

interface RobotProps {
  className?: string;
  /** Receives the loaded scene, e.g. to pose the robot (see robot-puppet.ts). */
  onLoad?: (app: Application) => void;
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

export default function Robot({ className, onLoad }: RobotProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    // data-robot / data-loaded let the site LoadingScreen wait for the scene before finishing.
    <div
      className={cn(className)}
      role="img"
      aria-label="A 3D robot that follows your cursor"
      data-robot
      data-loaded={loaded}
    >
      <Suspense fallback={<Loader />}>
        <Spline
          scene={SCENE_URL}
          className="h-full w-full"
          onLoad={(app) => {
            setLoaded(true);
            onLoad?.(app);
          }}
        />
      </Suspense>
    </div>
  );
}
