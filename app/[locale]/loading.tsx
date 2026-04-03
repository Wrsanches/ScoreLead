import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#09090B] overflow-hidden">

      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Skeleton className="h-6 w-6 bg-zinc-800" />
        <div className="hidden md:flex items-center gap-8">
          <Skeleton className="h-4 w-16 bg-zinc-800" />
          <Skeleton className="h-4 w-16 bg-zinc-800" />
          <Skeleton className="h-4 w-16 bg-zinc-800" />
          <Skeleton className="h-4 w-16 bg-zinc-800" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-16 bg-zinc-800" />
          <Skeleton className="h-9 w-24 rounded-lg bg-zinc-800" />
        </div>
      </div>


      <div className="pt-28 flex flex-col items-center px-6 mt-16">
        <div className="w-full max-w-4xl space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-12 w-3/4 bg-zinc-800/60" />
            <Skeleton className="h-12 w-1/2 bg-zinc-800/60" />
          </div>
          <Skeleton className="h-5 w-2/3 bg-zinc-800/40" />
          <div className="flex items-center gap-6 mt-8">
            <Skeleton className="h-10 w-32 rounded-lg bg-zinc-800/60" />
            <Skeleton className="h-5 w-28 bg-zinc-800/40" />
          </div>
        </div>
      </div>


      <div className="flex justify-center mt-20 px-6">
        <Skeleton className="w-full max-w-5xl h-80 rounded-xl bg-zinc-800/30 border border-zinc-800/50" />
      </div>
    </div>
  )
}
