"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Radar,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  User,
  LogOut,
  Settings,
  Building2,
  Check,
  Plus,
} from "lucide-react"
import Image from "next/image"
import { ScoreLeadLogo } from "@/components/scorelead-logo"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Link } from "@/i18n/routing"
import { useSearch } from "./search-overlay"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Business = {
  id: string
  name: string | null
  logo: string | null
  field: string | null
  website: string | null
}

function getBusinessLogo(b: Business | undefined): string | null {
  if (!b) return null
  if (b.logo) return b.logo
  if (b.website) {
    try {
      const domain = new URL(b.website).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    } catch {
      return null
    }
  }
  return null
}

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const t = useTranslations("dashboard")
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = authClient.useSession()

  const { open: openSearch } = useSearch()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)

  const userName = session?.user?.name || ""
  const userEmail = session?.user?.email || ""
  const userImage = session?.user?.image
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  useEffect(() => {
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data: Business[]) => {
        setBusinesses(data)
        if (data.length > 0) {
          setSelectedBusinessId((prev) => prev || data[0].id)
        }
      })
      .catch(() => {})
  }, [])

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.id === selectedBusinessId) || businesses[0],
    [businesses, selectedBusinessId],
  )

  // Determine active nav item from pathname
  const isActive = (path: string) => {
    if (path === "/admin") return pathname.endsWith("/admin")
    return pathname.includes(path)
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-800 flex flex-col shrink-0 transition-transform duration-200 ease-out lg:relative lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-3 border-b border-zinc-800 flex items-center justify-center relative">
        <div className="flex items-center gap-2.5 py-1.5">
          <ScoreLeadLogo className="w-6 h-6 text-white" />
          <span className="text-white font-semibold text-[15px] tracking-tight">ScoreLead</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden absolute right-3 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-zinc-800 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600">
              {getBusinessLogo(selectedBusiness) ? (
                <Image src={getBusinessLogo(selectedBusiness)!} alt="" width={24} height={24} className="w-6 h-6 rounded-md object-cover shrink-0" unoptimized />
              ) : (
                <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                </div>
              )}
              <span className="flex-1 text-sm text-zinc-200 text-left truncate">
                {selectedBusiness?.name || t("noBusiness")}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors duration-200 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="start"
            sideOffset={4}
            className="w-[216px] bg-zinc-900 border-zinc-700/60 shadow-xl shadow-black/40"
          >
            <DropdownMenuLabel className="px-3 py-1.5 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
              {t("businesses")}
            </DropdownMenuLabel>
            {businesses.map((b) => (
              <DropdownMenuItem
                key={b.id}
                onClick={() => setSelectedBusinessId(b.id)}
                className="px-3 py-2 text-zinc-400 focus:text-zinc-200 focus:bg-zinc-800/60 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 w-full">
                  {getBusinessLogo(b) ? (
                    <Image src={getBusinessLogo(b)!} alt="" width={24} height={24} className="w-6 h-6 rounded-md object-cover shrink-0" unoptimized />
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{b.name || "Unnamed"}</p>
                    {b.field && <p className="text-xs text-zinc-500 truncate">{b.field}</p>}
                  </div>
                  {b.id === selectedBusinessId && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={() => router.push("/onboarding?new=true")}
              className="px-3 py-2 text-zinc-400 focus:text-zinc-200 focus:bg-zinc-800/60 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t("addBusiness")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={openSearch}
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-zinc-800/40 rounded-lg text-zinc-500 text-sm cursor-pointer hover:bg-zinc-800/70 border border-zinc-800 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-700 transition-all duration-150"
        >
          <Search className="w-4 h-4" />
          <span>{t("searchLeads")}</span>
          <span className="ml-auto text-xs bg-zinc-700/60 text-zinc-400 px-1.5 py-0.5 rounded-md font-medium">&#8984;K</span>
        </button>
      </div>

      <div className="px-3 space-y-0.5">
        <NavItem icon={LayoutDashboard} label={t("dashboard")} href="/admin" active={isActive("/admin")} />
        <NavItem icon={Users} label={t("allLeads")} href="/admin/leads" active={isActive("/admin/leads")} />
      </div>

      <div className="mt-8 px-3">
        <div className="px-2.5 py-1 mb-2 text-xs text-zinc-500 font-semibold uppercase tracking-widest">
          {t("discovery")}
        </div>
        <div className="space-y-0.5">
          <NavItem icon={Radar} label={t("discoveryJobs")} href="/admin/discovery-jobs" active={isActive("/admin/discovery-jobs")} />
          <NavItem icon={Bookmark} label={t("savedSearches")} href="/admin/saved-searches" active={isActive("/admin/saved-searches")} />
        </div>
      </div>

      <div className="mt-auto p-3 border-t border-zinc-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600">
              {userImage ? (
                <Image src={userImage} alt="" width={28} height={28} className="w-7 h-7 rounded-full shrink-0 ring-1 ring-zinc-600/50 group-hover:ring-zinc-500/50 transition-all duration-200 object-cover" unoptimized />
              ) : (
                <div className="w-7 h-7 rounded-full bg-linear-to-br from-zinc-600 to-zinc-700 flex items-center justify-center shrink-0 ring-1 ring-zinc-600/50 group-hover:ring-zinc-500/50 transition-all duration-200">
                  {userInitials ? (
                    <span className="text-xs font-medium text-zinc-300">{userInitials}</span>
                  ) : (
                    <User className="w-3.5 h-3.5 text-zinc-300" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm text-zinc-200 truncate">{userName}</p>
                <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors duration-200" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-[216px] bg-zinc-900 border-zinc-700/60 shadow-xl shadow-black/40"
          >
            <DropdownMenuLabel className="px-3 py-2.5 font-normal">
              <div className="flex items-center gap-2.5">
                {userImage ? (
                  <Image src={userImage} alt="" width={32} height={32} className="w-8 h-8 rounded-full shrink-0 ring-1 ring-zinc-600/50 object-cover" unoptimized />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-zinc-600 to-zinc-700 flex items-center justify-center shrink-0 ring-1 ring-zinc-600/50">
                    {userInitials ? (
                      <span className="text-xs font-medium text-zinc-300">{userInitials}</span>
                    ) : (
                      <User className="w-4 h-4 text-zinc-300" />
                    )}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{userName}</p>
                  <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="px-3 py-2 text-zinc-400 focus:text-zinc-200 focus:bg-zinc-800/60 cursor-pointer">
              <Settings className="w-4 h-4" />
              {t("settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={async () => {
                await authClient.signOut()
                router.push("/login")
              }}
              className="px-3 py-2 text-red-400/80 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}

function NavItem({
  icon: Icon,
  label,
  badge,
  active,
  href,
  color,
}: {
  icon: React.ElementType
  label: string
  badge?: number
  active?: boolean
  href?: string
  color?: string
}) {
  const content = (
    <>
      <Icon className={`w-4 h-4 shrink-0 ${color || ""}`} />
      <span className="flex-1 text-sm">{label}</span>
      {badge !== undefined && (
        <span className="text-zinc-500 text-xs tabular-nums">
          {badge}
        </span>
      )}
    </>
  )

  const className = `flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600 ${
    active
      ? "bg-zinc-800/80 text-white"
      : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
  }`

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <div tabIndex={0} className={className}>
      {content}
    </div>
  )
}
