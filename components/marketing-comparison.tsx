import { Link } from "@/i18n/routing"
import { ArrowUpRight } from "lucide-react"
import { getComparison } from "@/lib/marketing/comparisons"
import type { MarketingLocale } from "@/lib/marketing/types"

function Sources({ label, sources }: { label: string; sources: readonly { title: string; url: string }[] }) {
  return (
    <div className="mt-4 space-y-2 text-xs font-normal">
      <p className="text-zinc-500">{label}</p>
      {sources.map(source => {
        const className = "inline-flex min-h-8 items-center gap-1.5 rounded-md text-zinc-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-emerald-300 hover:decoration-emerald-300/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
        return <div key={source.url}>{source.url.startsWith("/") ? (
          <Link href={source.url} className={className}>{source.title}<ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" /></Link>
        ) : (
          <a href={source.url} className={className}>{source.title}<ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" /></a>
        )}</div>
      })}
    </div>
  )
}

export function MarketingComparison({ pageId, locale }: { pageId: string; locale: MarketingLocale }) {
  const comparison = getComparison(pageId, locale)
  if (!comparison) return null
  return (
    <section className="mt-12" aria-labelledby="comparison-title">
      <h2 id="comparison-title" className="text-2xl font-medium tracking-tight text-white">{comparison.title}</h2>
      <p id="comparison-methodology" className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">{comparison.description}</p>
      <div className="glass-card mt-7 hidden overflow-hidden rounded-3xl lg:block">
        <table className="w-full table-fixed border-collapse text-left text-sm leading-6" aria-describedby="comparison-methodology">
          <colgroup><col className="w-[19%]" /><col className="w-[29%]" /><col className="w-[24%]" /><col className="w-[28%]" /></colgroup>
          <thead className="border-b border-white/10 bg-white/[0.03] text-zinc-400">
            <tr>{comparison.columns.map(column => <th key={column} scope="col" className="px-6 py-5 text-xs font-medium">{column}</th>)}</tr>
          </thead>
          <tbody>{comparison.rows.map(row => (
            <tr key={row.name} className="border-b border-white/[0.06] align-top last:border-0">
              <th scope="row" className="p-6 font-medium text-white">
                <span className="text-base tracking-tight">{row.name}</span>
                <Sources label={comparison.sources} sources={row.sources} />
              </th>
              {row.cells.map((cell, i) => <td key={i} className="p-6 text-zinc-300">{cell}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="mt-7 grid gap-4 lg:hidden">
        {comparison.rows.map(row => (
          <article key={row.name} className="glass-card rounded-3xl p-6" aria-label={row.name}>
            <h3 className="border-b border-white/10 pb-4 text-xl font-medium tracking-tight text-white">{row.name}</h3>
            <dl className="mt-5 space-y-5">
              {row.cells.map((cell, i) => <div key={i}>
                <dt className="text-xs font-medium text-zinc-400">{comparison.columns[i + 1]}</dt>
                <dd className="mt-1.5 text-sm leading-6 text-zinc-200">{cell}</dd>
              </div>)}
            </dl>
            <Sources label={comparison.sources} sources={row.sources} />
          </article>
        ))}
      </div>
    </section>
  )
}
