"use client";

import { usePathname } from "next/navigation";
import { FlowButton } from "@/components/ui/flow-button";
import { cn, navLinks } from "@/lib/utils";

interface NavigationProps {
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
}

export default function Navigation({ orientation = "horizontal", onNavigate }: NavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

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
