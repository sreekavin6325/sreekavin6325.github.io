"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CardSpread, type CardSpreadItem } from "@/components/ui/card-spread";
import { FlowButton } from "@/components/ui/flow-button";
import { projects } from "@/data/projects";

// Used for any project that doesn't have a cover image yet.
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80&auto=format&fit=crop";

const cards: CardSpreadItem[] = projects.map((project) => ({
  id: project.slug,
  title: project.title,
  image: project.image ?? FALLBACK_IMAGE,
  meta: project.year ? String(project.year) : undefined,
}));

/** The projects index: a hand of cards with the selected project lifted out of it. */
export default function Projects() {
  const router = useRouter();
  const [focused, setFocused] = useState(Math.floor(projects.length / 2));
  const project = projects[focused];
  const open = (index: number) => router.push(`/projects/${projects[index].slug}`);

  return (
    <section className="relative flex flex-1 flex-col">
      <h1 className="sr-only">Projects</h1>

      {/* Absolutely positioned so the spread measures a definite stage size. */}
      <div className="relative min-h-[360px] flex-1">
        <CardSpread
          items={cards}
          focusedIndex={focused}
          onFocusChange={setFocused}
          onOpen={open}
          className="absolute inset-0"
        />
      </div>

      <div className="container-page flex min-h-[150px] flex-col items-center pb-8 text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={project.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-3"
          >
            <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
              {project.tags.join("  ·  ")}
            </p>
            <p className="max-w-md text-sm text-muted">{project.summary}</p>
            <FlowButton href={`/projects/${project.slug}`} text="View project" />
          </motion.div>
        </AnimatePresence>
        <p className="mt-4 hidden font-mono text-[11px] tracking-[0.18em] text-muted/60 uppercase sm:block">
          Hover · Move cursor · Click a card
        </p>
      </div>
    </section>
  );
}
