import eslint from "@eslint/js";
import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["coverage/**", "dist/**"],
  },
  ...tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
      rules: {
        "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      },
    }
  ),
] satisfies FlatConfig.Config[];
