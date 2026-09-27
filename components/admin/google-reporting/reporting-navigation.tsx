"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const NavigationContext = createContext<{
  setDirty: (id: string, dirty: boolean) => void
  navigate: (action: () => void) => void
} | null>(null)

/** One guard shared by provider forms, breadcrumbs, and sidebar links. */
export function ReportingNavigationProvider({
  children,
}: {
  children: ReactNode
}) {
  const t = useTranslations("googleReporting")
  const dirty = useRef(new Set<string>())
  const [pending, setPending] = useState<(() => void) | null>(null)
  const setDirty = useCallback((id: string, changed: boolean) => {
    if (changed) dirty.current.add(id)
    else dirty.current.delete(id)
  }, [])
  const navigate = useCallback((action: () => void) => {
    if (dirty.current.size) setPending(() => action)
    else action()
  }, [])
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty.current.size) return
      event.preventDefault()
      event.returnValue = ""
    }
    function followLink(event: MouseEvent) {
      if (
        !dirty.current.size ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return
      const next = new URL(link.href)
      if (
        next.origin === location.origin &&
        next.pathname === location.pathname &&
        next.search === location.search
      )
        return
      event.preventDefault()
      event.stopPropagation()
      navigate(() => window.location.assign(next.href))
    }
    window.addEventListener("beforeunload", beforeUnload)
    document.addEventListener("click", followLink, true)
    return () => {
      window.removeEventListener("beforeunload", beforeUnload)
      document.removeEventListener("click", followLink, true)
    }
  }, [navigate])
  return (
    <NavigationContext.Provider value={{ setDirty, navigate }}>
      {children}
      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unsavedTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("unsavedDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = pending
                dirty.current.clear()
                setPending(null)
                action?.()
              }}
            >
              {t("discard")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NavigationContext.Provider>
  )
}

export function useReportingNavigation() {
  const context = useContext(NavigationContext)
  if (!context) throw new Error("Reporting navigation provider is required")
  return context
}
