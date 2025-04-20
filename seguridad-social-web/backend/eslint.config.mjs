import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
  {
    files: ["**/*.{js,cjs}"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node }      // <- gives 'require', 'module', 'process', …
    },
    plugins: { js },
    rules: {
      "@typescript-eslint/no-require-imports": "off", // allow CommonJS
      "no-undef": "off"
    }
  },
  // keep the rest of your presets afterwards…
]);
