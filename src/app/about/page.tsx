import type { Metadata } from "next";
import About from "@/components/sections/About";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about my background, interests, and the technologies I use.",
};

export default function AboutPage() {
  return <About />;
}
