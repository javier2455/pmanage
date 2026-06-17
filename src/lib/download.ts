/**
 * Helpers para descargar/abrir archivos binarios (Blob) recibidos de la API.
 * Mismo enfoque que las exportaciones de cierre contable (anchor + objectURL),
 * que funciona de forma fiable incluso dentro del `onSuccess` de una mutación.
 */

/** Fuerza la descarga de un Blob con el nombre indicado. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Abre un PDF (Blob) en una pestaña nueva. Si el navegador bloquea el popup
 * (suele pasar fuera del gesto directo del usuario), cae a la descarga.
 */
export function openPdfInNewTab(blob: Blob, fallbackFilename: string) {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    // Popup bloqueado → descargamos en su lugar.
    const a = document.createElement("a");
    a.href = url;
    a.download = fallbackFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  // Revocamos con retraso para dar tiempo a que la pestaña cargue el PDF.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
