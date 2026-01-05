"use client";
import ThemeToggle from "@/components/ThemeToggle";

export default function ResponsiveDemo() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 md:px-10 bg-background text-foreground">
      <section className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Responsive Demo</h1>
          <ThemeToggle />
        </div>

        {/* Hero */}
        <div className="rounded-xl p-6 md:p-10 bg-brand text-white dark:bg-brand-dark">
          <h2 className="text-xl md:text-2xl font-semibold">Build faster with Tailwind</h2>
          <p className="mt-2 md:mt-3 text-white/90 max-w-prose">
            This hero adapts across breakpoints using `sm`, `md`, and `lg` utilities and a custom brand palette.
          </p>
          <div className="mt-4 md:mt-6 flex flex-wrap gap-3">
            <a className="px-4 py-2 rounded bg-white/15 hover:bg-white/25" href="#docs">Docs</a>
            <a className="px-4 py-2 rounded bg-white/15 hover:bg-white/25" href="#components">Components</a>
          </div>
        </div>

        {/* Card grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <article key={i} className="rounded-lg border p-4 bg-white dark:bg-[#121212]">
              <h3 className="font-semibold mb-1">Card {i}</h3>
              <p className="text-sm text-foreground/80">
                Resize the viewport (mobile → tablet → desktop). Grid switches at sm, md, and lg.
              </p>
              <button className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded border border-brand text-brand hover:bg-brand-light/20">
                Action
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
