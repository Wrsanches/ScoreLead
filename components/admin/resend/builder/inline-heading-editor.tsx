"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { EditorContent, useEditor } from "@tiptap/react"
import { Extension } from "@tiptap/core"
import Document from "@tiptap/extension-document"
import Paragraph from "@tiptap/extension-paragraph"
import Text from "@tiptap/extension-text"
import { VariableMenu } from "@/components/admin/resend/variable-menu"
import { VariableNode } from "@/lib/resend/tiptap-variable"
import { richDocToPlainText, textToRichDoc, type EmailAlign } from "@/lib/resend/blocks"
import type { BrandTheme } from "@/lib/emails/blocks/theme"
import { CHIP_CLASSES } from "./inline-rich-editor"

const SingleLine = Extension.create({
  name: "singleLine",
  addKeyboardShortcuts() {
    return { Enter: () => true, "Shift-Enter": () => true }
  },
})

/** One-line editor for headings: plain text with variable chips, no marks. */
export function InlineHeadingEditor({
  text,
  level,
  align,
  theme,
  onChange,
}: {
  text: string
  level: 1 | 2
  align: EmailAlign
  theme: BrandTheme
  onChange: (text: string) => void
}) {
  const t = useTranslations("resend")
  const editor = useEditor({
    immediatelyRender: false,
    autofocus: "end",
    extensions: [Document.extend({ content: "paragraph" }), Paragraph, Text, VariableNode, SingleLine],
    content: textToRichDoc([text]),
    editorProps: { attributes: { class: "tiptap", "data-placeholder": t("paletteHeading") } },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      const paragraph = Array.isArray(json.content) ? json.content[0] : undefined
      const doc = textToRichDoc([""])
      if (paragraph) doc.content = [paragraph as (typeof doc.content)[number]]
      try {
        onChange(richDocToPlainText(doc).replace(/\n+/g, " ").slice(0, 200))
      } catch {
        onChange(editor.getText().slice(0, 200))
      }
    },
  })
  useEffect(() => () => editor?.destroy(), [editor])

  return (
    <div className="relative">
      <div className="absolute -top-11 left-0 z-10 flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-white/[0.1] dark:bg-zinc-900" onMouseDown={(e) => e.preventDefault()}>
        {editor && <VariableMenu iconOnly label={t("tplInsertVariable")} onPick={(key) => editor.chain().focus().insertContent({ type: "variable", attrs: { key } }).run()} />}
      </div>
      <div
        className={`${CHIP_CLASSES} [&_.tiptap]:outline-none [&_.tiptap_p]:m-0 [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:text-zinc-400 [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none`}
        style={{
          fontFamily: theme.headingFontStack,
          fontSize: level === 1 ? 26 : 20,
          lineHeight: 1.25,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: theme.headingColor,
          textAlign: align,
          margin: level === 1 ? "0 0 16px" : "8px 0 12px",
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
