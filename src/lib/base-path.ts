/**
 * basePath de la app (subruta de despliegue): "/manager" en producción,
 * "/dev" en develop, "" en local. Se inyecta en build vía `NEXT_PUBLIC_BASE_PATH`
 * (ver `next.config.ts`). Next.js prefija `basePath` automáticamente en `<Link>`,
 * `router.push`, `redirect` y `next/image`, PERO NO en navegaciones crudas del
 * navegador (`window.location.href`) ni al construir URLs a mano. Para esos casos
 * usar `withBasePath()`.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Prefija una ruta absoluta interna (que empieza con "/") con el basePath.
 * Deja intactas las rutas que no empiezan con "/" (ej. URLs externas o relativas).
 *
 * @example withBasePath("/login") // "/manager/login" en prod, "/login" en local
 */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${BASE_PATH}${path}`;
}
