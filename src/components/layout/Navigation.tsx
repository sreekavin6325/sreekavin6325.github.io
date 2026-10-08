"use client";

import { useEffect, useState } from "react";
import { FlowButton } from "@/components/ui/flow-button";
import { cn, navLinks } from "@/lib/utils";

interface NavigationProps {
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
}

/** Highlights the link for whichever section is currently in view (scrollspy). */
function useActiveSection() {
  const [active, setActive] = useState(navLinks[0]?.href.slice(1) ?? "");

  useEffect(() => {
    const sections = navLinks
      .map((link) => document.getElementById(link.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null);
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return active;
}

export default function Navigation({ orientation = "horizontal", onNavigate }: NavigationProps) {
  const active = useActiveSection();
  const isActive = (href: string) => href.slice(1) === active;

  return (
    <nav aria-label="Main">
      <ul className={cn("flex gap-2", orientation === "vertical" && "flex-col items-start gap-3")}>
        {navLinks.map((link) => (
          <li key={link.href}>
            <FlowButton
              href={link.href}
              text={link.label}
              size="sm"
              active={isActive(link.href)}
              onClick={onNavigate}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
