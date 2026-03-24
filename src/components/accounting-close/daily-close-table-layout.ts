/**
 * Anchos para tablas con `table-fixed` en cards de cierre diario.
 * La columna producto es deliberadamente estrecha (~28%) para que cantidad /
 * precio / total conserven espacio y no se solapen.
 */
export const dailyCloseProductCol = {
  headerClassName:
    "min-w-0 w-[28%] max-w-[28%] whitespace-normal align-top [word-break:break-word]",
  cellClassName:
    "min-w-0 w-[28%] max-w-[28%] whitespace-normal break-words align-top [overflow-wrap:anywhere]",
} as const

const numHeaderRight =
  "whitespace-nowrap text-right [&_button]:justify-end [&_button]:w-full [&_button]:lg:pr-4"
const numCellRight = "whitespace-nowrap text-right tabular-nums"

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
