import type { Metadata } from "next";
import Experience from "@/components/sections/Experience";

export const metadata: Metadata = {
  title: "Experience",
  description: "My career journey so far — the roles, teams, and skills along the way.",
};

export default function ExperiencePage() {
  return <Experience />;
}
