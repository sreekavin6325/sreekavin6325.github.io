import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlowButton } from "@/components/ui/flow-button";
import { getProjectBySlug, projects } from "@/data/projects";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return { title: project.title, description: project.summary };
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 font-mono text-xs tracking-[0.2em] text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-muted">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-foreground" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <article className="container-page max-w-3xl py-20">
      <Link href="/projects" className="font-mono text-sm text-muted hover:text-accent">
        ← Back to projects
      </Link>

      <header className="mt-8 mb-10">
        {(project.year || project.categories) && (
          <p className="font-mono text-xs tracking-[0.15em] text-muted uppercase">
            {[project.year, ...(project.categories ?? [])].filter(Boolean).join("  ·  ")}
          </p>
        )}
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {project.title}
        </h1>
        <p className="mt-4 text-xl text-muted">{project.summary}</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-accent/10 px-3 py-1 font-mono text-xs text-accent"
            >
              {tag}
            </li>
          ))}
        </ul>
      </header>

      {project.image && (
        <div className="relative mb-10 aspect-video overflow-hidden rounded-xl border border-border">
          <Image
            src={project.image}
            alt={`Screenshot of ${project.title}`}
            fill
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover object-[center_55%]"
          />
        </div>
      )}

      <div className="space-y-4 text-lg leading-relaxed text-muted">
        {project.description.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {project.features && (
        <DetailSection title="Key features">
          <BulletList items={project.features} />
        </DetailSection>
      )}

      {project.techStack && (
        <DetailSection title="Tech stack">
          <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
            {project.techStack.map(({ label, value }) => (
              <div key={label} className="contents">
                <dt className="font-mono text-sm text-foreground">{label}</dt>
                <dd className="text-muted">{value}</dd>
              </div>
            ))}
          </dl>
        </DetailSection>
      )}

      {project.dataset && (
        <DetailSection title="Dataset">
          <p className="mb-4 text-lg leading-relaxed text-muted">{project.dataset.summary}</p>
          {project.dataset.items && <BulletList items={project.dataset.items} />}
        </DetailSection>
      )}

      {project.metrics && (
        <DetailSection title="Performance">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {project.metrics.map(({ label, value }) => (
              <div key={label} className="flex flex-col-reverse rounded-xl border border-border bg-surface p-4">
                <dt className="mt-1 font-mono text-xs text-muted">{label}</dt>
                <dd className="text-2xl font-semibold tracking-tight text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </DetailSection>
      )}

      {project.objective && (
        <DetailSection title="Objective">
          <p className="text-lg leading-relaxed text-muted">{project.objective}</p>
        </DetailSection>
      )}

      {project.workflow && (
        <DetailSection title="Workflow">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
            {project.workflow.map((step, index) => (
              <li key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground">
                  <span className="mr-2 font-mono text-xs text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {step}
                </span>
                {index < project.workflow!.length - 1 && (
                  <span className="text-muted" aria-hidden>
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </DetailSection>
      )}

      {project.contribution && (
        <DetailSection title="My contribution">
          <BulletList items={project.contribution} />
        </DetailSection>
      )}

      {project.research && (
        <DetailSection title="Research / Paper">
          <p className="border-l-2 border-foreground/40 pl-4 text-lg leading-relaxed text-muted">
            {project.research}
          </p>
        </DetailSection>
      )}

      {(project.liveUrl || project.repoUrl) && (
        <div className="mt-10 flex flex-wrap gap-4">
          {project.liveUrl && <FlowButton href={project.liveUrl} text="Live demo" external />}
          {project.repoUrl && <FlowButton href={project.repoUrl} text="Source code" external />}
        </div>
      )}
    </article>
  );
}
