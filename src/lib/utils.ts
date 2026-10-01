import type { NavLink, SocialLink } from "@/types";

export const siteConfig = {
  name: "Kavin",
  title: "Kavin — Software Developer",
  role: "Software Developer",
  description:
    "Portfolio of Kavin, a software developer building fast, accessible web experiences.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "you@example.com",
  resume: "/resume.pdf",
  /** Home status chip — edit to match what you are doing now. */
  status: "Open to opportunities",
  /** Home typewriter line under the role. */
  focusAreas: ["Web Development", "AI / ML", "Automation"],
};

export const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Experience", href: "/experience" },
  { label: "Contact", href: "/contact" },
];

export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/your-username" },
  { label: "LinkedIn", href: "https://linkedin.com/in/your-username" },
];

/** Join class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
