type JsonLdProps = {
  data: unknown
}

function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

/**
 * Structured data for search engines. The script tag is emitted as raw HTML
 * inside a hidden wrapper rather than as a React `<script>` element: React 19
 * warns whenever it creates a script element during client-side navigation
 * ("Scripts inside React components are never executed..."), and JSON-LD
 * never needs to execute anyway. Crawlers read ld+json blocks anywhere in the
 * document, so the wrapper does not affect indexing.
 */
export function JsonLd({ data }: JsonLdProps) {
  const html = `<script type="application/ld+json">${serializeJsonLd(data)}</script>`
  return <div hidden suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />
}
