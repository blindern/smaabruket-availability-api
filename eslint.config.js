import js from "@eslint/js"
import prettier from "eslint-plugin-prettier/recommended"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  prettier,
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    ignores: [],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-deprecated": "error",
    },
  },
)
