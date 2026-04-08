import { Loader2 } from "lucide-react"

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
    </div>
  )
}
