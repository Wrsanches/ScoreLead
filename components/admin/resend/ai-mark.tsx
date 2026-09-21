"use client"

import { AiOrb } from "@/components/ai-orb"

const ORB_BASE_PX = 80 // AiOrb's "sm" size

/**
 * The onboarding orb, miniaturized for buttons. The orb is rendered at its
 * native size and scaled with a transform so its blurs, glow, and wave layers
 * shrink proportionally instead of smearing at a tiny box size.
 */
export function AiMark({ size = 14, active = false, className = "" }: { size?: number; active?: boolean; className?: string }) {
  const scale = size / ORB_BASE_PX
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 align-middle ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        className="absolute left-0 top-0 block"
        style={{ width: ORB_BASE_PX, height: ORB_BASE_PX, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <AiOrb size="sm" state={active ? "processing" : "active"} />
      </span>
    </span>
  )
}
