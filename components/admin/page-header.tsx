"use client"

import { useRouter } from "@/i18n/routing"
import { MobileMenuButton } from "@/components/admin-shell"

interface Breadcrumb {
  label: string
  href?: string
  /**
   * When true, render this crumb with an emerald accent color.
   * Use on the "pivot" crumb (e.g. "San Francisco" in Discovery › San Francisco › Studio).
   */
  accent?: boolean
}

interface PageHeaderProps {
  title: string
  description?: string
  /**
   * Trail from the sidebar section down to this page, last crumb being the
   * page itself. Linked crumbs are how the user goes "back"; there is no
   * separate back button.
   */
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
  /**
   * Intercepts crumb navigation, e.g. to confirm unsaved changes before
   * leaving. Receives the crumb's href; the caller decides whether to go.
   */
  onNavigate?: (href: string) => void
}

/**
 * The one page header used by every admin page except the dashboard and the
 * leads workspace, which have their own layouts. It always renders inside
 * `ContentWrapper`, so title, breadcrumbs and actions share the same gutter
 * and vertical rhythm across the app:
 *
 *   [menu]  Leads / Discovery / Studio
 *   Studio                                   [actions]
 *   Optional one-line description.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  onNavigate,
}: PageHeaderProps) {
  const router = useRouter()
  const hasCrumbs = Boolean(breadcrumbs && breadcrumbs.length > 0)

  return (
    <header className="mb-8">
      {/* Crumb row also hosts the mobile menu trigger; without crumbs it only
          exists on small screens so desktop spacing stays tight. */}
      <div className={`mb-4 flex items-center gap-2 ${hasCrumbs ? "" : "lg:hidden"}`}>
        <MobileMenuButton />
        {hasCrumbs && (
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2">
            {breadcrumbs!.map((crumb, i) => {
              const isLast = i === breadcrumbs!.length - 1
              const textColor = crumb.accent
                ? "text-emerald-600 dark:text-emerald-400"
                : isLast
                  ? "text-zinc-700 dark:text-zinc-300"
                  : "text-zinc-500"
              return (
                <div key={i} className="flex min-w-0 items-center gap-2">
                  {i > 0 && <span className="text-zinc-400 dark:text-zinc-700">/</span>}
                  {crumb.href && !isLast ? (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate ? onNavigate(crumb.href!) : router.push(crumb.href!)
                      }
                      className={`truncate text-sm transition-colors hover:text-zinc-900 dark:hover:text-white ${textColor}`}
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span
                      className={`truncate text-sm ${textColor}`}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  )}
                </div>
              )
            })}
          </nav>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl text-zinc-900 dark:text-white font-semibold tracking-tight leading-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="text-zinc-600 dark:text-zinc-400 mt-2 max-w-lg text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
