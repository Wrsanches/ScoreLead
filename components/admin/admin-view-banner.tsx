import { Eye, ShieldCheck } from "lucide-react"

export function AdminViewBanner({
  businessName,
  ownerName,
  ownerEmail,
}: {
  businessName: string | null
  ownerName: string
  ownerEmail: string
}) {
  return (
    <div className="shrink-0 border-b border-amber-300/70 bg-amber-50 px-4 py-2 text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
      <div className="mx-auto flex max-w-7xl items-center gap-3 text-xs sm:text-sm">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
          <Eye className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 truncate">
          Viewing{" "}
          <span className="font-semibold">
            {businessName || "Unnamed organization"}
          </span>{" "}
          as platform admin · {ownerName} ({ownerEmail})
        </p>
        <span className="hidden shrink-0 items-center gap-1.5 font-medium sm:flex">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Read-only
        </span>
      </div>
    </div>
  )
}
