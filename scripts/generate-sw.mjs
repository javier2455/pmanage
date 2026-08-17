import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, posix, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Genera `out/sw.js` a partir de `scripts/sw-template.js` (plan offline, B1).
 *
 * Se ejecuta DESPUÉS de `next build`, cuando `out/` ya contiene el sitio
 * estático completo. Ahí está la ventaja de `output: "export"`: el manifiesto
 * de precache no hay que adivinarlo ni mantenerlo a mano, se obtiene
 * recorriendo la carpeta, y por definición está siempre completo y al día.
 *
 * La versión de la caché es el hash del propio manifiesto: si cambia un solo
 * archivo del build, cambia el nombre de la caché y el service worker
 * reemplaza la anterior. Si no cambia nada, se reutiliza y no se vuelve a
 * descargar nada.
 */

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = join(scriptDir, "..");
const outDir = join(projectRoot, "out");
const templatePath = join(scriptDir, "sw-template.js");

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const apiPath = resolveApiPath(process.env.NEXT_PUBLIC_API_URL);

/**
 * Archivos que NO se precachean.
 *
 * - `sw.js` y `manifest.webmanifest`: los pide el navegador por su cuenta;
 *   cachear el propio service worker complica su actualización.
 * - `.htaccess`: configuración del servidor, no la sirve nadie.
 */
const EXCLUDED = new Set(["sw.js", "manifest.webmanifest", ".htaccess"]);

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Ruta de fichero → URL con la que el navegador la pedirá.
 *
 * Con `trailingSlash: true`, `dashboard/ventas/index.html` se sirve como
 * `/dashboard/ventas/`: si se precacheara la ruta del archivo, la entrada no
 * coincidiría nunca con la petición real y el precache sería inútil.
 */
function toUrl(filePath) {
  const rel = relative(outDir, filePath).split(sep).join(posix.sep);
  const url = rel.endsWith("/index.html")
    ? `/${rel.slice(0, -"index.html".length)}`
    : rel === "index.html"
      ? "/"
      : `/${rel}`;
  return `${basePath}${url}`;
}

function resolveApiPath(apiUrl) {
  if (!apiUrl) return "/api";
  try {
    return new URL(apiUrl).pathname.replace(/\/$/, "") || "/api";
  } catch {
    // Valor relativo o mal formado: se usa tal cual si parece una ruta.
    return apiUrl.startsWith("/") ? apiUrl.replace(/\/$/, "") : "/api";
  }
}

async function main() {
  try {
    await stat(outDir);
  } catch {
    console.error(
      "[sw] No existe `out/`. Ejecuta `next build` antes de generar el service worker.",
    );
    process.exit(1);
  }

  const files = await collectFiles(outDir);
  const urls = files
    .filter((file) => !EXCLUDED.has(relative(outDir, file).split(sep).pop()))
    .map(toUrl)
    .sort();

  const version = createHash("sha256")
    .update(urls.join("\n"))
    .digest("hex")
    .slice(0, 12);

  // `replaceAll` en todos: con `replace` a secas solo se cambia la primera
  // aparición, y basta con que un marcador se nombre en un comentario para que
  // la sustitución caiga ahí y el código se quede sin reemplazar.
  const replacements = {
    __PRECACHE__: JSON.stringify(urls, null, 2),
    __VERSION__: version,
    __API_PREFIX__: apiPath,
    __STATIC_PREFIX__: `${basePath}/_next/static`,
    __BASE_PATH__: basePath,
  };

  const template = await readFile(templatePath, "utf8");
  let sw = template;
  for (const [marker, value] of Object.entries(replacements)) {
    sw = sw.replaceAll(marker, value);
  }

  // Red de seguridad: un marcador sin sustituir deja un identificador suelto
  // que revienta el service worker en el navegador con un error de sintaxis, y
  // el modo offline se caería en silencio. Mejor romper el build aquí.
  //
  // Se comprueban SOLO los marcadores propios: el manifiesto contiene nombres
  // de archivo de Next con la misma forma (`__next.__PAGE__.txt`) que no son
  // marcadores.
  const leftover = Object.keys(replacements).filter((m) => sw.includes(m));
  if (leftover.length > 0) {
    console.error(`[sw] Marcadores sin sustituir: ${leftover.join(", ")}`);
    process.exit(1);
  }

  await writeFile(join(outDir, "sw.js"), sw, "utf8");

  const bytes = (
    await Promise.all(files.map(async (f) => (await stat(f)).size))
  ).reduce((a, b) => a + b, 0);
  console.log(
    `[sw] out/sw.js generado — ${urls.length} recursos, ${(bytes / 1024 / 1024).toFixed(1)} MB, versión ${version}`,
  );
}

await main();
