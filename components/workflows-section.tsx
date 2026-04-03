"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ArrowRight, MapPin, Search, Globe, Sparkles, FileDown, Mail, Code } from "lucide-react"

const carouselCards = [
  {
    id: 1,
    category: "Business Discovery",
    title: "Find businesses across any city or industry automatically",
    icon: ArrowRight,
    mockup: "map-discovery",
  },
  {
    id: 2,
    category: "Web Intelligence",
    title: "Search and index business websites at scale",
    icon: ArrowRight,
    mockup: "web-search",
  },
  {
    id: 3,
    category: "Data Extraction",
    title: "Extract structured data from any business website",
    icon: ArrowRight,
    mockup: "data-extraction",
  },
  {
    id: 4,
    category: "AI Enrichment",
    title: "Turn raw data into actionable lead intelligence",
    icon: ArrowRight,
    mockup: "ai-enrichment",
  },
  {
    id: 5,
    category: "Data Export",
    title: "Export enriched leads to CSV with all data points",
    icon: ArrowRight,
    mockup: "csv-export",
  },
  {
    id: 6,
    category: "Automated Outreach",
    title: "AI-generated personalized multi-step email sequences",
    icon: ArrowRight,
    mockup: "email-outreach",
  },
  {
    id: 7,
    category: "Developer Access",
    title: "Build custom integrations with the ScoreLead API",
    icon: ArrowRight,
    mockup: "rest-api",
  },
]

function MapDiscoveryMockup() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <MapPin className="w-3.5 h-3.5" />
        <span>Business Discovery</span>
      </div>
      {[
        { name: "Sunset Yoga Studio", rating: "4.7", reviews: "128" },
        { name: "Peak Fitness Co", rating: "4.5", reviews: "89" },
        { name: "Bloom Wellness", rating: "4.8", reviews: "203" },
      ].map((place) => (
        <div key={place.name} className="flex items-center gap-2 bg-zinc-800/30 rounded-lg px-3 py-2">
          <div className="w-5 h-5 bg-emerald-500/20 rounded flex items-center justify-center">
            <MapPin className="w-3 h-3 text-emerald-400" />
          </div>
          <span className="text-sm text-zinc-300 flex-1">{place.name}</span>
          <span className="text-[10px] text-amber-400">★ {place.rating}</span>
          <span className="text-[10px] text-zinc-500">({place.reviews})</span>
        </div>
      ))}
    </div>
  )
}

function WebSearchMockup() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Search className="w-3.5 h-3.5" />
        <span>Web Intelligence</span>
      </div>
      <div className="bg-zinc-800/30 rounded-lg px-3 py-2">
        <span className="text-xs text-zinc-500">Query:</span>
        <span className="text-xs text-zinc-300 ml-1">yoga studios San Francisco</span>
      </div>
      {["sunsetyoga.com", "peakfitness.co", "bloomwellness.com"].map((url) => (
        <div key={url} className="flex items-center gap-2 px-3 py-1.5">
          <Globe className="w-3 h-3 text-blue-400" />
          <span className="text-xs text-blue-400">{url}</span>
        </div>
      ))}
      <span className="text-[10px] text-zinc-600 px-3">Aggregator sites filtered automatically</span>
    </div>
  )
}

function DataExtractionMockup() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Globe className="w-3.5 h-3.5" />
        <span>Data Extraction</span>
        <span className="text-zinc-600">·</span>
        <span className="text-blue-400/70">sunsetyoga.com</span>
      </div>
      <div className="mt-2 bg-zinc-800/30 rounded-lg px-3 py-2 font-mono text-[10px] text-zinc-500 space-y-1">
        <p><span className="text-zinc-400">email:</span> hello@sunsetyoga.com</p>
        <p><span className="text-zinc-400">phone:</span> (415) 555-0142</p>
        <p><span className="text-zinc-400">services:</span> yoga, pilates, meditation</p>
        <p className="text-zinc-600">  Extracting content...</p>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] text-zinc-500">Crawling 3 pages...</span>
      </div>
    </div>
  )
}

function AIEnrichmentMockup() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span>AI Enrichment</span>
        <span className="ml-auto text-[10px] text-emerald-400">12 fields extracted</span>
      </div>
      {[
        { field: "email", value: "hello@sunset...", done: true },
        { field: "phone", value: "(415) 555-01...", done: true },
        { field: "services", value: "yoga, pilates, med...", done: true },
        { field: "team_size", value: "8 members", done: true },
        { field: "pricing", value: "$25–$40/class", done: false },
      ].map((item) => (
        <div key={item.field} className="flex items-center gap-2 bg-zinc-800/30 rounded-md px-3 py-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${item.done ? "bg-emerald-500" : "bg-purple-400 animate-pulse"}`} />
          <span className="text-[10px] text-zinc-500 w-16">{item.field}</span>
          <span className="text-[10px] text-zinc-300 truncate">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function CSVExportMockup() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="bg-zinc-800/50 rounded-lg px-4 py-3 border border-zinc-700/50">
          <div className="flex items-center gap-2 mb-2">
            <FileDown className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-mono text-zinc-400">leads_export.csv</span>
          </div>
          <div className="text-[9px] font-mono text-zinc-600 space-y-0.5">
            <p>name,email,score,status</p>
            <p>Sunset Yoga,hello@...,4.5,new</p>
            <p>Peak Fitness,info@...,4.0,con</p>
          </div>
        </div>
        <span className="text-[10px] text-zinc-500">1,240 leads · 28 columns</span>
      </div>
    </div>
  )
}

function EmailOutreachMockup() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 1 ? "bg-blue-500/20 text-blue-400" :
              step === 2 ? "bg-amber-500/20 text-amber-400" :
              "bg-emerald-500/20 text-emerald-400"
            }`}>{step}</div>
            <Mail className="w-4 h-4 text-zinc-500" />
            <div className="w-24 h-2 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function RestAPIMockup() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-zinc-800/50 rounded-lg px-4 py-3 border border-zinc-700/50">
        <div className="flex items-center gap-2 mb-2">
          <Code className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-mono text-zinc-400">SCORELEAD API</span>
        </div>
        <div className="text-[10px] font-mono text-zinc-600 space-y-0.5">
          <p><span className="text-emerald-400">GET</span> /api/leads</p>
          <p><span className="text-blue-400">POST</span> /api/discover</p>
          <p><span className="text-amber-400">PATCH</span> /api/leads/:id</p>
        </div>
      </div>
    </div>
  )
}

function CardMockup({ type }: { type: string }) {
  switch (type) {
    case "map-discovery":
      return <MapDiscoveryMockup />
    case "web-search":
      return <WebSearchMockup />
    case "data-extraction":
      return <DataExtractionMockup />
    case "ai-enrichment":
      return <AIEnrichmentMockup />
    case "csv-export":
      return <CSVExportMockup />
    case "email-outreach":
      return <EmailOutreachMockup />
    case "rest-api":
      return <RestAPIMockup />
    default:
      return null
  }
}

export function WorkflowsSection() {
  const [scrollPosition, setScrollPosition] = useState(0)

  const scrollLeft = () => {
    setScrollPosition(Math.max(0, scrollPosition - 1))
  }

  const scrollRight = () => {
    setScrollPosition(Math.min(carouselCards.length - 4, scrollPosition + 1))
  }

  return (
    <section id="integrations" className="relative py-24" style={{ backgroundColor: "#09090B" }}>
      {/* Top gradient */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "20%",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-16">
          <div className="lg:max-w-xl">
            {/* Orange indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-sm text-zinc-400">Capabilities</span>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl font-medium text-white leading-[1.1]">
              Everything you need
              <br />
              in one platform
            </h2>
          </div>

          {/* Description */}
          <p className="text-zinc-400 lg:max-w-sm lg:pt-12">
            ScoreLead combines AI-powered discovery, enrichment, scoring, outreach, and export into a single platform
            - so your team can focus on closing deals.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative overflow-hidden">
          <div
            className="flex gap-4 transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${scrollPosition * (100 / 4)}%)` }}
          >
            {carouselCards.map((card) => (
              <div key={card.id} className="shrink-0 w-[calc(25%-12px)] min-w-[280px]">
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden h-[340px] flex flex-col">
                  {/* Mockup area */}
                  <div className="flex-1 relative overflow-hidden">
                    <CardMockup type={card.mockup} />
                    {/* Fade overlay */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                      style={{
                        background: "linear-gradient(to top, rgba(9,9,11,0.9), transparent)",
                      }}
                    />
                  </div>

                  {/* Card footer */}
                  <div className="p-4 border-t border-zinc-800/30">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-500 mb-1">{card.category}</p>
                        <p className="text-sm text-zinc-200 leading-snug">{card.title}</p>
                      </div>
                      <button className="shrink-0 w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors">
                        <card.icon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={scrollLeft}
            className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={scrollPosition === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollRight}
            className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={scrollPosition >= carouselCards.length - 4}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
