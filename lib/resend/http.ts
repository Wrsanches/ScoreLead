import { NextResponse } from "next/server"

/** Maps zod issues from emailTemplateFormSchema to a stable API error shape. */
export function templateValidationResponse(error: { issues: { message: string }[] }) {
  const first = error.issues[0]?.message ?? "Invalid template"
  const KNOWN = ["BLOCKS_BODY_REQUIRED", "BLOCKS_EMPTY", "DOC_TOO_LARGE", "HTML_BODY_REQUIRED", "HTML_TOO_LARGE"]
  const [head, tail] = first.includes(":") ? [first.slice(0, first.indexOf(":")), first.slice(first.indexOf(":") + 1)] : [first, undefined]
  const code = head === "UNKNOWN_VARIABLE" || head === "BLOCK_INCOMPLETE" || KNOWN.includes(head) ? head : "INVALID_INPUT"
  const list = tail ? tail.split(",").filter(Boolean) : undefined
  return NextResponse.json(
    {
      error: "Invalid template",
      code,
      unknownVariables: code === "UNKNOWN_VARIABLE" ? list : undefined,
      incompleteBlocks: code === "BLOCK_INCOMPLETE" ? list : undefined,
    },
    { status: 400 },
  )
}
