type JsonLdProps = {
  data: unknown
}

function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

/**
 * Keeps JSON-LD in the server-rendered HTML without asking React to create a
 * script element during client navigation. JSON-LD is declarative data, so it
 * does not need script execution.
 */
export function JsonLd({ data }: JsonLdProps) {
  const markup = `<script type="application/ld+json">${serializeJsonLd(data)}</script>`

  return (
    <div
      data-json-ld=""
      className="contents"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}
