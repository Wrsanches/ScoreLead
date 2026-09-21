"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { EditorContent, useEditor, useEditorState } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Bold, Italic, Link2, List, ListOrdered, Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VariableMenu } from "@/components/admin/resend/variable-menu"
import { VariableNode } from "@/lib/resend/tiptap-variable"
import { normalizeRichDoc, type EmailAlign, type RichDoc } from "@/lib/resend/blocks"
import type { BrandTheme } from "@/lib/emails/blocks/theme"

export /** Toolbar buttons sit on a dark pill above a white email card; colors are explicit so the card's text color never leaks in. */
function toolClass(active?: boolean) {
  return `size-7 px-0 text-zinc-300 hover:bg-white/[0.1] hover:text-white ${active ? "bg-white/[0.14] text-white" : ""}`
}

export const CHIP_CLASSES =
  "[&_.email-var-chip]:rounded-md [&_.email-var-chip]:bg-emerald-500/10 [&_.email-var-chip]:px-1 [&_.email-var-chip]:font-mono [&_.email-var-chip]:text-[0.85em] [&_.email-var-chip]:text-emerald-700"

/**
 * In-place editor for a text block. Styled like the rendered paragraph so
 * editing feels like typing into the email itself.
 */
export function InlineRichEditor({
  doc,
  align,
  theme,
  onChange,
}: {
  doc: RichDoc
  align: EmailAlign
  theme: BrandTheme
  onChange: (doc: RichDoc) => void
}) {
  const t = useTranslations("resend")
  const editor = useEditor({
    immediatelyRender: false,
    autofocus: "end",
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        dropcursor: false,
        gapcursor: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      VariableNode,
    ],
    content: doc,
    editorProps: { attributes: { class: "tiptap", "data-placeholder": t("tplBodyPlaceholder") } },
    onUpdate: ({ editor }) => onChange(normalizeRichDoc(editor.getJSON())),
  })

  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      link: editor?.isActive("link") ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
    }),
  })

  useEffect(() => () => editor?.destroy(), [editor])

  function setLink() {
    if (!editor) return
    const previous = (editor.getAttributes("link").href as string | undefined) ?? ""
    const url = window.prompt(t("toolbarLinkPrompt"), previous)
    if (url === null) return
    if (!url.trim()) editor.chain().focus().extendMarkRange("link").unsetLink().run()
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run()
  }

  return (
    <div className="relative">
      <div className="absolute -top-11 left-0 z-10 flex items-center gap-0.5 rounded-lg border border-white/[0.1] bg-zinc-900 p-1 text-zinc-300 shadow-lg" onMouseDown={(e) => e.preventDefault()}>
        {editor && (
          <>
            <Button type="button" variant="ghost" size="sm" className={toolClass(active?.bold)} onClick={() => editor.chain().focus().toggleBold().run()} aria-label={t("toolbarBold")} aria-pressed={active?.bold}><Bold className="size-3.5" /></Button>
            <Button type="button" variant="ghost" size="sm" className={toolClass(active?.italic)} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label={t("toolbarItalic")} aria-pressed={active?.italic}><Italic className="size-3.5" /></Button>
            <Button type="button" variant="ghost" size="sm" className={toolClass(active?.link)} onClick={setLink} aria-label={t("toolbarLink")} aria-pressed={active?.link}>{active?.link ? <Unlink className="size-3.5" /> : <Link2 className="size-3.5" />}</Button>
            <Button type="button" variant="ghost" size="sm" className={toolClass(active?.bulletList)} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label={t("toolbarList")} aria-pressed={active?.bulletList}><List className="size-3.5" /></Button>
            <Button type="button" variant="ghost" size="sm" className={toolClass(active?.orderedList)} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label={t("toolbarOrderedList")} aria-pressed={active?.orderedList}><ListOrdered className="size-3.5" /></Button>
            <span className="mx-0.5 h-4 w-px bg-white/[0.12]" aria-hidden="true" />
            <VariableMenu iconOnly onDark label={t("tplInsertVariable")} onPick={(key) => editor.chain().focus().insertContent({ type: "variable", attrs: { key } }).run()} />
          </>
        )}
      </div>
      <div
        className={`${CHIP_CLASSES} [&_.tiptap]:outline-none [&_.tiptap_p]:my-0 [&_.tiptap_p]:mb-3.5 [&_.tiptap_ul]:mb-3.5 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6 [&_.tiptap_ol]:mb-3.5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6 [&_.tiptap_a]:underline [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:text-zinc-400 [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none`}
        style={{ fontFamily: theme.fontStack, fontSize: 15, lineHeight: 1.7, color: theme.text, textAlign: align }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
