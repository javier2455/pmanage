/**
 * Colores de los avisos de sileo sobre su superficie clara.
 *
 * FIJOS, no tokens del tema. La hoja de estilos de sileo no tiene ninguna regla
 * de modo oscuro (ni `.dark` ni `prefers-color-scheme`): su fondo es siempre
 * claro. Con tokens como `text-foreground`, que en modo oscuro se vuelven casi
 * blancos, el texto desaparece sobre ese fondo.
 */
export const TOAST_STYLES = {
  title: "text-zinc-900! text-[16px]! font-bold!",
  description: "text-zinc-600! text-[15px]!",
} as const;
