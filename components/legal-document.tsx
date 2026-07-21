import { Mail } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { WaitlistFooter } from "@/components/waitlist-footer"
import { Link } from "@/i18n/routing"
import type { LegalDocumentContent } from "@/lib/legal/types"

const EMAIL = "hello@scorelead.io"

export function LegalDocument({ content }: { content: LegalDocumentContent }) {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100">
      <Navbar />

      <main id="main" className="pt-16">
        <section className="border-b border-zinc-800/70">
          <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
              {content.eyebrow}
            </p>
            <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
              {content.title}
            </h1>
            <p className="mt-6 max-w-3xl text-pretty text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
              {content.description}
            </p>
            <p className="mt-7 text-sm text-zinc-500">
              {content.updatedLabel} <time dateTime="2026-07-20">{content.updatedDate}</time>
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-20 lg:py-20">
          <aside aria-label={content.tocLabel} className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {content.tocLabel}
            </h2>
            <nav className="mt-5" aria-label={content.tocLabel}>
              <ol className="space-y-3 border-l border-zinc-800 pl-4">
                {content.sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block rounded-sm text-sm leading-5 text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                    >
                      <span className="mr-2 font-mono text-[11px] text-zinc-700">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="min-w-0 max-w-[75ch]">
            {content.sections.map((section, index) => (
              <section
                id={section.id}
                key={section.id}
                className={`scroll-mt-24 border-b border-zinc-800/70 pb-12 last:border-b-0 ${
                  index > 0 ? "pt-12" : ""
                }`}
              >
                <div className="flex gap-4">
                  <span aria-hidden="true" className="pt-1 font-mono text-xs text-emerald-500/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
                    {section.title}
                  </h2>
                </div>

                <div className="mt-6 space-y-5 text-[15px] leading-7 text-zinc-400 sm:text-base sm:leading-7">
                  {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

                  {section.bullets && (
                    <ul className="space-y-3 pl-5 marker:text-emerald-500">
                      {section.bullets.map((item) => (
                        <li key={item} className="pl-1">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.steps && (
                    <ol className="space-y-4 pl-6 marker:font-mono marker:text-emerald-500">
                      {section.steps.map((step) => (
                        <li key={step} className="pl-2">
                          {step}
                        </li>
                      ))}
                    </ol>
                  )}

                  {section.note && (
                    <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-zinc-300">
                      {section.note}
                    </p>
                  )}

                  {section.links && (
                    <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                      {section.links.map((link) =>
                        link.external ? (
                          <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-sm text-sm font-medium text-emerald-400 underline decoration-emerald-500/30 underline-offset-4 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="rounded-sm text-sm font-medium text-emerald-400 underline decoration-emerald-500/30 underline-offset-4 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                          >
                            {link.label}
                          </Link>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </section>
            ))}

            <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900">
                  <Mail aria-hidden="true" className="size-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{content.contactLabel}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{content.contactDescription}</p>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="mt-3 inline-block rounded-sm text-sm font-medium text-emerald-400 underline decoration-emerald-500/30 underline-offset-4 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                  >
                    {EMAIL}
                  </a>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>

      <WaitlistFooter />
    </div>
  )
}
