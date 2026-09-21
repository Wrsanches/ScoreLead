import { createElement } from "react"
import { render } from "@react-email/render"
import { BlocksEmail } from "@/lib/emails/blocks/blocks-email"
import type { BrandTheme } from "@/lib/emails/blocks/theme"
import type { EmailDocument, ResolvedEmailComponents } from "@/lib/resend/blocks"

/** Blocks to a complete HTML document with {{tokens}} left intact. */
export async function renderBlocksToHtml(input: {
  doc: EmailDocument
  components: ResolvedEmailComponents
  theme: BrandTheme
  subject: string
  lang?: string
}): Promise<string> {
  return render(createElement(BlocksEmail, input))
}
