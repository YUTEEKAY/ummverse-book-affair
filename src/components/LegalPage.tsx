import { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export type LegalSection = { heading: string; body: ReactNode };

export function LegalPage({ title, intro, updated, sections }: { title: string; intro: string; updated: string; sections: LegalSection[] }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Ummverse Ventures · Last updated {updated}</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-foreground md:text-5xl">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{intro}</p>
        <div className="mt-10 space-y-10">
          {sections.map((s, i) => (
            <section key={s.heading}>
              <h2 className="font-serif text-2xl font-semibold text-foreground">{i + 1}. {s.heading}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-foreground/85 [&_a]:text-primary [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">{s.body}</div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
