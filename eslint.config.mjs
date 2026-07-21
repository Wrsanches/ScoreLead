import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import nextPlugin from "@next/eslint-plugin-next"

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Root config files (next.config.mjs, postcss.config.mjs, ...) run in
    // Node, so give them the Node globals (process, URL, ...).
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Skip build outputs, the bun/git-worktree mirror, generated assets,
    // and migration SQL/meta. The worktree copy especially was drowning
    // real warnings in "tsconfigRootDir" parse errors.
    ignores: [
      ".next/",
      "node_modules/",
      ".claude/",
      "public/generated/",
      "drizzle/",
      "scripts/",
    ],
  },
]
