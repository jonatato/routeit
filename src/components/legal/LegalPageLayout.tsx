import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalPageLayoutProps = {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
};

function LegalPageLayout({ title, subtitle, lastUpdated, sections }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-5xl px-6 pb-14 pt-10">
        <div className="mb-8 space-y-3">
          <Link to="/" className="text-sm font-semibold text-primary transition hover:text-primary/80">
            ← Volver a Routeit
          </Link>
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
          <p className="text-sm text-mutedForeground md:text-base">{subtitle}</p>
          <p className="text-xs text-mutedForeground">Última actualización: {lastUpdated}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-2xl border border-border bg-card/85 p-4 lg:sticky lg:top-6 lg:h-fit">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">Índice</p>
            <nav className="flex flex-col gap-2">
              {sections.map(section => (
                <a key={section.id} href={`#${section.id}`} className="text-sm text-mutedForeground transition hover:text-foreground">
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="space-y-4">
            {sections.map(section => (
              <section key={section.id} id={section.id} className="rounded-2xl border border-border bg-card/90 p-5">
                <h2 className="mb-2 text-lg font-semibold text-foreground">{section.title}</h2>
                <div className="space-y-2 text-sm leading-6 text-mutedForeground">{section.content}</div>
              </section>
            ))}
          </article>
        </div>
      </main>
    </div>
  );
}

export default LegalPageLayout;
