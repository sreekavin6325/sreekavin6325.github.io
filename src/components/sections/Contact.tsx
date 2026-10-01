"use client";

import type { Application } from "@splinetool/runtime";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { type FormEvent, type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import Robot from "@/components/ui/Robot";
import { FlowButton } from "@/components/ui/flow-button";
import { PaperPlaneFlight, type Point } from "@/components/ui/paper-plane";
import { createPuppet, type Puppet, type PuppetMode } from "@/components/ui/robot-puppet";
import {
  MESSAGE_LIMIT,
  SEND_LIMIT,
  SEND_WINDOW_MS,
  TOPICS,
  type ContactField,
  type Topic,
  validateContact,
} from "@/lib/contact";
import { cn, siteConfig, socialLinks } from "@/lib/utils";

interface ContactProps {
  headingAs?: "h1" | "h2";
}

/* Rate limit: at most SEND_LIMIT messages per email address in SEND_WINDOW_MS.
   The real limit is enforced by the Google Sheet script (see /api/contact); this copy in
   the browser just warns early, before a visitor writes a message that would be refused. */
const SENDS_KEY = "contact-sends";

function readSends(): Record<string, number[]> {
  try {
    return JSON.parse(localStorage.getItem(SENDS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Send times within the window for this address (newest last). */
function recentSends(email: string): number[] {
  const now = Date.now();
  return (readSends()[email.trim().toLowerCase()] ?? []).filter((time) => now - time < SEND_WINDOW_MS);
}

function recordSend(email: string) {
  const key = email.trim().toLowerCase();
  const sends = readSends();
  sends[key] = [...recentSends(key), Date.now()];
  try {
    localStorage.setItem(SENDS_KEY, JSON.stringify(sends));
  } catch {
    // Storage unavailable (e.g. private mode) - the limit just won't persist.
  }
}

function limitMessage(email: string) {
  const oldest = recentSends(email)[0];
  const hours = oldest ? Math.max(1, Math.ceil((oldest + SEND_WINDOW_MS - Date.now()) / 3_600_000)) : 24;
  return `You've already sent ${SEND_LIMIT} messages from this email. Try again in ${hours} hour${hours === 1 ? "" : "s"}.`;
}

const LINKEDIN = socialLinks.find((link) => link.label.toLowerCase() === "linkedin");

type Field = ContactField;
type Status = "idle" | "sending" | "error";
type SaveResult = { ok?: boolean; error?: string } | null;
type Bubble = "linkedin" | "hiding" | null;

function validate(values: Record<Field, string>): Partial<Record<Field, string>> {
  const errors = validateContact(values);
  if (!errors.email && typeof window !== "undefined" && recentSends(values.email).length >= SEND_LIMIT) {
    errors.email = limitMessage(values.email);
  }
  return errors;
}

/** Roughly where the caret is in a field, in screen coordinates, for the robot to look at. */
function caretPoint(field: HTMLInputElement | HTMLTextAreaElement) {
  const rect = field.getBoundingClientRect();
  const position = field.selectionEnd ?? field.value.length;
  const charWidth = 8.5;
  if (field instanceof HTMLTextAreaElement) {
    const columns = Math.max(1, Math.floor(rect.width / charWidth));
    const row = Math.floor(position / columns);
    return {
      x: rect.left + (position % columns) * charWidth,
      y: rect.top + Math.min(28 + row * 24, rect.height - 8),
    };
  }
  return { x: rect.left + Math.min(position * charWidth, rect.width), y: rect.top + rect.height * 0.7 };
}

export default function Contact({ headingAs: Heading = "h2" }: ContactProps) {
  const [topic, setTopic] = useState<Topic>("A project");
  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", phone: "", message: "" });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  // The send animation: set while the paper plane is in the air.
  const [flight, setFlight] = useState<{
    from: Point;
    to: Point;
    outcome: "success" | "failure" | null;
    target: Point | null; // centre of the "Message sent" tick circle, once it's on screen
  } | null>(null);
  const [tickVisible, setTickVisible] = useState(true); // hidden while the plane turns into it
  const tickSlotRef = useRef<HTMLSpanElement>(null);
  const flightResult = useRef<SaveResult>(null);
  const sendButtonRef = useRef<HTMLSpanElement>(null);
  const [serverEmailError, setServerEmailError] = useState<string | null>(null);
  const [website, setWebsite] = useState(""); // honeypot: hidden from people, filled by bots
  const [bubble, setBubble] = useState<Bubble>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const robotBoxRef = useRef<HTMLDivElement>(null);
  const puppetRef = useRef<Puppet | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const errors = validate(values);
  const showError = (field: Field) => touched[field] && errors[field];

  // --- Robot -------------------------------------------------------------------------
  const handleRobotLoad = useCallback((app: Application) => {
    if (!robotBoxRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    puppetRef.current?.destroy();
    // On this page the robot reacts to the form, not the cursor.
    puppetRef.current = createPuppet(app, robotBoxRef.current, { reducedMotion: reduced, followCursor: false });
  }, []);
  useEffect(() => () => puppetRef.current?.destroy(), []);

  const modeRef = useRef<PuppetMode["kind"]>("idle");
  const pose = (mode: PuppetMode) => {
    modeRef.current = mode.kind;
    puppetRef.current?.setMode(mode);
  };

  const clearBubble = () => {
    clearTimeout(bubbleTimer.current);
    setBubble(null);
  };

  /** Focus handlers: the robot watches you type, but looks away for your phone number. */
  const watch = (field: HTMLInputElement | HTMLTextAreaElement) => {
    clearBubble();
    pose({ kind: "watch", target: () => (document.activeElement === field ? caretPoint(field) : null) });
  };
  const hide = () => {
    clearTimeout(bubbleTimer.current);
    setBubble("hiding");
    pose({ kind: "hide" });
  };
  const rest = () => {
    // Focus may be moving to another field: let its focus handler set the pose first.
    setTimeout(() => {
      const active = document.activeElement;
      const typing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
      // Only undo poses that came from a field (not e.g. the LinkedIn reveal clicked meanwhile).
      if (!typing && (modeRef.current === "watch" || modeRef.current === "hide")) {
        setBubble((current) => (current === "linkedin" ? current : null));
        pose({ kind: "idle" });
      }
    }, 0);
  };

  const showLinkedIn = () => {
    clearTimeout(bubbleTimer.current);
    setBubble("linkedin");
    pose({ kind: "present" });
    bubbleTimer.current = setTimeout(() => {
      setBubble((current) => (current === "linkedin" ? null : current));
      pose({ kind: "idle" });
    }, 8000);
  };
  useEffect(() => () => clearTimeout(bubbleTimer.current), []);

  // --- Form ----------------------------------------------------------------------------
  const update = (field: Field) => (event: { target: { value: string } }) => {
    if (field === "email") setServerEmailError(null);
    if (status === "error") setStatus("idle");
    setValues((current) => ({
      ...current,
      [field]: event.target.value.slice(0, field === "message" ? MESSAGE_LIMIT : 200),
    }));
  };

  async function copyEmail() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(siteConfig.email);
      ok = true;
    } catch {
      // The Clipboard API can be blocked (permissions, insecure context) - fall back to a
      // temporary text field and the older copy command.
      const field = document.createElement("textarea");
      field.value = siteConfig.email;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      ok = document.execCommand("copy");
      field.remove();
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  // Opens the visitor's email app with the message pre-filled.
  // Swap this for an API route or a service like Formspree/Resend to send directly.
  // Saves the message to the Google Sheet via /api/contact (see src/app/api/contact/route.ts).
  async function save(): Promise<SaveResult> {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, topic, website }),
      });
      return (await response.json().catch(() => null)) as SaveResult;
    } catch {
      return null;
    }
  }

  /** Shows the outcome of a save: the "Message sent" panel, or what went wrong. */
  function finish(result: SaveResult) {
    if (result?.ok) {
      recordSend(values.email);
      setStatus("idle");
      setSent(true);
      pose({ kind: "idle" });
    } else if (result?.error === "rate_limited") {
      setServerEmailError(`You've already sent ${SEND_LIMIT} messages from this email today. Please try again tomorrow.`);
      setStatus("idle");
    } else {
      setStatus("error");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setTouched({ name: true, email: true, phone: true, message: true });
    setServerEmailError(null);
    if (Object.keys(errors).length) return;
    setStatus("sending");

    const button = sendButtonRef.current?.getBoundingClientRect();
    const card = cardRef.current?.getBoundingClientRect();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !button || !card) {
      finish(await save());
      return;
    }

    // The label folds into a paper plane that loops round the page and lands on the card
    // (where the ✓ appears) while the message is being saved.
    flightResult.current = null;
    setFlight({
      from: { x: button.left + button.width / 2, y: button.top + button.height / 2 },
      to: { x: card.left + card.width / 2, y: card.top + card.height * 0.38 },
      outcome: null,
      target: null,
    });
    const result = await save();
    flightResult.current = result;
    setFlight((current) => current && { ...current, outcome: result?.ok ? "success" : "failure" });
  }

  // The plane has landed and the message is saved: show "Message sent" with an empty tick
  // circle. Once that panel has settled, its circle becomes the plane's final target.
  const handleLandedSuccess = useCallback(() => {
    setTickVisible(false);
    setSent(true);
  }, []);

  function handleSentShown() {
    const slot = tickSlotRef.current?.getBoundingClientRect();
    if (!slot) return;
    const target = { x: slot.left + slot.width / 2, y: slot.top + slot.height / 2 };
    setFlight((current) => current && !current.target ? { ...current, target } : current);
  }

  function handleFlightDone() {
    setTickVisible(true);
    setFlight(null);
    finish(flightResult.current);
  }

  function reset() {
    setValues({ name: "", email: "", phone: "", message: "" });
    setTouched({});
    setServerEmailError(null);
    setStatus("idle");
    setSent(false);
  }

  // A soft light that follows the cursor across the form card.
  function moveSpotlight(event: PointerEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    card.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }

  const fieldEvents = (field: Field) => ({
    onFocus: (event: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) =>
      field === "phone" ? hide() : watch(event.currentTarget),
    onBlur: () => {
      setTouched((t) => ({ ...t, [field]: true }));
      rest();
    },
  });

  return (
    <section
      id="contact"
      className="container-page grid flex-1 items-center gap-6 py-3 lg:grid-cols-[1fr_1.05fr] lg:gap-10"
    >
      {/* The robot: watches you type, hides its eyes for your phone number, shows my LinkedIn */}
      <div ref={robotBoxRef} className="relative h-72 sm:h-96 lg:h-[min(78vh,660px)]">
        {/* The scene frames the robot to its canvas width, so the canvas is wider than the
            column (centred on it, behind the form) to show the robot at full size. */}
        <Robot
          className="pointer-events-none absolute top-0 -bottom-24 left-1/2 lg:-bottom-[40vh] w-full -translate-x-1/2 lg:w-[210%] lg:max-w-[1300px]"
          onLoad={handleRobotLoad}
        />

        <AnimatePresence>
          {bubble && (
            <motion.div
              key={bubble}
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 4 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="absolute top-[6%] right-[2%] z-10 origin-bottom-left sm:right-[6%]"
              role="status"
            >
              <div className="relative rounded-2xl border border-white/20 bg-white/[0.07] px-4 py-3 shadow-[0_20px_50px_-20px_rgba(255,255,255,0.2)] backdrop-blur-xl">
                {bubble === "linkedin" && LINKEDIN ? (
                  <>
                    <p className="font-mono text-[10px] tracking-[0.25em] text-muted uppercase">Find me on LinkedIn</p>
                    <a
                      href={LINKEDIN.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground underline decoration-white/30 underline-offset-4 hover:decoration-white"
                    >
                      {LINKEDIN.href.replace(/^https?:\/\/(www\.)?/, "")}
                      <ArrowUpRight size={14} />
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-foreground">I&apos;m not looking.</p>
                )}
                {/* Tail toward the robot */}
                <span className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 border-r border-b border-white/20 bg-[#121212]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The form (above the robot's wide canvas) */}
      <div className="relative z-10">
        <div
          ref={cardRef}
          onPointerMove={moveSpotlight}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-background/80 p-6 backdrop-blur-sm sm:px-7 sm:py-6"
        >
          {/* Cursor spotlight */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 0%), rgba(255,255,255,0.07), transparent 60%)",
            }}
            aria-hidden
          />

          <AnimatePresence mode="wait" initial={false}>
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="relative flex min-h-[440px] flex-col items-center justify-center text-center"
                role="status"
                onAnimationComplete={() => sent && handleSentShown()}
              >
                <span
                  ref={tickSlotRef}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20"
                >
                  {/* Drawn by the paper plane on arrival; shown here once it's done */}
                  <Check size={22} className={cn(!tickVisible && "opacity-0")} />
                </span>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight">Message sent</h3>
                <p className="mt-3 max-w-sm text-sm text-muted">
                  Thanks, {values.name.trim().split(" ")[0]}. I&apos;ve got your message and will get back to you at{" "}
                  <span className="text-foreground">{values.email.trim()}</span>.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-foreground"
                  >
                    Write another
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                noValidate
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="relative space-y-4"
              >
                <Heading className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Let&apos;s work together.
                </Heading>

                <fieldset>
                  <legend className="mb-3 font-mono text-[11px] tracking-[0.25em] text-muted uppercase">
                    What&apos;s it about?
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((option) => {
                      const selected = option === topic;
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setTopic(option)}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-sm transition-all duration-300",
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-white/15 text-muted hover:border-white/40 hover:text-foreground",
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FloatingField
                    id="name"
                    label="Your name"
                    value={values.name}
                    onChange={update("name")}
                    {...fieldEvents("name")}
                    error={showError("name")}
                    autoComplete="name"
                  />
                  <FloatingField
                    id="email"
                    label="Your email"
                    type="email"
                    value={values.email}
                    onChange={update("email")}
                    {...fieldEvents("email")}
                    error={serverEmailError ?? showError("email")}
                    autoComplete="email"
                  />
                </div>

                <FloatingField
                  id="phone"
                  label="Phone number (optional)"
                  type="tel"
                  value={values.phone}
                  onChange={update("phone")}
                  {...fieldEvents("phone")}
                  error={showError("phone")}
                  autoComplete="tel"
                />

                <FloatingField
                  id="message"
                  label="Your message"
                  multiline
                  value={values.message}
                  onChange={update("message")}
                  {...fieldEvents("message")}
                  error={showError("message")}
                  hint={`${values.message.length} / ${MESSAGE_LIMIT}`}
                />

                {/* Honeypot: invisible to people; bots that fill it are ignored by the server. */}
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="absolute -left-[9999px] h-px w-px opacity-0"
                />

                <AnimatePresence>
                  {status === "error" && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      role="alert"
                      className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-foreground/90"
                    >
                      Couldn&apos;t send your message just now. Please try again, or email me at{" "}
                      <button type="button" onClick={copyEmail} className="underline underline-offset-4">
                        {copied ? "copied!" : siteConfig.email}
                      </button>
                      .
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  {LINKEDIN ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={showLinkedIn}
                        aria-label="Show my LinkedIn"
                        aria-expanded={bubble === "linkedin"}
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300",
                          bubble === "linkedin"
                            ? "border-foreground bg-foreground text-background"
                            : "border-white/15 text-foreground hover:-translate-y-0.5 hover:border-white/40",
                        )}
                      >
                        <LinkedInLogo />
                      </button>
                      <span className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Or LinkedIn</span>
                    </div>
                  ) : (
                    <span />
                  )}
                  {/* Hidden while its label is off flying as a paper plane */}
                  <span ref={sendButtonRef} className={cn("transition-opacity", flight && "opacity-0")}>
                    <FlowButton type="submit" text={status === "sending" && !flight ? "Sending…" : "Send message"} />
                  </span>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

      </div>

      {flight && (
        <PaperPlaneFlight
          from={flight.from}
          to={flight.to}
          label="Send message"
          outcome={flight.outcome}
          target={flight.target}
          onLandedSuccess={handleLandedSuccess}
          onDone={handleFlightDone}
        />
      )}
    </section>
  );
}

function LinkedInLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface FloatingFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  onFocus: (event: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => void;
  onBlur: () => void;
  error?: string | false;
  hint?: string;
  type?: string;
  autoComplete?: string;
  multiline?: boolean;
}

/** Input with a label that floats up when focused or filled, and an underline that lights up. */
function FloatingField({
  id,
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  hint,
  type = "text",
  autoComplete,
  multiline,
}: FloatingFieldProps) {
  const shared = {
    id,
    value,
    onChange,
    onFocus,
    onBlur,
    placeholder: " ",
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
    className:
      "peer w-full resize-none border-0 border-b bg-transparent pt-6 pb-2 text-foreground outline-none transition-colors " +
      (error ? "border-white/50" : "border-white/15 focus:border-foreground"),
  };

  return (
    <div className="relative">
      {multiline ? <textarea rows={2} {...shared} /> : <input type={type} autoComplete={autoComplete} {...shared} />}
      <label
        htmlFor={id}
        className="pointer-events-none absolute top-6 left-0 origin-left text-muted transition-all duration-300 peer-focus:top-0 peer-focus:scale-75 peer-focus:text-foreground peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-75"
      >
        {label}
      </label>
      <div className="mt-1.5 flex min-h-4 justify-between gap-4 text-xs">
        <AnimatePresence>
          {error && (
            <motion.p
              id={`${id}-error`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-foreground/80"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        {hint && <span className="ml-auto font-mono text-muted">{hint}</span>}
      </div>
    </div>
  );
}
