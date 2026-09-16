import type { Metadata } from "next"
import Link from "next/link"
import { Geist } from "next/font/google"
import { ArrowRight, BookOpen, ChevronRight, CreditCard, Radar } from "lucide-react"
import { ScoreLeadLogo } from "@/components/scorelead-logo"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

// This is the app's single 404 page (the localized [locale]/[...rest] catch-all
// was removed because, with an async locale layout, its notFound() ran after
// streaming had already committed a 200 - a soft 404. Letting unknown routes
// fall through to this native not-found returns a real 404 status.)
export const metadata: Metadata = {
  title: "Page not found | ScoreLead",
  robots: { index: false, follow: false },
}

const destinations = [
  {
    href: "/features/ai-lead-discovery",
    icon: Radar,
    title: "Explore features",
    description: "See how discovery, scoring and outreach fit together.",
  },
  {
    href: "/pricing",
    icon: CreditCard,
    title: "See pricing",
    description: "Start free, then pick the plan that clears your next limit.",
  },
  {
    href: "/blog",
    icon: BookOpen,
    title: "Read the blog",
    description: "Playbooks on finding and qualifying B2B leads.",
  },
]

// Type scale mirrors the marketing hero so this page feels like the same site.
const headingStyle = {
  letterSpacing: "-0.0325em",
  fontVariationSettings: '"opsz" 28',
  fontWeight: 538,
  lineHeight: 1.1,
} as const

export default function NotFound() {
  return (
    <html lang="en" className={`dark ${geist.variable}`}>
      <body
        className={`${geist.className} antialiased text-zinc-50`}
        style={{
          backgroundColor: "#09090b",
          backgroundImage: `
            radial-gradient(ellipse 50% 40% at 8% 0%, rgba(16,185,129,0.16), transparent 62%),
            radial-gradient(ellipse 45% 40% at 100% 100%, rgba(6,182,212,0.1), transparent 60%),
            radial-gradient(ellipse 35% 30% at 70% 20%, rgba(99,102,241,0.08), transparent 60%)
          `,
        }}
      >
        <div className="flex min-h-screen flex-col">
          {/* Floating glass bar, same shape as the marketing navbar */}
          <header className="fixed inset-x-3 top-3 z-50 flex justify-center sm:inset-x-6">
            <div className="glass-strong flex h-14 w-full max-w-4xl items-center justify-between rounded-2xl px-4 sm:px-5">
              <Link href="/" className="flex items-center gap-2">
                <ScoreLeadLogo className="h-5 w-5 text-white" />
                <span className="font-semibold text-white">ScoreLead</span>
              </Link>
              <Link
                href="/"
                className="text-sm text-zinc-400 transition-colors hover:text-white"
              >
                Back to home
              </Link>
            </div>
          </header>

          <main className="flex flex-1 flex-col justify-center px-6 pt-32 pb-24 sm:pt-40">
            <div className="mx-auto w-full max-w-4xl">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-zinc-500" aria-hidden="true" />
                <p className="text-sm text-zinc-400">Error 404</p>
              </div>

              <h1
                className="max-w-3xl text-3xl text-white sm:text-4xl md:text-5xl lg:text-[56px]"
                style={headingStyle}
              >
                We couldn&apos;t find that page.
              </h1>
              <p className="mt-4 max-w-lg text-base text-zinc-400 sm:mt-6 sm:text-lg">
                The link may be out of date, or the page may have moved. Head back to the
                homepage, or pick one of the paths below.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-6 sm:mt-8">
                <Link
                  href="/"
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-[0_8px_24px_-12px_rgba(255,255,255,0.5)] transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                >
                  Back to home
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                >
                  Contact support
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-16 grid gap-4 sm:mt-20 md:grid-cols-3">
                {destinations.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="glass-card group flex flex-col rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:ring-1 hover:ring-white/[0.14] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                  >
                    <span className="glass-pill flex h-10 w-10 items-center justify-center rounded-xl text-zinc-200">
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="mt-6 flex flex-1 items-end justify-between gap-4">
                      <div>
                        <h2 className="text-base font-medium text-white md:text-lg">{item.title}</h2>
                        <p className="mt-1.5 text-sm leading-6 text-zinc-500">{item.description}</p>
                      </div>
                      <ChevronRight
                        className="mb-1 h-5 w-5 shrink-0 text-zinc-600 transition-all group-hover:translate-x-1 group-hover:text-zinc-300"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
