"use client";

import { useEffect, useState } from "react";

/** Types each word, pauses, deletes it, then moves to the next (a typewriter loop). */
export function RotatingRole({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index];
    if (!deleting && length === word.length) {
      const pause = setTimeout(() => setDeleting(true), 1800);
      return () => clearTimeout(pause);
    }
    if (deleting && length === 0) {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
      return;
    }
    const tick = setTimeout(() => setLength((n) => n + (deleting ? -1 : 1)), deleting ? 40 : 85);
    return () => clearTimeout(tick);
  }, [words, index, length, deleting]);

  return (
    <span aria-label={words.join(", ")}>
      <span aria-hidden>{words[index].slice(0, length)}</span>
      <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-blink bg-foreground/70" aria-hidden />
    </span>
  );
}
