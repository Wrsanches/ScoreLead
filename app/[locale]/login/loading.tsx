import { Skeleton } from "@/components/ui/skeleton"

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex bg-zinc-950 lg:justify-center">
      {/* Branding side */}
      <div className="hidden lg:flex lg:w-[500px] lg:shrink-0 items-center justify-end">
        <div className="max-w-md px-12 w-full space-y-6">
          <div className="flex items-center gap-3 mb-10">
            <Skeleton className="w-10 h-10 rounded-lg bg-zinc-800" />
            <Skeleton className="h-6 w-32 bg-zinc-800" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-8 w-full bg-zinc-800/60" />
            <Skeleton className="h-8 w-3/4 bg-zinc-800/60" />
          </div>
          <Skeleton className="h-4 w-full bg-zinc-800/40" />
          <Skeleton className="h-4 w-2/3 bg-zinc-800/40" />
          <div className="flex items-center gap-3 mt-4">
            <div className="flex -space-x-2.5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-950" />
              ))}
            </div>
            <Skeleton className="h-4 w-28 bg-zinc-800/40" />
          </div>
          <div className="mt-12 pt-8 border-t border-zinc-800/60">
            <div className="grid grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-6 w-12 bg-zinc-800/60" />
                  <Skeleton className="h-3 w-16 bg-zinc-800/40" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 lg:w-[500px] lg:flex-none flex items-center justify-center px-6 py-12 lg:justify-start lg:pl-20">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <Skeleton className="w-8 h-8 rounded-lg bg-zinc-800" />
            <Skeleton className="h-5 w-24 mt-2 bg-zinc-800" />
          </div>
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-8 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40 bg-zinc-800/60" />
              <Skeleton className="h-4 w-56 bg-zinc-800/40" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg bg-zinc-800/40" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-px flex-1 bg-zinc-800/60" />
              <Skeleton className="h-3 w-20 bg-zinc-800/40" />
              <Skeleton className="h-px flex-1 bg-zinc-800/60" />
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-12 bg-zinc-800/40" />
                <Skeleton className="h-10 w-full rounded-lg bg-zinc-800/30" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-16 bg-zinc-800/40" />
                <Skeleton className="h-10 w-full rounded-lg bg-zinc-800/30" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg bg-zinc-800/60" />
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <Skeleton className="h-4 w-48 bg-zinc-800/40" />
          </div>
        </div>
      </div>
    </div>
  )
}
