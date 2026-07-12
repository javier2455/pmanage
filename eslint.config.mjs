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
    rules: {
      // El React Compiler emite "incompatible-library" (Compilation Skipped) al
      // no poder memoizar APIs de terceros como useReactTable() de TanStack Table
      // o watch() de React Hook Form. Es informativo e inherente a esas librerías,
      // no un problema accionable en nuestro código: se silencia.
      "react-hooks/incompatible-library": "off",
    },
  },
  {
    // server.js es el servidor Node de arranque en CommonJS; require() es correcto.
    files: ["server.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Componentes vendored de shadcn/ui: se mantienen tal cual del upstream para
    // no complicar futuras actualizaciones. Se relajan sus avisos propios.
    files: ["src/components/ui/**"],
    rules: {
      "react-hooks/purity": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
