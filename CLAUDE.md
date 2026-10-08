# CLAUDE.md

Personal portfolio of A R Sreekavin ("Kavin"). Next.js 15 (App Router) + React 19 +
TypeScript + Tailwind CSS v4. Node 20.5 locally, so stay on Next 15 (Next 16 needs ≥20.9).

## Commands

- `npm run dev` — dev server on http://localhost:3000 (the owner usually runs it in their own terminal)
- `npx tsc --noEmit` — type-check; run after every change
- `npm run build` — **never while a dev server is running**: both use `.next`, and the
  dev server breaks (ChunkLoadError / 500s). If that happens: stop it, `rm -rf .next`, restart.

The project folder name ends with a space: `/Users/rajnandhinija/Desktop/KAVIN'S/portfolio `
(quote it in shell commands). A stray `~/package-lock.json` causes a harmless
"multiple lockfiles" warning.

## Design rules (from the owner)

- **Black & white only.** Tokens in `src/app/globals.css` `@theme` (`background`, `surface`,
  `surface-2`, `border`, `foreground`, `muted`, `accent`). No colours.
- **Single scrollable page.** Home, About, Projects, Experience and Contact are sections
  stacked on `/` (each `min-h-screen`, id'd `#home`/`#about`/`#projects`/`#experience`/`#contact`),
  not separate routes — the nav scrolls to them. Only `/projects/[slug]` is a real route.
  Each section still fits one screen edge-to-edge except Experience (tall, scroll-driven by design).
- Premium, minimal, animated feel. Verify every visual change in the browser at 1280×800
  and 375×812 (mobile), and check `scrollHeight === innerHeight` where pages must fit.
- Don't invent facts about the owner's work; ask, or draft clearly marked text for review.

## Structure

`app/page.tsx` renders all five sections in order. `lib/utils.ts` `navLinks` hrefs (`#home`
etc.) drive `layout/Navigation.tsx`, which scrollspies the sections (IntersectionObserver) to
highlight the current one; clicking a link is a plain in-page anchor (native smooth scroll).

| Section id | Component | Notes |
| --- | --- | --- |
| `#home` | `sections/Hero.tsx` | Spline 3D robot (cursor-following) + edge labels. Site backdrop `ui/HeroBackground` (`public/images/hero-bg.webp`) is fixed behind the whole page via `layout/SiteBackground`; header is a black glass bar |
| `#about` | `sections/About.tsx` | Interactive terminal (typed intro, commands) + portrait window |
| `#projects` | `sections/Projects.tsx` | `ui/card-spread.tsx` "lifted card" hand of projects |
| — | `app/projects/[slug]/page.tsx` | Separate route (exception above). Renders optional sections: features, techStack, dataset, metrics, objective, workflow, contribution, research. "Back" goes to `/#projects` |
| `#experience` | `sections/Experience.tsx` | GSAP ScrollTrigger: ship flies a winding path through space over the site backdrop; one waypoint per screen; mission HUD + arrival panel |
| `#contact` | `sections/Contact.tsx` | Robot puppet reacts to the form; form saves to Google Sheets; paper-plane send animation |

Content lives in `src/data/` (projects, experience, skills) and `siteConfig`/`socialLinks`
in `src/lib/utils.ts`. Types in `src/types/index.ts`. Images in `public/images/{profile,projects}`;
resume at `public/resume.pdf`; favicons in `public/`.

Layout-wide: `layout/Header.tsx` + `Navigation.tsx` (Flow Buttons, centred, `lg:` breakpoint,
scrollspy — see Structure), `ui/music-toggle.tsx` lives in the header too (looping background
track, muted state remembered). `layout/LoadingScreen.tsx` (first-load loader; waits for
`[data-robot][data-loaded=true]`, then an **Enter** click closes it and is the gesture that
starts the music; **reloading `/projects/[slug]` redirects to `/`**, direct visits don't).

## Contact form → Google Sheets

Form → `POST /api/contact` (`src/app/api/contact/route.ts`) → Google Apps Script web app
(`google-apps-script/contact-to-sheet.gs`, pasted into the owner's sheet) → row appended.
Validation is shared in `src/lib/contact.ts`. The script checks a shared secret, enforces
**2 messages per email per 24h** (authoritative; the browser's localStorage copy only warns
early) and escapes formula-looking cells. Honeypot field `website`.

Env vars (`.env.local`, never commit; also needed on the host, e.g. Vercel):
`CONTACT_SHEET_URL` (must be the `…/macros/s/…/exec` web-app URL, not the editor URL),
`CONTACT_SHEET_SECRET` (must equal `SECRET` in the script), `NEXT_PUBLIC_CONTACT_EMAIL`,
`NEXT_PUBLIC_SITE_URL`. Test the script with a wrong secret (expects
`{"ok":false,"error":"unauthorized"}`), using `curl -sL -d …` without `-X POST` so the
redirect is followed with GET. To test the form without touching the real sheet, point the
env at a local mock that mimics the POST→302→GET JSON behaviour, then restore `.env.local`.

## Robot (Spline) notes

- Scene: `https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode`, wrapped by
  `ui/Robot.tsx` (lazy-loaded; exposes the app via `onLoad`). Canvas is transparent.
- The scene frames the robot to the **canvas width**: a narrow canvas makes it tiny, so the
  Contact page widens the canvas (`lg:w-[210%]`) behind the form. `app.setZoom` pushes it out of frame — don't use it.
- `ui/robot-puppet.ts` poses it by overriding joint rotations every frame (the scene's idle
  animation/LookAt resets them otherwise). Rig: `Hand Instance` (mirrored, index 0) / `Hand`
  (index 1) › `Hand LEFT` (shoulder) › `arm` › `elbow` › `forearm`; plus `Head`. Same angles
  on both sides pose symmetrically. Poses: watch (head toward caret), hide (hands over visor),
  present (raise left hand). Contact uses `followCursor: false`.
- Screenshots in the browser pane often catch the robot before it renders or mid intro
  camera move; take a second screenshot before concluding anything.

## Gotchas learned here

- Percentage heights inside flex chains (`body min-h-screen` › `main flex-1`) don't resolve;
  for full-height stages use a `relative flex-1` wrapper with an `absolute inset-0` child.
- Don't combine `relative` and `absolute`/`translate-*` utilities on one element (Tailwind
  order decides the winner). `Robot`'s wrapper therefore takes only the caller's classes.
- Buttons across the site are `ui/flow-button.tsx` (`FlowButton`; supports `href`, `external`,
  `size="sm"`, `active`).
- rAF/GSAP animations pause while the browser pane is hidden; test animations with the pane visible.
- HMR can leave stale closures in long-running loops (ticker, puppet); reload before judging.
