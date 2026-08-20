/** Clases que las columnas cuelgan de `columnDef.meta` para alinear celdas. */
export type ColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

/**
 * Lee el `meta` de una columna de TanStack Table, que llega tipado como
 * `unknown`. Devuelve `{}` cuando la columna no declara ninguno, para poder
 * encadenar `.headerClassName` en el JSX sin comprobar nada.
 */
export function columnMeta(column: {
  columnDef: { meta?: unknown };
}): ColumnMeta {
  const meta = column.columnDef.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as ColumnMeta;
  }
  return {};
}
