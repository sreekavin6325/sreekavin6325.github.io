import type { Metadata } from "next";
import Contact from "@/components/sections/Contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about projects, opportunities, or just to say hello.",
};

export default function ContactPage() {
  return <Contact headingAs="h1" />;
}
