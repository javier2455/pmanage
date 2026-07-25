import type { ImportProductItem, ImportTarget } from "@/lib/types/product";

/* ────────────────────────────────────────────────────────────────────────────
 * Utilidades para la importación masiva de productos desde CSV.
 * Define la plantilla (una sola, fija), normaliza encabezados, valida cada celda
 * con mensajes accionables y genera el archivo de plantilla descargable.
 * ──────────────────────────────────────────────────────────────────────────── */

export const IMPORT_UNITS = ["kg", "lb", "g", "L", "mL", "ud"] as const;
export type ImportUnit = (typeof IMPORT_UNITS)[number];

export type ImportColumnKey =
  | "productName"
  | "productDescription"
  | "productUnit"
  | "categoryName"
  | "price"
  | "entryPrice"
  | "currency"
  | "stock"
  | "stockAlertThreshold";

export type ColumnType = "string" | "number" | "int" | "unit" | "currency";

/**
 * Monedas admitidas para el COSTO (deben existir como tasa en el negocio). Deben
 * coincidir con las columnas de `MonetaryExchange` en el backend. `CUP` = base.
 */
export const IMPORT_CURRENCIES = [
  "CUP",
  "USD",
  "EURO",
  "MLC",
  "CLASICA",
  "CUP_TRANSFERENCIA",
  "CAD",
  "GBP",
  "CHF",
  "MXN",
  "JPY",
] as const;
export type ImportCurrency = (typeof IMPORT_CURRENCIES)[number];

export interface ImportColumnDef {
  key: ImportColumnKey;
  /** Encabezado canónico (el que lleva la plantilla). */
  header: string;
  /** Encabezados alternativos aceptados (se comparan normalizados). */
  aliases: string[];
  /** Requerido siempre (catálogo). */
  requiredAlways: boolean;
  /** Requerido solo cuando el destino incluye venta. */
  requiredForSale: boolean;
  type: ColumnType;
  example: string;
  /** Ayuda accionable que se muestra al usuario. */
  help: string;
}

export const IMPORT_COLUMNS: ImportColumnDef[] = [
  {
    key: "productName",
    header: "nombre",
    aliases: ["producto", "nombre_producto", "name"],
    requiredAlways: true,
    requiredForSale: false,
    type: "string",
    example: "Arroz Blanco",
    help: "Nombre del producto. Obligatorio y único (no repitas el mismo nombre).",
  },
  {
    key: "productDescription",
    header: "descripcion",
    aliases: ["descripción", "desc", "description"],
    requiredAlways: false,
    requiredForSale: false,
    type: "string",
    example: "Arroz de primera calidad",
    help: "Descripción breve (opcional).",
  },
  {
    key: "productUnit",
    header: "unidad",
    aliases: ["unit", "medida", "um"],
    requiredAlways: true,
    requiredForSale: false,
    type: "unit",
    example: "kg",
    help: `Unidad de medida. Usa una de: ${IMPORT_UNITS.join(", ")}.`,
  },
  {
    key: "categoryName",
    header: "categoria",
    aliases: ["categoría", "category", "rubro"],
    requiredAlways: false,
    requiredForSale: false,
    type: "string",
    example: "Granos",
    help: "Nombre de la categoría. Si no existe en el negocio, se crea automáticamente.",
  },
  {
    key: "price",
    header: "precio",
    aliases: ["precio_venta", "price", "pvp"],
    requiredAlways: false,
    requiredForSale: true,
    type: "number",
    example: "150",
    help: "Precio de venta en CUP (mayor que 0). Requerido para poner a la venta.",
  },
  {
    key: "entryPrice",
    header: "costo",
    aliases: ["precio_entrada", "precio_costo", "entry_price", "cost"],
    requiredAlways: false,
    requiredForSale: false,
    type: "number",
    example: "120",
    help: "Costo de entrada (opcional; sirve para calcular ganancias). En la moneda de la columna 'moneda'.",
  },
  {
    key: "currency",
    header: "moneda",
    aliases: ["moneda_costo", "currency", "divisa"],
    requiredAlways: false,
    requiredForSale: false,
    type: "currency",
    example: "",
    help: `Moneda del COSTO (opcional; por defecto CUP). Debe tener tasa configurada en el negocio. Válidas: ${IMPORT_CURRENCIES.join(", ")}.`,
  },
  {
    key: "stock",
    header: "stock",
    aliases: ["existencia", "cantidad", "inventario"],
    requiredAlways: false,
    requiredForSale: true,
    type: "number",
    example: "100",
    help: "Cantidad en stock (>= 0). Requerido para poner a la venta.",
  },
  {
    key: "stockAlertThreshold",
    header: "umbral_alerta_stock",
    aliases: ["umbral", "stock_alert_threshold", "alerta_stock"],
    requiredAlways: false,
    requiredForSale: false,
    type: "int",
    example: "",
    help: "Umbral de alerta de stock bajo (entero >= 1, opcional; función Pro).",
  },
];

/** trim + minúsculas + sin acentos + espacios→"_". Para comparar encabezados. */
export function normalizeHeader(h: string): string {
  return (h ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/** Mapa normalizedHeader → key, a partir de headers canónicos + alias. */
const HEADER_TO_KEY: Map<string, ImportColumnKey> = (() => {
  const map = new Map<string, ImportColumnKey>();
  for (const col of IMPORT_COLUMNS) {
    map.set(normalizeHeader(col.header), col.key);
    for (const a of col.aliases) map.set(normalizeHeader(a), col.key);
  }
  return map;
})();

/** Distancia de Levenshtein (para sugerir el encabezado correcto). */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function suggestHeader(normalized: string): string | undefined {
  let best: string | undefined;
  let bestDist = Infinity;
  for (const col of IMPORT_COLUMNS) {
    const d = levenshtein(normalized, normalizeHeader(col.header));
    if (d < bestDist) {
      bestDist = d;
      best = col.header;
    }
  }
  // Solo sugerir si es razonablemente cercano.
  return bestDist <= 3 ? best : undefined;
}

export interface HeaderValidation {
  ok: boolean;
  /** headerRaw → key, para leer cada celda por su campo. */
  mapping: Map<string, ImportColumnKey>;
  missingRequired: ImportColumnDef[];
  unknown: { header: string; suggestion?: string }[];
}

/**
 * Valida los encabezados del archivo contra la plantilla canónica.
 * Requerido = requeridos siempre + (si hay venta) requeridos para venta.
 */
export function validateHeaders(
  rawHeaders: string[],
  target: ImportTarget,
): HeaderValidation {
  const mapping = new Map<string, ImportColumnKey>();
  const unknown: { header: string; suggestion?: string }[] = [];
  const presentKeys = new Set<ImportColumnKey>();

  for (const raw of rawHeaders) {
    const norm = normalizeHeader(raw);
    if (!norm) continue;
    const key = HEADER_TO_KEY.get(norm);
    if (key) {
      mapping.set(raw, key);
      presentKeys.add(key);
    } else {
      unknown.push({ header: raw, suggestion: suggestHeader(norm) });
    }
  }

  const withSale = target === "catalog+sale";
  const missingRequired = IMPORT_COLUMNS.filter((c) => {
    const required = c.requiredAlways || (withSale && c.requiredForSale);
    return required && !presentKeys.has(c.key);
  });

  return {
    ok: missingRequired.length === 0,
    mapping,
    missingRequired,
    unknown,
  };
}

/** Convierte "1.234,56" o "1,234.56" o "150" a número; null si vacío/ inválido. */
function parseNumber(raw: string): { value: number | null; invalid: boolean } {
  const s = (raw ?? "").trim();
  if (!s) return { value: null, invalid: false };
  // Si tiene coma decimal (formato ES: "1.234,56" o "150,50"), normalizar.
  let norm = s;
  if (/,\d{1,2}$/.test(s) || (s.includes(",") && !s.includes("."))) {
    norm = s.replace(/\./g, "").replace(",", ".");
  }
  norm = norm.replace(/\s/g, "");
  const n = Number(norm);
  if (!Number.isFinite(n)) return { value: null, invalid: true };
  return { value: n, invalid: false };
}

function normalizeUnit(raw: string): ImportUnit | null {
  const s = (raw ?? "").trim().toLowerCase();
  const map: Record<string, ImportUnit> = {
    kg: "kg",
    lb: "lb",
    g: "g",
    l: "L",
    ml: "mL",
    ud: "ud",
    u: "ud",
    unidad: "ud",
    litro: "L",
    litros: "L",
  };
  return map[s] ?? null;
}

/** Normaliza el código de moneda; acepta alias comunes (EUR→EURO). null si no es válido. */
function normalizeCurrency(raw: string): ImportCurrency | null {
  const s = (raw ?? "").trim().toUpperCase().replace(/\s+/g, "_");
  if (!s) return null;
  const aliases: Record<string, ImportCurrency> = {
    EUR: "EURO",
    EURO: "EURO",
    DOLAR: "USD",
    DÓLAR: "USD",
    USD: "USD",
    TRANSFERENCIA: "CUP_TRANSFERENCIA",
    CUP_TRANSFERENCIA: "CUP_TRANSFERENCIA",
  };
  if (aliases[s]) return aliases[s];
  return (IMPORT_CURRENCIES as readonly string[]).includes(s)
    ? (s as ImportCurrency)
    : null;
}

/** Fila cruda de valores por campo (ya mapeados desde el header). */
export type RawRow = Partial<Record<ImportColumnKey, string>>;

export interface RowValidation {
  item: ImportProductItem;
  /** Errores por campo (columna → mensaje accionable). */
  errors: Partial<Record<ImportColumnKey, string>>;
}

/**
 * Valida y coacciona una fila. Devuelve el item tipado (para enviar) y los
 * errores por campo con mensajes que dicen qué está mal y cómo arreglarlo.
 */
export function validateRow(raw: RawRow, target: ImportTarget): RowValidation {
  const errors: Partial<Record<ImportColumnKey, string>> = {};
  const withSale = target === "catalog+sale";

  // Nombre
  const productName = (raw.productName ?? "").trim();
  if (!productName) {
    errors.productName = "Escribe el nombre del producto (no puede quedar vacío).";
  } else if (productName.length > 255) {
    errors.productName = "El nombre es demasiado largo (máx. 255 caracteres).";
  }

  // Unidad
  let productUnit: ImportUnit = "ud";
  const unitRaw = (raw.productUnit ?? "").trim();
  if (!unitRaw) {
    errors.productUnit = `Falta la unidad. Usa una de: ${IMPORT_UNITS.join(", ")}.`;
  } else {
    const u = normalizeUnit(unitRaw);
    if (!u) {
      errors.productUnit = `"${unitRaw}" no es una unidad válida. Usa una de: ${IMPORT_UNITS.join(", ")}.`;
    } else {
      productUnit = u;
    }
  }

  // Precio
  let price: number | undefined;
  const priceParsed = parseNumber(raw.price ?? "");
  if (priceParsed.invalid) {
    errors.price = "El precio debe ser un número (por ejemplo 150).";
  } else if (priceParsed.value != null) {
    price = priceParsed.value;
    if (price <= 0) errors.price = "El precio debe ser mayor que 0.";
  }
  if (withSale && price == null && !errors.price) {
    errors.price = "Falta el precio de venta (requerido para poner a la venta).";
  }

  // Stock
  let stock: number | undefined;
  const stockParsed = parseNumber(raw.stock ?? "");
  if (stockParsed.invalid) {
    errors.stock = "El stock debe ser un número (por ejemplo 100).";
  } else if (stockParsed.value != null) {
    stock = stockParsed.value;
    if (stock < 0) errors.stock = "El stock no puede ser negativo.";
  }
  if (withSale && stock == null && !errors.stock) {
    errors.stock = "Falta el stock (requerido para poner a la venta).";
  }

  // Costo
  let entryPrice: number | undefined;
  const entryParsed = parseNumber(raw.entryPrice ?? "");
  if (entryParsed.invalid) {
    errors.entryPrice = "El costo debe ser un número (por ejemplo 120).";
  } else if (entryParsed.value != null) {
    entryPrice = entryParsed.value;
    if (entryPrice < 0) errors.entryPrice = "El costo no puede ser negativo.";
  }

  // Umbral de alerta
  let stockAlertThreshold: number | undefined;
  const satParsed = parseNumber(raw.stockAlertThreshold ?? "");
  if (satParsed.invalid) {
    errors.stockAlertThreshold = "Debe ser un número entero (por ejemplo 5).";
  } else if (satParsed.value != null) {
    stockAlertThreshold = satParsed.value;
    if (!Number.isInteger(stockAlertThreshold) || stockAlertThreshold < 1)
      errors.stockAlertThreshold = "Debe ser un entero mayor o igual a 1.";
  }

  // Moneda del costo (opcional; por defecto CUP). La tasa la resuelve el backend.
  let currency: ImportCurrency | undefined;
  const currencyRaw = (raw.currency ?? "").trim();
  if (currencyRaw) {
    const c = normalizeCurrency(currencyRaw);
    if (!c) {
      errors.currency = `"${currencyRaw}" no es una moneda válida. Usa una de: ${IMPORT_CURRENCIES.join(", ")}.`;
    } else {
      currency = c;
    }
  }

  const item: ImportProductItem = {
    productName,
    productDescription: (raw.productDescription ?? "").trim() || undefined,
    productUnit,
    categoryName: (raw.categoryName ?? "").trim() || undefined,
    price,
    entryPrice,
    currency,
    stock,
    stockAlertThreshold,
  };

  return { item, errors };
}

/** Campos que se envían al backend (limpia undefined). */
export function toImportItem(item: ImportProductItem): ImportProductItem {
  const clean: ImportProductItem = {
    productName: item.productName.trim(),
    productUnit: item.productUnit,
  };
  if (item.productDescription) clean.productDescription = item.productDescription;
  if (item.categoryName) clean.categoryName = item.categoryName;
  if (item.price != null) clean.price = item.price;
  if (item.entryPrice != null) clean.entryPrice = item.entryPrice;
  // Solo se envía la moneda si difiere de CUP (el backend asume CUP por defecto).
  if (item.currency && item.currency !== "CUP") clean.currency = item.currency;
  if (item.stock != null) clean.stock = item.stock;
  if (item.stockAlertThreshold != null)
    clean.stockAlertThreshold = item.stockAlertThreshold;
  return clean;
}

/** Escapa un valor para CSV (comillas dobles si hace falta). */
function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Matriz de la plantilla (encabezados + 2 filas de ejemplo) como array de arrays.
 * Fuente única reutilizada por el generador CSV y el de Excel.
 */
export function templateRows(): string[][] {
  const headers = IMPORT_COLUMNS.map((c) => c.header);
  const example1: Record<ImportColumnKey, string> = {
    productName: "Arroz Blanco",
    productDescription: "Arroz de primera calidad",
    productUnit: "kg",
    categoryName: "Granos",
    price: "150",
    entryPrice: "120",
    currency: "",
    stock: "100",
    stockAlertThreshold: "",
  };
  const example2: Record<ImportColumnKey, string> = {
    productName: "Aceite Vegetal",
    productDescription: "",
    productUnit: "L",
    categoryName: "Aceites",
    price: "600",
    entryPrice: "520",
    currency: "",
    stock: "40",
    stockAlertThreshold: "5",
  };
  const rows = [example1, example2].map((ex) =>
    IMPORT_COLUMNS.map((c) => ex[c.key]),
  );
  return [headers, ...rows];
}

/**
 * Genera el contenido de la plantilla CSV con BOM UTF-8 (para que Excel muestre
 * bien los acentos) e incluye dos filas de ejemplo.
 */
export function buildTemplateCsv(): string {
  const lines = templateRows().map((row) => row.map(csvCell).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** Dispara la descarga de un Blob con el nombre dado. */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Descarga la plantilla como archivo .csv. */
export function downloadTemplateCsv(
  filename = "plantilla-productos.csv",
): void {
  const blob = new Blob([buildTemplateCsv()], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(blob, filename);
}

/**
 * Descarga la plantilla como archivo Excel (.xlsx). Usa SheetJS con carga
 * diferida (igual que la lectura de Excel) para no engordar el bundle inicial.
 */
export async function downloadTemplateXlsx(
  filename = "plantilla-productos.xlsx",
): Promise<void> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet(templateRows());
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  XLSX.writeFile(wb, filename);
}
