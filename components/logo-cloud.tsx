"use client"

import { motion } from "framer-motion"
import { ChevronRight, Quote, ArrowUpRight } from "lucide-react"
import Image from "next/image"

export function LogoCloud() {
  return (
    <div id="customers" className="relative z-20 py-40" style={{ backgroundColor: "#09090B" }}>
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "20%",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)",
        }}
      />
      <div className="w-full flex justify-center px-6">
        <div className="w-full max-w-5xl">
          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-400 text-sm">Customer story</span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-white max-w-3xl mb-16"
            style={{
              letterSpacing: "-0.0325em",
              fontVariationSettings: '"opsz" 28',
              fontWeight: 538,
              lineHeight: 1.1,
            }}
          >
            See how Ceramik grew their pipeline 10x
          </motion.h2>

          {/* Testimonial card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left - quote */}
              <div className="border-t border-r border-b border-zinc-800/60 pt-12 pr-12 pb-16">
                <Quote className="w-8 h-8 text-emerald-500/30 mb-6" />
                <p className="text-lg md:text-xl text-zinc-200 leading-relaxed mb-8">
                  ScoreLead transformed how we find and reach pottery studios. We went from manually searching for leads
                  to discovering hundreds of qualified prospects in minutes. Our pipeline grew 10x in the first month.
                </p>

                <div className="flex items-center gap-4">
                  <Image
                    src="/images/ceramik-logo.png"
                    alt="Ceramik"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <div>
                    <p className="text-white font-medium">Ceramik</p>
                    <p className="text-zinc-500 text-sm">All-in-one app for pottery teachers to manage their studios</p>
                  </div>
                </div>
              </div>

              {/* Right - stats */}
              <div className="border-t border-b border-zinc-800/60 pt-12 pl-12 pb-16">
                <p className="text-zinc-500 text-sm mb-8">Results after 30 days with ScoreLead</p>

                <div className="space-y-8">
                  <div>
                    <p className="text-4xl md:text-5xl font-semibold text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
                      2,450
                    </p>
                    <p className="text-zinc-500 text-sm">Leads discovered automatically</p>
                  </div>
                  <div>
                    <p className="text-4xl md:text-5xl font-semibold text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
                      10x
                    </p>
                    <p className="text-zinc-500 text-sm">Pipeline growth in the first month</p>
                  </div>
                  <div>
                    <p className="text-4xl md:text-5xl font-semibold text-white mb-1" style={{ letterSpacing: "-0.02em" }}>
                      85%
                    </p>
                    <p className="text-zinc-500 text-sm">Less time spent on manual research</p>
                  </div>
                </div>

                <button className="mt-10 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                  Read the full story
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
