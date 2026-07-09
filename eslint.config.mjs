import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // The canvas/ directory is imperative three.js / react-three-fiber:
    // useFrame render loops mutate GPU buffers and uniforms every frame, and
    // generative geometry uses Math.random() for scatter. The React Compiler's
    // purity/immutability rules can't model GPU state and flag this correct,
    // idiomatic pattern as errors. Disable just those two rules here — the
    // rest of the ruleset (and all non-canvas code) stays strict.
    files: ["src/components/canvas/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
    },
  },
]);

export default eslintConfig;
