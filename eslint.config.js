import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: {
      js,
      react: pluginReact,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // 👇 Disable "React must be in scope"
      "react/react-in-jsx-scope": "off",
    },
    // 👇 Optional: enable other React rules if you want
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // 👇 Apply React recommended rules (optional, already included above but kept for clarity)
  pluginReact.configs.flat.recommended,
]);
