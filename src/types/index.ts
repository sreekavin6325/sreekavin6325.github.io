export interface NavLink {
  label: string;
  href: string;
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  description: string[];
  image?: string;
  tags: string[];
  featured: boolean;
  year?: number;
  liveUrl?: string;
  repoUrl?: string;
  /** Optional detail-page sections. */
  features?: string[];
  techStack?: Array<{ label: string; value: string }>;
  objective?: string;
  /** Pipeline steps, shown in order as a flow. */
  workflow?: string[];
  contribution?: string[];
  /** Categories, e.g. "Generative AI", "Banking". */
  categories?: string[];
  dataset?: { summary: string; items?: string[] };
  /** Headline results, shown as stat tiles, e.g. { label: "Accuracy", value: "88.67%" }. */
  metrics?: Array<{ label: string; value: string }>;
  /** Related research or publication note. */
  research?: string;
}

export interface Experience {
  company: string;
  role: string;
  /** Shown as written, e.g. "2025" or "Jan 2025 — Present". */
  date: string;
  location?: string;
  description: string;
  /** Detail points shown when the card is active. */
  highlights?: string[];
  skills: string[];
}

export interface SkillCategory {
  name: string;
  skills: string[];
}

export interface SocialLink {
  label: string;
  href: string;
}
