/**
 * UUID v4 para identificar operaciones, lotes y dispositivos.
 *
 * El respaldo importa: `crypto.randomUUID` solo existe en contextos seguros
 * (https o localhost), y el backend valida el identificador del lote con
 * `@IsUUID()`. Un respaldo con otra forma haría que el envío entero se
 * rechazara con un 400 justo en los navegadores más viejos, que son los que
 * más van a usar el modo sin conexión.
 */
/**
 * Vista laxa de `crypto`: en los navegadores donde importa el respaldo, los
 * métodos pueden no existir aunque el tipo del DOM diga que sí.
 */
interface MaybeCrypto {
  randomUUID?: () => string;
  getRandomValues?: <T extends ArrayBufferView>(array: T) => T;
}

export function randomUuid(): string {
  const webCrypto: MaybeCrypto | undefined =
    typeof crypto !== "undefined" ? crypto : undefined;

  if (webCrypto?.randomUUID) return webCrypto.randomUUID();

  const bytes = new Uint8Array(16);
  if (webCrypto?.getRandomValues) {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  // Versión 4 y variante RFC 4122, como exige el validador del servidor.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}
