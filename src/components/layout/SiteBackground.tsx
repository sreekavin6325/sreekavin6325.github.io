"use client";

import { usePathname } from "next/navigation";
import HeroBackground from "@/components/ui/HeroBackground";

/** The planet backdrop, fixed behind every page (edge labels on Home only). */
export default function SiteBackground() {
  return <HeroBackground labels={usePathname() === "/"} />;
}
