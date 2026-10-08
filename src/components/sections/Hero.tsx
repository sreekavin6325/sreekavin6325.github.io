import { FlowButton } from "@/components/ui/flow-button";
import Robot from "@/components/ui/Robot";
import { RotatingRole } from "@/components/ui/rotating-role";
import { Letters, ScatterArea } from "@/components/ui/scatter-text";
import { experience } from "@/data/experience";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";
import { siteConfig } from "@/lib/utils";

const STATS = [
  { value: projects.length, label: "Projects" },
  { value: experience.length, label: "Roles" },
  { value: skills.reduce((n, group) => n + group.skills.length, 0), label: "Technologies" },
];
const TOOLS = skills.flatMap((group) => group.skills);

export default function Hero() {
  return (
    <section id="home" className="relative isolate flex min-h-screen flex-col overflow-hidden">
      {/* On desktop the robot fills the hero section, so its arms and legs aren't clipped. It
          scrolls away with the hero (the Contact section has its own robot). */}
      <Robot eager className="relative h-44 w-full sm:h-96 lg:absolute lg:inset-0 lg:h-full" />

      {/* The text layer lets the pointer through to the robot (so it keeps tracking the cursor);
          only the buttons capture clicks. */}
      <div className="container-page relative z-10 grid flex-1 content-center items-center gap-6 py-4 sm:gap-10 sm:py-10 lg:pointer-events-none lg:grid-cols-[1fr_360px_1fr] lg:gap-8 lg:py-0">
        {/* ScatterArea padding is the boundary: letters scatter from the cursor only inside it. */}
        <ScatterArea className="text-center lg:-m-8 lg:p-8 lg:text-right">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1 font-mono text-[11px] tracking-[0.15em] text-foreground/80 uppercase backdrop-blur-md">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full bg-white/70" />
              <span className="relative h-2 w-2 rounded-full bg-white" />
            </span>
            {siteConfig.status}
          </p>
          <p className="mb-4 font-mono text-accent">
            <Letters text="Hi, my name is" />
          </p>
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
            <Letters text={`${siteConfig.name}.`} />
          </h1>
          <p className="mt-4 font-mono text-sm uppercase tracking-widest text-muted">
            <Letters text={siteConfig.role} />
          </p>
          <p className="mt-2 h-5 font-mono text-sm text-foreground/70">
            <span className="text-muted">&gt; </span>
            <RotatingRole words={siteConfig.focusAreas} />
          </p>
        </ScatterArea>

        {/* Keeps the center column clear for the robot. */}
        <div className="hidden lg:block" aria-hidden />

        <ScatterArea className="text-center lg:-m-8 lg:p-8 lg:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-muted sm:text-4xl">
            <Letters text="I build things for the web." />
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted lg:mx-0">
            <Letters
              text={`I'm a ${siteConfig.role.toLowerCase()} focused on building fast, accessible, and thoughtfully designed web applications.`}
            />
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 sm:mt-8 lg:pointer-events-auto lg:justify-start">
            <FlowButton href="#projects" text="View my work" />
            <FlowButton href="#contact" text="Get in touch" />
          </div>
          <dl className="mt-6 hidden sm:flex justify-center gap-8 sm:mt-8 lg:justify-start">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">{stat.label}</dt>
                <dd className="text-2xl font-semibold text-foreground">
                  {String(stat.value).padStart(2, "0")}
                </dd>
              </div>
            ))}
          </dl>
        </ScatterArea>
      </div>
      {/* Tech stack strip: a faint, slowly scrolling row of tools along the bottom */}
      <div
        className="pointer-events-none relative z-10 mb-2 hidden overflow-hidden sm:block [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]"
        aria-label={`Tools: ${TOOLS.join(", ")}`}
      >
        <div className="flex w-max animate-marquee gap-10 motion-reduce:animate-none font-mono text-xs tracking-[0.2em] text-foreground/40 uppercase" aria-hidden>
          {[...TOOLS, ...TOOLS].map((tool, i) => (
            <span key={i} className="flex items-center gap-10">
              {tool}
              <span className="h-1 w-1 rounded-full bg-foreground/30" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
