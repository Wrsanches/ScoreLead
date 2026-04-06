"use client"

import { motion } from "framer-motion"

export type OrbState = "idle" | "active" | "processing"

interface AiOrbProps {
  state?: OrbState
  className?: string
  size?: "sm" | "md" | "lg"
}

const SIZES = { sm: "w-20 h-20", md: "w-28 h-28", lg: "w-40 h-40" }

const SPEED: Record<OrbState, {
  wave: number; pulse: number; glow: number; particle: number
}> = {
  idle:       { wave: 10, pulse: 4,   glow: 6,   particle: 8 },
  active:     { wave: 5,  pulse: 2,   glow: 3,   particle: 4 },
  processing: { wave: 2.5, pulse: 1.2, glow: 1.8, particle: 2.5 },
}

/**
 * A filled wave layer - creates the 3D depth illusion with gradient fills
 */
function WaveLayer({
  rotateX,
  rotateY,
  gradient,
  blur,
  inset,
  speed,
  state,
  delay = 0,
}: {
  rotateX: number
  rotateY: number
  gradient: string
  blur: number
  inset: string
  speed: number
  state: OrbState
  delay?: number
}) {
  const wobble = state === "processing" ? 20 : state === "active" ? 10 : 5
  const scaleAmplitude = state === "processing" ? 0.12 : state === "active" ? 0.06 : 0.03

  return (
    <motion.div
      className={`absolute ${inset}`}
      style={{
        transformStyle: "preserve-3d",
        perspective: "500px",
      }}
    >
      <motion.div
        className="w-full h-full rounded-full"
        style={{
          background: gradient,
          filter: `blur(${blur}px)`,
          transformOrigin: "center center",
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          mixBlendMode: "screen",
        }}
        animate={{
          rotateX: [rotateX, rotateX + wobble, rotateX - wobble * 0.6, rotateX],
          rotateY: [rotateY, rotateY - wobble * 0.8, rotateY + wobble * 0.4, rotateY],
          scale: [1, 1 + scaleAmplitude, 1 - scaleAmplitude * 0.5, 1],
          opacity: state === "processing"
            ? [0.6, 1, 0.7, 0.9, 0.6]
            : [0.4, 0.7, 0.45, 0.65, 0.4],
        }}
        transition={{
          duration: speed,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  )
}

export function AiOrb({ state = "idle", className = "", size = "lg" }: AiOrbProps) {
  const c = SPEED[state]

  return (
    <div
      className={`relative ${SIZES[size]} ${className}`}
      style={{ perspective: "600px", transformStyle: "preserve-3d" }}
      aria-hidden="true"
    >
      {/* ---- Ambient glow ---- */}
      <motion.div
        className="absolute inset-[-60%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(63,63,70,0.04) 40%, transparent 65%)",
          filter: "blur(40px)",
        }}
        animate={{
          scale: state === "processing" ? [1, 1.35, 1] : [1, 1.15, 1],
          opacity: state === "processing" ? [0.5, 0.9, 0.5] : [0.3, 0.6, 0.3],
        }}
        transition={{ duration: c.glow, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ---- Core sphere (dark base) ---- */}
      <motion.div
        className="absolute inset-[8%] rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 35%, #064e3b, #052e16 40%, #09090b 80%)",
        }}
        animate={{
          scale: state === "processing" ? [1, 1.06, 0.96, 1] : [1, 1.02, 1],
        }}
        transition={{ duration: c.pulse, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ---- 3D Wave layers (filled gradients at different angles) ---- */}
      <WaveLayer
        rotateX={20} rotateY={-15}
        gradient="linear-gradient(135deg, rgba(52,211,153,0.5), rgba(6,78,59,0.4), transparent 60%)"
        blur={2} inset="inset-[6%]" speed={c.wave} state={state}
      />
      <WaveLayer
        rotateX={-30} rotateY={25}
        gradient="linear-gradient(250deg, rgba(161,161,170,0.2), rgba(82,82,91,0.15), transparent 55%)"
        blur={3} inset="inset-[8%]" speed={c.wave * 1.15} state={state} delay={0.3}
      />
      <WaveLayer
        rotateX={45} rotateY={-40}
        gradient="linear-gradient(60deg, rgba(110,231,183,0.35), transparent 45%, rgba(74,222,128,0.2))"
        blur={2} inset="inset-[7%]" speed={c.wave * 0.9} state={state} delay={0.6}
      />
      <WaveLayer
        rotateX={-15} rotateY={50}
        gradient="linear-gradient(310deg, rgba(16,185,129,0.45), rgba(6,78,59,0.3), transparent 50%)"
        blur={2} inset="inset-[10%]" speed={c.wave * 1.25} state={state} delay={0.15}
      />
      <WaveLayer
        rotateX={60} rotateY={10}
        gradient="linear-gradient(180deg, rgba(212,212,216,0.12), rgba(113,113,122,0.08), transparent 50%)"
        blur={3} inset="inset-[9%]" speed={c.wave * 1.4} state={state} delay={0.45}
      />
      <WaveLayer
        rotateX={-50} rotateY={-30}
        gradient="linear-gradient(30deg, rgba(52,211,153,0.3), transparent 40%)"
        blur={1} inset="inset-[5%]" speed={c.wave * 0.8} state={state} delay={0.8}
      />
      <WaveLayer
        rotateX={35} rotateY={65}
        gradient="linear-gradient(200deg, rgba(74,222,128,0.25), rgba(34,197,94,0.15), transparent 55%)"
        blur={2} inset="inset-[11%]" speed={c.wave * 1.1} state={state} delay={0.5}
      />

      {/* ---- Inner glow core ---- */}
      <motion.div
        className="absolute inset-[25%] rounded-full"
        style={{
          background: "radial-gradient(circle at 40% 40%, rgba(187,247,208,0.5), rgba(110,231,183,0.25), transparent 70%)",
          filter: "blur(4px)",
          mixBlendMode: "screen",
        }}
        animate={{
          opacity: state === "processing" ? [0.4, 1, 0.4] : [0.25, 0.55, 0.25],
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{ duration: c.pulse * 0.8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ---- Specular highlight ---- */}
      <motion.div
        className="absolute inset-[15%] rounded-full"
        style={{
          background: "linear-gradient(170deg, rgba(255,255,255,0.1) 0%, transparent 35%)",
          filter: "blur(2px)",
        }}
        animate={{
          opacity: [0.4, 0.12, 0.4],
          y: [-1, 2, -1],
        }}
        transition={{ duration: c.pulse * 1.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ---- Processing rings ---- */}
      {state === "processing" && (
        <>
          <motion.div
            className="absolute inset-[-8%] rounded-full"
            style={{
              border: "1.5px solid transparent",
              borderTopColor: "rgba(52,211,153,0.35)",
              borderRightColor: "rgba(161,161,170,0.15)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-[-14%] rounded-full"
            style={{
              border: "1px solid transparent",
              borderBottomColor: "rgba(16,185,129,0.2)",
              borderLeftColor: "rgba(113,113,122,0.1)",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
          />
        </>
      )}

      {/* ---- Active ring ---- */}
      {state === "active" && (
        <motion.div
          className="absolute inset-[-5%] rounded-full border border-emerald-400/12"
          animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  )
}
