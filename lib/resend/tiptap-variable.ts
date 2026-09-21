import { Node, mergeAttributes } from "@tiptap/core"
import { EMAIL_TEMPLATE_VARIABLES } from "@/lib/resend/render"

/**
 * Inline atom for `{{variable}}` chips inside TipTap. Its text form is the
 * literal token, so `editor.getText()` and `richDocToPlainText` agree.
 */
export const VariableNode = Node.create({
  name: "variable",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      key: {
        default: EMAIL_TEMPLATE_VARIABLES[0],
        parseHTML: (element) => element.getAttribute("data-variable"),
        renderHTML: (attributes) => ({ "data-variable": attributes.key }),
      },
    }
  },
  parseHTML() {
    return [{ tag: "span[data-variable]" }]
  },
  renderHTML({ node, HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "email-var-chip", contenteditable: "false" }), `{{${node.attrs.key}}}`]
  },
  renderText({ node }) {
    return `{{${node.attrs.key}}}`
  },
})
