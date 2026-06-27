import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Por ahora solo lógica pura: entorno node, sin DOM.
    // Cuando añadamos tests de componentes cambiaremos a "jsdom".
    environment: "node",
    globals: true,
    // Solo *.test.ts son archivos Vitest. Los *.suite.ts son specs compartidas
    // (datos) que la UI admin también ejecuta en el navegador; no son tests Vitest.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
