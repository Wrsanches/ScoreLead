import { Fragment } from "react"
import { Link, Text } from "@react-email/components"
import type { EmailAlign, RichDoc, RichInline, RichParagraph } from "@/lib/resend/blocks"
import type { BrandTheme } from "./theme"

/**
 * Renders whitelisted TipTap JSON as React Email elements. No HTML strings are
 * interpreted: every node type here is one the schema allowed.
 */
export function paragraphStyle(theme: BrandTheme, align: EmailAlign): React.CSSProperties {
  return {
    margin: "0 0 14px",
    fontSize: "15px",
    lineHeight: "1.7",
    color: theme.text,
    textAlign: align,
    fontFamily: theme.fontStack,
  }
}

function Inline({ node, theme }: { node: RichInline; theme: BrandTheme }) {
  if (node.type === "hardBreak") return <br />
  if (node.type === "variable") return <>{`{{${node.attrs.key}}}`}</>
  let content: React.ReactNode = node.text
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") content = <strong>{content}</strong>
    else if (mark.type === "italic") content = <em>{content}</em>
    else if (mark.type === "link") {
      content = (
        <Link href={mark.attrs.href} style={{ color: theme.primary, textDecoration: "underline" }}>
          {content}
        </Link>
      )
    }
  }
  return <>{content}</>
}

function Inlines({ nodes, theme }: { nodes: RichInline[] | undefined; theme: BrandTheme }) {
  if (!nodes || nodes.length === 0) return <>&nbsp;</>
  return (
    <>
      {nodes.map((node, i) => (
        <Inline key={i} node={node} theme={theme} />
      ))}
    </>
  )
}

function Paragraph({ node, theme, align }: { node: RichParagraph; theme: BrandTheme; align: EmailAlign }) {
  return (
    <Text style={paragraphStyle(theme, align)}>
      <Inlines nodes={node.content} theme={theme} />
    </Text>
  )
}

export function RichDocView({ doc, theme, align = "left" }: { doc: RichDoc; theme: BrandTheme; align?: EmailAlign }) {
  return (
    <>
      {doc.content.map((node, i) => {
        if (node.type === "paragraph") return <Paragraph key={i} node={node} theme={theme} align={align} />
        const Tag = node.type === "orderedList" ? "ol" : "ul"
        return (
          <Tag
            key={i}
            style={{ margin: "0 0 14px", paddingLeft: "24px", color: theme.text, fontFamily: theme.fontStack, fontSize: "15px", lineHeight: "1.7", textAlign: align }}
          >
            {node.content.map((item, j) => (
              <li key={j} style={{ margin: "0 0 4px" }}>
                {item.content.map((p, k) => (
                  <Fragment key={k}>
                    {k > 0 && <br />}
                    <Inlines nodes={p.content} theme={theme} />
                  </Fragment>
                ))}
              </li>
            ))}
          </Tag>
        )
      })}
    </>
  )
}
