"use client"

import { ScoreLeadLogo } from "./scorelead-logo"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-[#09090B]/80 backdrop-blur-md">
      <div className="w-full flex justify-center px-6 py-4">
        <div className="w-full max-w-4xl flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-2">
            <ScoreLeadLogo className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">ScoreLead</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#customers" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Results
            </a>
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="#ai" className="text-sm text-zinc-400 hover:text-white transition-colors">
              AI
            </a>
            <a href="#pipeline" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Pipeline
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#waitlist"
              className="text-sm text-white bg-zinc-800 hover:bg-zinc-700 px-3.5 py-1.5 rounded-md border border-zinc-700 transition-colors"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
