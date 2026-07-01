/**
 * Anchos para tablas con `table-fixed` en cards de cierre diario.
 *
 * Hay dos juegos porque las tablas tienen distinto número de columnas:
 *   - `dailyClose*Col`  → tabla de STOCK (4 columnas: producto, stock, precio, total).
 *   - `sold*Col`        → tabla de VENTAS (5 columnas: + moneda). Los porcentajes de
 *     cada juego suman 100 por separado; compartirlos descuadraba una de las dos.
 *
 * La columna producto es deliberadamente estrecha para que las numéricas conserven
 * espacio y no se solapen. Los `min-w` garantizan que los títulos largos
 * (p. ej. "Cantidad") quepan sin desbordar sobre la columna vecina.
 */

const numHeaderRight =
  "whitespace-nowrap text-right [&_button]:justify-end [&_button]:w-full [&_button]:lg:pr-4"
const numCellRight = "whitespace-nowrap text-right tabular-nums"

/* ---- Tabla de STOCK (4 columnas) ---- */

export const dailyCloseProductCol = {
  headerClassName:
    "min-w-0 w-[28%] max-w-[28%] whitespace-normal align-top [word-break:break-word]",
  cellClassName:
    "min-w-0 w-[28%] max-w-[28%] whitespace-normal break-words align-top [overflow-wrap:anywhere]",
} as const

/** Cantidad / stock (unidades) */
export const dailyCloseQtyCol = {
  headerClassName: `min-w-[4rem] w-[14%] ${numHeaderRight}`,
  cellClassName: `min-w-[4rem] w-[14%] ${numCellRight}`,
} as const

/** Precio unitario / costo unit. */
export const dailyCloseUnitPriceCol = {
  headerClassName: `min-w-[6.5rem] w-[26%] ${numHeaderRight}`,
  cellClassName: `min-w-[6.5rem] w-[26%] ${numCellRight}`,
} as const

/** Total línea */
export const dailyCloseLineTotalCol = {
  headerClassName: `min-w-[6.5rem] w-[32%] ${numHeaderRight}`,
  cellClassName: `min-w-[6.5rem] w-[32%] ${numCellRight}`,
} as const

/* ---- Tabla de VENTAS (5 columnas, incluye Moneda) ---- */

export const soldProductCol = {
  headerClassName:
    "min-w-0 w-[20%] max-w-[20%] whitespace-normal align-top [word-break:break-word]",
  cellClassName:
    "min-w-0 w-[20%] max-w-[20%] whitespace-normal break-words align-top [overflow-wrap:anywhere]",
} as const

/** Moneda de la transacción (texto, alineado a la izquierda). */
export const soldCurrencyCol = {
  headerClassName:
    "min-w-[6rem] w-[18%] whitespace-normal align-top [&_button]:justify-start",
  cellClassName:
    "min-w-[6rem] w-[18%] whitespace-normal break-words align-top [overflow-wrap:anywhere]",
} as const

/** Cantidad — `min-w` holgado para que el título "Cantidad" no desborde. */
export const soldQtyCol = {
  headerClassName: `min-w-[6rem] w-[16%] ${numHeaderRight}`,
  cellClassName: `min-w-[6rem] w-[16%] ${numCellRight}`,
} as const

/** Precio unitario — `min-w` suficiente para "Precio unit." sin desbordar. */
export const soldUnitPriceCol = {
  headerClassName: `min-w-[6.5rem] w-[22%] ${numHeaderRight}`,
  cellClassName: `min-w-[6.5rem] w-[22%] ${numCellRight}`,
} as const

/** Total línea */
export const soldLineTotalCol = {
  headerClassName: `min-w-[6rem] w-[24%] ${numHeaderRight}`,
  cellClassName: `min-w-[6rem] w-[24%] ${numCellRight}`,
} as const
