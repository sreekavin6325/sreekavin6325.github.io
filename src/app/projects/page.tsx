import type { Metadata } from "next";
import Projects from "@/components/sections/Projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "A collection of projects I've designed and built.",
};

export default function ProjectsPage() {
  return <Projects />;
}
