import { ScoreLeadLogo } from "./scorelead-logo"

export function WaitlistFooter() {
  return (
    <footer className="border-t border-zinc-800/50 py-8 px-6" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ScoreLeadLogo className="w-4 h-4 text-white" />
          <span className="text-zinc-500 text-sm">ScoreLead</span>
        </div>
        <p className="text-zinc-600 text-xs">
          &copy; {new Date().getFullYear()} ScoreLead. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
