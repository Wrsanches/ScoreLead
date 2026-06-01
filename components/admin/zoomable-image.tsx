"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Maximize2, X } from "lucide-react"

/**
 * A thumbnail that opens its image in a full-screen lightbox on click.
 * Renders a fill-based next/image inside a sized button (pass dimensions +
 * rounding via `thumbClassName`), and a portal-mounted overlay when open.
 */
export function ZoomableImage({
  src,
  alt = "",
  thumbClassName = "",
  sizes,
}: {
  src: string
  alt?: string
  thumbClassName?: string
  sizes?: string
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open image"
        className={`group relative block cursor-zoom-in overflow-hidden ${thumbClassName}`}
      >
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" unoptimized />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/45">
          <Maximize2 className="h-4 w-4 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        </span>
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90 hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <motion.img
                  src={src}
                  alt={alt}
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  onClick={(e) => e.stopPropagation()}
                  className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl shadow-black/60"
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}
