"use client"

import { useTranslations } from "next-intl"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("error")

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: "#09090B" }}
    >
      <div
        className="absolute w-2 h-2 rounded-full bg-emerald-500/30"
        style={{ top: "20%", left: "25%", animation: "not-found-particle1 8s ease-in-out infinite" }}
      />
      <div
        className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/20"
        style={{ top: "60%", right: "20%", animation: "not-found-particle2 10s ease-in-out infinite" }}
      />
      <div
        className="absolute w-1 h-1 rounded-full bg-emerald-300/25"
        style={{ top: "40%", left: "60%", animation: "not-found-particle3 7s ease-in-out infinite" }}
      />
      <div
        className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500/15"
        style={{ bottom: "30%", left: "15%", animation: "not-found-particle2 9s ease-in-out infinite 2s" }}
      />
      <div
        className="absolute w-1 h-1 rounded-full bg-zinc-500/30"
        style={{ top: "15%", right: "35%", animation: "not-found-particle1 11s ease-in-out infinite 1s" }}
      />

      <div className="relative mb-6 select-none">
        <h1
          className="glitch-404 relative text-[10rem] sm:text-[14rem] font-black leading-none tracking-tighter bg-clip-text text-transparent"
          style={{
            backgroundImage: "linear-gradient(135deg, #ffffff 0%, #10b981 50%, #a1a1aa 100%)",
            backgroundSize: "200% 200%",
            animation: "not-found-glitch-base 3s ease-in-out infinite, not-found-gradient-shift 6s ease infinite",
          }}
        >
          500
        </h1>
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded"
          aria-hidden="true"
        >
          <div
            className="absolute left-0 w-full h-[2px] bg-emerald-500/10"
            style={{ animation: "not-found-scanline 4s linear infinite" }}
          />
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">
        {t("title")}
      </h2>
      <p className="text-sm text-zinc-500 mb-10 text-center max-w-sm leading-relaxed">
        {t("description")}
      </p>

      <button
        onClick={reset}
        className="group relative px-6 py-3 text-sm font-medium text-white rounded-lg bg-zinc-800/80 border border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all duration-300"
      >
        <span
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "radial-gradient(circle at center, rgba(16,185,129,0.15) 0%, transparent 70%)",
          }}
        />
        <span className="relative">{t("retry")}</span>
      </button>

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)",
          animation: "not-found-pulse 5s ease-in-out infinite",
        }}
        aria-hidden="true"
      />
    </div>
  )
}
