'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Size = 'default' | 'sm';

interface FlowButtonProps {
  text?: string;
  /** Renders a link instead of a <button> when set. */
  href?: string;
  /** Opens `href` in a new tab. */
  external?: boolean;
  type?: 'button' | 'submit' | 'reset';
  size?: Size;
  /** Keeps the filled (hovered) look, e.g. for the current page in a nav. */
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

// Colors use the site theme tokens (see src/app/globals.css) so the button works on the black background.
// `data-[active=true]` / `group-data-[active=true]` mirror the hover styles for the active state.
const rootClasses =
  'group relative flex w-fit items-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] border-foreground/40 bg-transparent font-semibold text-foreground cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-transparent hover:text-background hover:rounded-[12px] active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground data-[active=true]:border-transparent data-[active=true]:text-background data-[active=true]:rounded-[12px]';

const arrowClasses =
  'absolute stroke-foreground fill-none z-[9] group-hover:stroke-background group-data-[active=true]:stroke-background transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]';

const sizes: Record<Size, { root: string; leftArrow: string; rightArrow: string; text: string; circle: string }> = {
  default: {
    root: 'px-8 py-3 text-sm',
    leftArrow: 'w-4 h-4 left-[-25%] group-hover:left-4 group-data-[active=true]:left-4',
    rightArrow: 'w-4 h-4 right-4 group-hover:right-[-25%] group-data-[active=true]:right-[-25%]',
    text: '-translate-x-3 group-hover:translate-x-3 group-data-[active=true]:translate-x-3',
    circle:
      'group-hover:w-[220px] group-hover:h-[220px] group-data-[active=true]:w-[220px] group-data-[active=true]:h-[220px]',
  },
  sm: {
    root: 'px-6 py-2 text-sm',
    leftArrow: 'w-3.5 h-3.5 left-[-25%] group-hover:left-3 group-data-[active=true]:left-3',
    rightArrow: 'w-3.5 h-3.5 right-3 group-hover:right-[-25%] group-data-[active=true]:right-[-25%]',
    text: '-translate-x-2 group-hover:translate-x-2 group-data-[active=true]:translate-x-2',
    circle:
      'group-hover:w-[180px] group-hover:h-[180px] group-data-[active=true]:w-[180px] group-data-[active=true]:h-[180px]',
  },
};

export function FlowButton({
  text = 'Modern Button',
  href,
  external,
  type = 'button',
  size = 'default',
  active = false,
  onClick,
  className,
}: FlowButtonProps) {
  const s = sizes[size];
  const classes = cn(rootClasses, s.root, className);

  const content = (
    <>
      {/* Left arrow (arr-2) */}
      <ArrowRight aria-hidden className={cn(arrowClasses, s.leftArrow)} />

      {/* Text */}
      <span className={cn('relative z-[1] whitespace-nowrap transition-all duration-[800ms] ease-out', s.text)}>
        {text}
      </span>

      {/* Circle */}
      <span
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-foreground rounded-[50%] opacity-0 group-hover:opacity-100 group-data-[active=true]:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)]',
          s.circle,
        )}
      ></span>

      {/* Right arrow (arr-1) */}
      <ArrowRight aria-hidden className={cn(arrowClasses, s.rightArrow)} />
    </>
  );

  const shared = { className: classes, onClick, 'data-active': active };

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...shared}>
        {content}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} aria-current={active ? 'page' : undefined} {...shared}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} {...shared}>
      {content}
    </button>
  );
}
