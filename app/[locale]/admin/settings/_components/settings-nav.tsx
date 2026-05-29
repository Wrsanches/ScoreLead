"use client"

import { useTranslations } from "next-intl"
import {
  User,
  SlidersHorizontal,
  Lock,
  CreditCard,
  Bell,
  AlertTriangle,
} from "lucide-react"

export type SettingsSectionId =
  | "profile"
  | "preferences"
  | "security"
  | "billing"
  | "notifications"
  | "danger"

const items: { id: SettingsSectionId; icon: React.ElementType; key: string }[] = [
  { id: "profile", icon: User, key: "profile" },
  { id: "preferences", icon: SlidersHorizontal, key: "preferences" },
  { id: "security", icon: Lock, key: "security" },
  { id: "notifications", icon: Bell, key: "notifications" },
  { id: "billing", icon: CreditCard, key: "billing" },
  { id: "danger", icon: AlertTriangle, key: "dangerZone" },
]

export function SettingsNav({
  active,
  onChange,
}: {
  active: SettingsSectionId
  onChange: (id: SettingsSectionId) => void
}) {
  const t = useTranslations("settings")

  return (
    <nav className="md:w-56 md:shrink-0 md:sticky md:top-4 md:self-start">
      <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible -mx-2 md:mx-0 px-2 md:px-0 pb-1 md:pb-0">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          const isDanger = item.id === "danger"
          return (
            <li key={item.id} className="shrink-0 md:shrink">
              <button
                type="button"
                onClick={() => onChange(item.id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors text-left whitespace-nowrap ${
                  isActive
                    ? isDanger
                      ? "bg-red-500/10 text-red-700 dark:text-red-300"
                      : "bg-zinc-200/70 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100"
                    : isDanger
                      ? "text-red-600/70 dark:text-red-400/70 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/5"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t(item.key)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
