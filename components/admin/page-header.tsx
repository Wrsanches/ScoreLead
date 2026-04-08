"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { MobileMenuButton } from "@/components/admin-shell"

interface Breadcrumb {
  label: string
  href?: string
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

export function PageHeader(props: PageHeaderProps) {
  const router = useRouter()
  const { variant = "bar", title, breadcrumbs, actions } = props

  if (variant === "hero") {
    const { description } = props as PageHeaderHeroProps
    return (
      <div className="mb-8">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            {breadcrumbs.map((crumb, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-zinc-700">/</span>}
                {crumb.href ? (
                  <button
                    onClick={() => router.push(crumb.href!)}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-sm text-zinc-500">{crumb.label}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl text-white font-medium tracking-tight leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-zinc-400 mt-3 max-w-lg leading-relaxed">{description}</p>
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
    <div className="px-6 h-14 flex items-center justify-between border-b border-zinc-800/70 shrink-0">
      <div className="flex items-center gap-3">
        <MobileMenuButton />
        {barProps.backHref && (
          <>
            <button
              onClick={() => router.push(barProps.backHref!)}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {breadcrumbs?.[0]?.label && (
                <span className="hidden sm:inline">{breadcrumbs[0].label}</span>
              )}
            </button>
            <span className="text-zinc-700">/</span>
          </>
        )}
        <span className="text-white text-sm font-medium truncate max-w-[250px]">{title}</span>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
