"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { experience } from "@/data/experience";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";
import { siteConfig, socialLinks } from "@/lib/utils";

const ABOUT_PARAGRAPHS = [
  `Hello! I'm ${siteConfig.name}, a ${siteConfig.role.toLowerCase()} who enjoys turning ideas into polished products. I care about clean code, good performance, and interfaces that feel effortless to use.`,
  "I've worked across the stack — from designing component libraries to building APIs — and I'm always learning something new.",
  "Outside of coding, you can find me reading, gaming, or exploring new places.",
];

const PORTRAIT = "/images/profile/kavin.webp";

/** Commands the terminal types out by itself when the page opens. */
const INTRO_SCRIPT = ["whoami", "cat about.txt", "ls skills/"];

/** Pages reachable with `open <page>`. */
const PAGES: Record<string, string> = {
  home: "/",
  about: "/about",
  projects: "/projects",
  experience: "/experience",
  contact: "/contact",
};

const HELP: Array<[string, string]> = [
  ["whoami", "who I am"],
  ["about", "a little about me"],
  ["skills", "technologies I work with"],
  ["experience", "where I've worked"],
  ["projects", "things I've built"],
  ["contact", "how to reach me"],
  ["resume", "download my resume"],
  ["open <page>", `go to a page (${Object.keys(PAGES).join(", ")})`],
  ["clear", "clear the screen"],
];

const CLEAR = Symbol("clear");

type Entry = { id: number; command: string; output: ReactNode };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const linkClass = "underline decoration-muted underline-offset-4 hover:text-foreground";

function Prompt() {
  return (
    <span className="shrink-0 select-none pr-[1ch]">
      <span className="text-foreground">{siteConfig.name.toLowerCase()}@portfolio</span>
      <span className="text-muted">:~/about$</span>
    </span>
  );
}

/** Runs a command line. Returns what to print, or CLEAR. `navigate` is only used by `open`. */
function execute(line: string, navigate?: (href: string) => void): ReactNode | typeof CLEAR {
  const [name = "", ...args] = line.trim().split(/\s+/);

  switch (name.toLowerCase()) {
    case "":
      return null;

    case "help":
      return (
        <div className="grid grid-cols-[auto_1fr] gap-x-6">
          {HELP.map(([command, description]) => (
            <div key={command} className="contents">
              <span className="text-foreground">{command}</span>
              <span>{description}</span>
            </div>
          ))}
        </div>
      );

    case "whoami":
      return (
        <div className="flex items-center gap-3">
          <Image
            src={PORTRAIT}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full border border-border object-cover object-top"
          />
          <span>
            {siteConfig.name.toLowerCase()} — {siteConfig.role.toLowerCase()}
          </span>
        </div>
      );

    case "about":
    case "cat":
      if (name === "cat" && args[0] !== "about.txt") {
        return `cat: ${args[0] ?? ""}: No such file or directory`;
      }
      return (
        <div className="space-y-3">
          {ABOUT_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      );

    case "skills":
    case "ls":
      if (name === "ls" && args[0] && !args[0].startsWith("skills")) {
        return `ls: ${args[0]}: No such file or directory`;
      }
      return (
        <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          {skills.map((category) => (
            <div key={category.name} className="contents">
              <span className="text-foreground">{category.name.toLowerCase()}/</span>
              <span>{category.skills.join("  ·  ")}</span>
            </div>
          ))}
        </div>
      );

    case "experience":
      return (
        <div className="space-y-2">
          {experience.map((job) => (
            <div key={`${job.company}-${job.role}`}>
              <span className="text-foreground">{job.role}</span> @ {job.company}
              <span className="block text-muted">
                {[job.date, job.location].filter(Boolean).join(" · ")}
              </span>
            </div>
          ))}
          <p>
            → <Link href="/experience" className={linkClass}>open experience</Link> for details
          </p>
        </div>
      );

    case "projects":
      return (
        <div className="space-y-1">
          {projects.map((project) => (
            <div key={project.slug}>
              <Link href={`/projects/${project.slug}`} className={`text-foreground ${linkClass}`}>
                {project.title}
              </Link>{" "}
              — {project.summary}
            </div>
          ))}
        </div>
      );

    case "contact":
      return (
        <div className="grid grid-cols-[auto_1fr] gap-x-6">
          <span className="text-foreground">email</span>
          <a href={`mailto:${siteConfig.email}`} className={linkClass}>
            {siteConfig.email}
          </a>
          {socialLinks.map((link) => (
            <div key={link.href} className="contents">
              <span className="text-foreground">{link.label.toLowerCase()}</span>
              <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {link.href.replace(/^https?:\/\//, "")}
              </a>
            </div>
          ))}
        </div>
      );

    case "resume":
      return (
        <a href={siteConfig.resume} target="_blank" rel="noopener noreferrer" className={linkClass}>
          resume.pdf
        </a>
      );

    case "open": {
      const page = args[0]?.toLowerCase() ?? "";
      const href = PAGES[page];
      if (!href) return `open: unknown page "${page}". Try: ${Object.keys(PAGES).join(", ")}`;
      navigate?.(href);
      return `opening ${page}…`;
    }

    case "clear":
      return CLEAR;

    case "sudo":
      return "Nice try. 🙂";

    case "echo":
      return args.join(" ");

    default:
      return `command not found: ${name}. Type "help" to see what you can do.`;
  }
}

let nextId = 0;
const makeEntry = (command: string, output: ReactNode): Entry => ({ id: nextId++, command, output });
const introEntries = () => INTRO_SCRIPT.map((command) => makeEntry(command, execute(command) as ReactNode));

/** The About page: an interactive terminal that introduces me, then takes commands. */
export default function About() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [typing, setTyping] = useState(""); // the intro command currently being typed
  const [ready, setReady] = useState(false); // intro finished, prompt accepts input
  const [input, setInput] = useState("");
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const skipped = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const finishIntro = useCallback(() => {
    if (skipped.current) return;
    skipped.current = true;
    setEntries(introEntries());
    setTyping("");
    setReady(true);
  }, []);

  // Type the intro script out, one character at a time.
  useEffect(() => {
    skipped.current = false;
    setEntries([]);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishIntro();
      return;
    }

    let cancelled = false;
    const stop = () => cancelled || skipped.current;
    (async () => {
      await sleep(400);
      for (const command of INTRO_SCRIPT) {
        for (let i = 1; i <= command.length; i++) {
          if (stop()) return;
          setTyping(command.slice(0, i));
          await sleep(40 + Math.random() * 50);
        }
        await sleep(250);
        if (stop()) return;
        setTyping("");
        setEntries((current) => [...current, makeEntry(command, execute(command) as ReactNode)]);
        await sleep(450);
      }
      if (stop()) return;
      skipped.current = true;
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [finishIntro]);

  // Focus the prompt once it's ready (not on touch screens, where it would pop up the keyboard).
  useEffect(() => {
    if (ready && window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [ready]);

  // Keep the newest output in view.
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [entries, typing, ready]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const command = input;
    setInput("");
    historyIndex.current = -1;
    if (command.trim()) history.current.unshift(command);

    const output = execute(command, (href) => router.push(href));
    if (output === CLEAR) setEntries([]);
    else setEntries((current) => [...current, makeEntry(command, output)]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const past = history.current;
    if (!past.length) return;
    const next =
      event.key === "ArrowUp"
        ? Math.min(historyIndex.current + 1, past.length - 1)
        : historyIndex.current - 1;
    historyIndex.current = Math.max(next, -1);
    setInput(historyIndex.current === -1 ? "" : past[historyIndex.current]);
  }

  // Clicking anywhere in the window skips the intro and focuses the prompt,
  // unless the visitor is selecting text to copy.
  function handleWindowClick() {
    if (window.getSelection()?.toString()) return;
    finishIntro();
    inputRef.current?.focus({ preventScroll: true });
  }

  return (
    <section className="container-page flex flex-1 flex-col py-6 sm:py-10">
      <h1 className="sr-only">About</h1>

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(260px,340px)_1fr]">
      {/* Portrait, as a second window beside the terminal (desktop) */}
      <figure className="hidden flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[0_24px_60px_-24px_rgba(255,255,255,0.08)] lg:flex">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 font-mono">
          <span className="h-3 w-3 rounded-full border border-muted/60" aria-hidden />
          <span className="h-3 w-3 rounded-full border border-muted/60" aria-hidden />
          <span className="h-3 w-3 rounded-full border border-muted/60" aria-hidden />
          <span className="flex-1 text-center text-xs text-muted">~/photos/kavin.webp</span>
          <span className="w-[52px]" aria-hidden />
        </div>
        <div className="relative flex-1 bg-black">
          <Image
            src={PORTRAIT}
            alt={`Portrait of ${siteConfig.name}`}
            fill
            priority
            sizes="340px"
            className="object-cover object-top"
          />
        </div>
      </figure>

      {/* Absolutely positioned so the terminal gets a definite height and scrolls inside itself. */}
      <div className="relative min-h-[420px]">
        <div
          className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-border bg-surface font-mono text-sm shadow-[0_24px_60px_-24px_rgba(255,255,255,0.08)]"
          onClick={handleWindowClick}
          onKeyDown={() => finishIntro()}
        >
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="h-3 w-3 rounded-full border border-muted/60" aria-hidden />
            <span className="h-3 w-3 rounded-full border border-muted/60" aria-hidden />
            <span className="h-3 w-3 rounded-full border border-muted/60" aria-hidden />
            <span className="flex-1 text-center text-xs text-muted">
              {siteConfig.name.toLowerCase()}@portfolio: ~/about
            </span>
            <span className="w-[52px]" aria-hidden />
          </div>

          {/* Output */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 leading-relaxed text-muted sm:p-6">
            <div role="log" aria-label="Terminal output" className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id}>
                  <div className="flex flex-wrap">
                    <Prompt />
                    <span className="break-all text-foreground">{entry.command}</span>
                  </div>
                  {entry.output !== null && entry.output !== "" && (
                    <div className="mt-1 max-w-3xl">{entry.output}</div>
                  )}
                </div>
              ))}
            </div>

            {!ready && (
              <div className="mt-4 flex" aria-hidden>
                <Prompt />
                <span className="text-foreground">{typing}</span>
                <span className="ml-px inline-block h-[1.2em] w-[0.6em] animate-blink bg-foreground" />
              </div>
            )}

            {ready && (
              <form onSubmit={handleSubmit} className="mt-4 flex">
                <label htmlFor="terminal-input" className="contents">
                  <Prompt />
                  <span className="sr-only">Type a command</span>
                </label>
                <input
                  id="terminal-input"
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={entries.length <= INTRO_SCRIPT.length ? 'type "help"' : undefined}
                  className="min-w-0 flex-1 bg-transparent text-foreground caret-foreground outline-none placeholder:text-muted/50"
                />
              </form>
            )}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
