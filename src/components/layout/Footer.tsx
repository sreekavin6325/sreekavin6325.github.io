import { siteConfig, socialLinks } from "@/lib/utils";

export default function Footer() {
  return (
    <footer className="relative z-10">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted sm:flex-row">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        <ul className="flex gap-6">
          {socialLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-accent"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a href={`mailto:${siteConfig.email}`} className="transition-colors hover:text-accent">
              Email
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
