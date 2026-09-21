"use client"

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react"
import CodeMirror, { EditorView, type ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { html } from "@codemirror/lang-html"
import { oneDark } from "@codemirror/theme-one-dark"

export type HtmlCodeEditorHandle = {
  /** Inserts text at the cursor (replacing any selection) and keeps focus there. */
  insertAtCursor: (text: string) => void
}

/** Makes the One Dark theme sit on the glass card instead of its own slate background. */
const glassTheme = EditorView.theme({
  "&": { backgroundColor: "transparent", fontSize: "12px" },
  ".cm-gutters": { backgroundColor: "transparent", borderRight: "1px solid rgba(255,255,255,0.06)" },
  ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.03)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
  ".cm-content": { padding: "12px 0", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  ".cm-scroller": { lineHeight: "1.6" },
  "&.cm-focused": { outline: "none" },
})

/** HTML source editor for templates: highlighting, line numbers, bracket matching, auto-indent. */
export const HtmlCodeEditor = forwardRef<
  HtmlCodeEditorHandle,
  { value: string; onChange: (value: string) => void; readOnly?: boolean; placeholder?: string }
>(function HtmlCodeEditor({ value, onChange, readOnly = false, placeholder }, ref) {
  const cm = useRef<ReactCodeMirrorRef>(null)
  const extensions = useMemo(() => [html(), glassTheme, EditorView.lineWrapping], [])

  useImperativeHandle(ref, () => ({
    insertAtCursor(text) {
      const view = cm.current?.view
      if (!view) {
        onChange(value + text)
        return
      }
      const { from, to } = view.state.selection.main
      view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } })
      view.focus()
    },
  }))

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]">
      <CodeMirror
        ref={cm}
        value={value}
        onChange={onChange}
        theme={oneDark}
        extensions={extensions}
        editable={!readOnly}
        readOnly={readOnly}
        placeholder={placeholder}
        minHeight="420px"
        maxHeight="70vh"
        basicSetup={{ foldGutter: false, autocompletion: false, highlightActiveLine: true }}
      />
    </div>
  )
})
