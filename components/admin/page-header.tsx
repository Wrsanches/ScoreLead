"use client"

import { ArrowLeft } from "lucide-react"
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

interface PageHeaderBarProps {
  variant?: "bar"
  title: string
  breadcrumbs?: Breadcrumb[]
  backHref?: string
  actions?: React.ReactNode
}

interface PageHeaderHeroProps {
  variant: "hero"
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
}

type PageHeaderProps = PageHeaderBarProps | PageHeaderHeroProps

function BreadcrumbTrail({
  breadcrumbs,
  className = "",
}: {
  breadcrumbs: Breadcrumb[]
  className?: string
}) {
  const router = useRouter()
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {breadcrumbs.map((crumb, i) => {
        const textColor = crumb.accent
          ? "text-emerald-400"
          : i === breadcrumbs.length - 1
            ? "text-zinc-300"
            : "text-zinc-500"
        return (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-zinc-700">/</span>}
            {crumb.href ? (
              <button
                onClick={() => router.push(crumb.href!)}
                className={`text-sm transition-colors hover:text-white ${textColor}`}
              >
                {crumb.label}
              </button>
            ) : (
              <span className={`text-sm ${textColor}`}>{crumb.label}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function PageHeader(props: PageHeaderProps) {
  const router = useRouter()
  const { variant = "bar", title, breadcrumbs, actions } = props

  if (variant === "hero") {
    const { description } = props as PageHeaderHeroProps
    return (
      <div className="mb-8">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <BreadcrumbTrail breadcrumbs={breadcrumbs} className="mb-4" />
        )}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl text-white font-semibold tracking-tight leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-zinc-400 mt-2 max-w-lg text-sm leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </div>
    )
  }

  // Bar variant
  const barProps = props as PageHeaderBarProps
  return (
    <div className="px-6 h-14 flex items-center justify-between border-b border-zinc-800/60 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <MobileMenuButton />
        {barProps.backHref && (
          <>
            <button
              onClick={() => router.push(barProps.backHref!)}
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {breadcrumbs?.[0]?.label && (
                <span className="hidden sm:inline">{breadcrumbs[0].label}</span>
              )}
            </button>
            <span className="text-zinc-700">/</span>
          </>
        )}
        <h1 className="text-white text-sm font-semibold tracking-tight truncate max-w-[260px]">
          {title}
        </h1>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
