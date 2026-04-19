export default function OnboardingLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 py-12 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-emerald-500/3 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse" />
            <div className="h-5 w-24 rounded-md bg-zinc-800 animate-pulse" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 sm:p-10 shadow-2xl shadow-black/20">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-zinc-800/60 animate-pulse" />
          </div>

          <div className="flex flex-col items-center mb-8 space-y-2">
            <div className="h-7 w-56 rounded-lg bg-zinc-800/60 animate-pulse" />
            <div className="h-4 w-72 rounded-md bg-zinc-800/40 animate-pulse" />
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <div className="h-4 w-20 rounded-md bg-zinc-800/40 animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-zinc-800/30 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-24 rounded-md bg-zinc-800/40 animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-zinc-800/30 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <div className="h-10 w-20 rounded-lg bg-zinc-800/30 animate-pulse" />
            <div className="h-10 w-28 rounded-lg bg-zinc-800/50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
