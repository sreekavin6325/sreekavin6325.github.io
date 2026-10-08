"use client";

import Link from "next/link";
import { useState } from "react";
import Navigation from "@/components/layout/Navigation";
import { FlowButton } from "@/components/ui/flow-button";
import { MusicToggle } from "@/components/ui/music-toggle";
import { cn, siteConfig } from "@/lib/utils";

export default function Header() {
  const [open, setOpen] = useState(false);
  // Over the site backdrop the bar is a glass panel (kept as a flag in case a page opts out).
  const glass = true;

  return (
    <header className={cn("sticky top-0 z-50", glass ? "px-3 pt-2" : "bg-background/80 backdrop-blur")}>
      {/* Desktop: equal-width side columns keep the navigation exactly centered. */}
      <div
        className={cn(
          "container-page flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr]",
          glass
            ? "h-14 rounded-2xl border border-white/15 bg-black/70 shadow-[0_0_60px_-12px_rgba(255,255,255,0.18)] backdrop-blur-xl"
            : "h-16",
        )}
      >
        <Link href="#home" className="justify-self-start font-mono text-lg font-bold text-foreground">
          {siteConfig.name}
          <span className="text-accent">.</span>
        </Link>

        <div className="hidden lg:block">
          <Navigation />
        </div>

        {/* One music toggle for all sizes: before Resume on desktop, before the menu on phones */}
        <div className="flex items-center gap-3 justify-self-end">
          <MusicToggle />
          <div className="hidden lg:block">
            <FlowButton href={siteConfig.resume} text="Resume" size="sm" external />
          </div>

        <button
          type="button"
          className="p-2 text-foreground lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className={cn("lg:hidden", glass && "mt-2 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl")}>
          <div className="container-page flex flex-col gap-6 py-6">
            <Navigation orientation="vertical" onNavigate={() => setOpen(false)} />
            <FlowButton href={siteConfig.resume} text="Resume" size="sm" external />
          </div>
        </div>
      )}
    </header>
  );
}
