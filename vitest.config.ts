import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Lógica pura por defecto (entorno node, sin DOM). Los tests de componentes
    // piden el suyo con `// @vitest-environment jsdom` en la primera línea.
    environment: "node",
    globals: true,
    // Solo *.test.ts son archivos Vitest. Los *.suite.ts son specs compartidas
    // (datos) que la UI admin también ejecuta en el navegador; no son tests Vitest.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
