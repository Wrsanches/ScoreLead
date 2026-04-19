import js from "@eslint/js"
import tseslint from "typescript-eslint"
import nextPlugin from "@next/eslint-plugin-next"

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
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
