"use client";

// Site backdrop: a monochrome planet-over-water scene (public/images/hero-bg.webp), fixed
// behind the whole page (via layout/SiteBackground), plus small mono labels at the edges.
// The backdrop never scrolls, so the labels fade out once the hero is behind you - they
// belong to the hero, not to the sections below it.

import Image from "next/image";
import { useEffect, useState } from "react";
import { Letters, ScatterArea } from "@/components/ui/scatter-text";
import { cn } from "@/lib/utils";
import "./HeroBackground.css";

/** `labels`: the mono edge words (hero only). */
export default function HeroBackground({ labels = false }: { labels?: boolean }) {
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!labels) return;
    const update = () => setPastHero(window.scrollY > window.innerHeight * 0.45);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [labels]);

  return (
    <div className="hero-bg" aria-hidden="true">
      <Image
        src="/images/hero-bg.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Dims the picture (cheaper than a CSS brightness filter on a fixed image) and darkens
          the sides further so the text over it stays readable */}
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.55)_100%)]" />

      {labels && (
      <div
        className={cn(
          "hidden font-mono text-[11px] leading-[1.6] tracking-[0.2em] text-foreground/75 transition-opacity duration-500 lg:block",
          pastHero && "opacity-0",
        )}
      >
        <ScatterArea className="absolute -m-6 p-6 top-[13%] left-[3%]">
          <span className="mb-3 block h-px w-6 bg-foreground/90" />
          {["BUILD", "LEARN", "EXPLORE", "CREATE"].map((word, i) => (
            <p key={word} className="flex w-40 justify-between">
              <Letters text={word} />
              <Letters text={`0${i + 1}`} />
            </p>
          ))}
        </ScatterArea>
        <ScatterArea className="absolute -m-6 p-6 top-[12%] right-[5%]">
          {["DESIGN", "DEVELOP", "DEPLOY", "SCALE"].map((word) => (
            <p key={word}>
              <Letters text={word} />
            </p>
          ))}
        </ScatterArea>
        <ScatterArea className="absolute -m-6 p-6 top-[70%] right-[3%]">
          <span className="mb-3 block h-px w-6 bg-foreground/90" />
          {["WEB", "AI/ML", "AUTOMATION", "SYSTEMS"].map((word) => (
            <p key={word}>
              <Letters text={word} />
            </p>
          ))}
        </ScatterArea>
        <ScatterArea className="absolute -m-6 p-6 top-[67%] left-[19%]">
          {["IDEAS", "TO", "REALITY"].map((word) => (
            <p key={word}>
              <Letters text={word} />
            </p>
          ))}
        </ScatterArea>
      </div>
      )}
    </div>
  );
}
