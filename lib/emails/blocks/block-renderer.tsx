import { Button, Heading, Hr, Img, Link, Section, Text } from "@react-email/components"
import type { EmailBlock } from "@/lib/resend/blocks"
import { RichDocView } from "./rich-doc"
import { readableTextOn, type BrandTheme } from "./theme"

/**
 * One React Email element per block. Shared by the server renderer and the
 * builder canvas, so what the user drags is what the recipient receives.
 */
export function renderBlock(block: EmailBlock, theme: BrandTheme): React.ReactElement | null {
  switch (block.type) {
    case "heading": {
      const { text, level, align } = block.props
      return (
        <Heading
          as={level === 1 ? "h1" : "h2"}
          style={{
            margin: level === 1 ? "0 0 16px" : "8px 0 12px",
            fontSize: level === 1 ? "26px" : "20px",
            lineHeight: "1.25",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: theme.headingColor,
            textAlign: align,
            fontFamily: theme.headingFontStack,
          }}
        >
          {text}
        </Heading>
      )
    }
    case "text":
      return <RichDocView doc={block.props.doc} theme={theme} align={block.props.align} />
    case "button": {
      const { label, href, align, variant } = block.props
      const primary = variant === "primary"
      return (
        <Section style={{ textAlign: align, margin: "6px 0 18px" }}>
          <Button
            href={href || "{{business.website}}"}
            style={{
              display: "inline-block",
              backgroundColor: primary ? theme.primary : "transparent",
              color: primary ? readableTextOn(theme.primary) : theme.primary,
              border: primary ? `1px solid ${theme.primary}` : `1px solid ${theme.primary}`,
              fontFamily: theme.fontStack,
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
              padding: "13px 28px",
              borderRadius: `${theme.buttonRadius}px`,
            }}
          >
            {label}
          </Button>
        </Section>
      )
    }
    case "image": {
      const { src, alt, href, width, align } = block.props
      if (!src) return null
      const img = (
        <Img
          src={src}
          alt={alt}
          width={width ?? undefined}
          style={{
            display: "block",
            maxWidth: "100%",
            width: width ? `${width}px` : "100%",
            height: "auto",
            borderRadius: `${theme.radius}px`,
            margin: align === "center" ? "0 auto" : "0",
          }}
        />
      )
      return (
        <Section style={{ margin: "0 0 18px", textAlign: align }}>
          {href ? <Link href={href}>{img}</Link> : img}
        </Section>
      )
    }
    case "divider":
      return <Hr style={{ border: "none", borderTop: `1px solid ${theme.accentSoft}`, margin: "18px 0" }} />
    case "spacer":
      return (
        <Section style={{ height: `${block.props.height}px`, lineHeight: `${block.props.height}px`, fontSize: "1px" }}>
          <Text style={{ margin: 0, lineHeight: `${block.props.height}px`, fontSize: "1px" }}>&nbsp;</Text>
        </Section>
      )
  }
}
