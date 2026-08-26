export async function register() {
  // On a long-lived server (Railway), a deploy or restart kills any
  // discovery job mid-run. Pump the queue on boot and on an interval so
  // stalled jobs are requeued and resume without needing traffic or an
  // external cron. Claims are atomic (SKIP LOCKED), so this is safe even
  // with multiple replicas.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      // The queue transitively imports the pipeline's API clients, some of
      // which throw at import time when their env var is missing. A broken
      // pump must degrade discovery, not crash the whole server at boot.
      const { processDiscoveryQueue } = await import("@/lib/jobs/discovery-queue")

      const pump = () =>
        processDiscoveryQueue().catch((error) => {
          console.error("[instrumentation] queue pump failed:", error)
        })

      pump()

      const g = globalThis as {
        __discoveryPumpTimer?: ReturnType<typeof setInterval>
        __indexNowStartupSubmitted?: boolean
      }
      if (!g.__discoveryPumpTimer) {
        g.__discoveryPumpTimer = setInterval(pump, 5 * 60_000)
        g.__discoveryPumpTimer.unref?.()
      }
    } catch (error) {
      console.error("[instrumentation] queue pump setup failed:", error)
    }

    // Search-engine notification must never delay process readiness. Guard it
    // per process because instrumentation can register more than once in dev.
    const g = globalThis as { __indexNowStartupSubmitted?: boolean }
    if (!g.__indexNowStartupSubmitted) {
      g.__indexNowStartupSubmitted = true
      void import("@/lib/indexnow-startup").then(
        ({ submitIndexableUrlsOnStartup }) => submitIndexableUrlsOnStartup(),
      ).catch((error) => {
        console.error("[instrumentation] IndexNow startup import failed:", error)
      })
    }
  }
}
