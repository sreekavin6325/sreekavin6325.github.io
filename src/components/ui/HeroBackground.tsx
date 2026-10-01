// Home hero backdrop: a monochrome planet-over-water scene (public/images/hero-bg.webp),
// fixed behind every page (via layout/SiteBackground), plus small mono labels
// at the edges on Home (desktop).

import Image from "next/image";
import { Letters, ScatterArea } from "@/components/ui/scatter-text";
import "./HeroBackground.css";

/** `labels`: the mono edge words (Home only). */
export default function HeroBackground({ labels = false }: { labels?: boolean }) {
  return (
    <div className="hero-bg" aria-hidden="true">
      <Image
        src="/images/hero-bg.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center brightness-40"
      />
      {/* Darkens the sides slightly so the hero text stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.55)_100%)]" />

      {labels && (
      <div className="hidden font-mono text-[11px] leading-[1.6] tracking-[0.2em] text-foreground/75 lg:block">
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
