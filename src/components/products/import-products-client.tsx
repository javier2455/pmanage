"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  ArrowLeft,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  PackagePlus,
  RefreshCw,
  Copy,
  Store,
  ChevronDown,
} from "lucide-react";
import { sileo } from "sileo";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/context/business-context";
import { useImportProductsMutation } from "@/hooks/use-product";
import { getAllProductOfMyBusinesses } from "@/lib/api/business";
import type {
  ImportDuplicateStrategy,
  ImportResult,
  ImportTarget,
} from "@/lib/types/product";
import {
  IMPORT_COLUMNS,
  type ImportColumnKey,
  type RawRow,
  validateHeaders,
  validateRow,
  toImportItem,
  downloadTemplateCsv,
  downloadTemplateXlsx,
  type HeaderValidation,
} from "@/lib/products-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MAX_ROWS = 500;

type ParsedFile = { fields: string[]; data: Record<string, string>[] };
type EditableRow = { id: number; values: RawRow };

/**
 * Convierte la matriz de un Excel (filas de celdas, la 1.ª son encabezados) al
 * mismo formato `{ fields, data }` que produce papaparse con `header:true`, para
 * reutilizar exactamente la misma validación y vista previa que el CSV.
 */
function matrixToTable(matrix: unknown[][]): {
  fields: string[];
  data: Record<string, string>[];
} {
  const rows = matrix.filter((r) =>
    r.some((c) => String(c ?? "").trim() !== ""),
  );
  if (rows.length === 0) return { fields: [], data: [] };
  const headerRow = rows[0].map((h) => String(h ?? "").trim());
  const fields = headerRow.filter(Boolean);
  const data = rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headerRow.forEach((h, i) => {
      if (h) obj[h] = String(r[i] ?? "");
    });
    return obj;
  });
  return { fields, data };
}

export function ImportProductsClient() {
  const router = useRouter();
  const { activeBusinessId, businesses } = useBusiness();
  const importMutation = useImportProductsMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [target, setTargetState] = useState<ImportTarget>("catalog+sale");
  const [duplicateStrategy, setDuplicateStrategyState] =
    useState<ImportDuplicateStrategy>("skip");
  const [registerAsExpense, setRegisterAsExpenseState] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [onlyValid, setOnlyValid] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  // Resultado de un dry-run pendiente de confirmación (paso previo a importar).
  const [preview, setPreview] = useState<ImportResult | null>(null);
  // "Copiar de otro negocio": panel abierto y negocio origen que está cargando.
  const [showCopy, setShowCopy] = useState(false);
  const [copyLoadingId, setCopyLoadingId] = useState<string | null>(null);

  const withSale = target === "catalog+sale";
  // Otros negocios del usuario, como posibles orígenes para copiar el catálogo.
  const otherBusinesses = useMemo(
    () => businesses.filter((b) => b.id !== activeBusinessId),
    [businesses, activeBusinessId],
  );

  // Cambiar destino o estrategia invalida cualquier preview y resultado previo.
  function setTarget(next: ImportTarget) {
    setTargetState(next);
    setPreview(null);
    setResult(null);
  }
  function setDuplicateStrategy(next: ImportDuplicateStrategy) {
    setDuplicateStrategyState(next);
    setPreview(null);
  }
  function setRegisterAsExpense(next: boolean) {
    setRegisterAsExpenseState(next);
    setPreview(null);
  }

  // Validación de encabezados (depende del destino).
  const headerValidation: HeaderValidation | null = useMemo(() => {
    if (!parsed) return null;
    return validateHeaders(parsed.fields, target);
  }, [parsed, target]);

  // Validación por fila + detección de duplicados en el archivo.
  const validations = useMemo(
    () => rows.map((r) => validateRow(r.values, target)),
    [rows, target],
  );

  const duplicateFlags = useMemo(() => {
    const seen = new Set<string>();
    return rows.map((r) => {
      const key = (r.values.productName ?? "").trim().toLowerCase();
      if (!key) return false;
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });
  }, [rows]);

  const counters = useMemo(() => {
    let withError = 0;
    let duplicates = 0;
    validations.forEach((v, i) => {
      if (Object.keys(v.errors).length > 0) withError++;
      else if (duplicateFlags[i]) duplicates++;
    });
    const valid = rows.length - withError - duplicates;
    return { total: rows.length, valid, withError, duplicates };
  }, [validations, duplicateFlags, rows.length]);

  const structureOk = headerValidation?.ok ?? false;
  const canImport =
    structureOk &&
    rows.length > 0 &&
    (onlyValid ? counters.valid > 0 : counters.withError === 0);

  /**
   * Carga común (archivo o pegado): valida tamaño/estructura mínima, mapea cada
   * fila a valores por campo canónico y refresca el grid.
   */
  function loadParsed(
    fields: string[],
    data: Record<string, string>[],
    sourceName: string,
  ): boolean {
    if (fields.length === 0) {
      setParseError(
        "No se detectaron columnas. Asegúrate de incluir la fila de encabezados de la plantilla (nombre, unidad, precio…).",
      );
      setParsed(null);
      setRows([]);
      return false;
    }
    if (data.length === 0) {
      setParseError(
        "No hay filas con datos. Completa la plantilla con tus productos.",
      );
      setParsed(null);
      setRows([]);
      return false;
    }
    if (data.length > MAX_ROWS) {
      setParseError(
        `Hay ${data.length} filas. El máximo por importación es ${MAX_ROWS}. Divídelo en varios lotes.`,
      );
      setParsed(null);
      setRows([]);
      return false;
    }
    setFileName(sourceName);
    setParsed({ fields, data });
    const hv = validateHeaders(fields, target);
    const built: EditableRow[] = data.map((raw, idx) => {
      const values: RawRow = {};
      for (const [rawHeader, key] of hv.mapping.entries()) {
        values[key] = (raw[rawHeader] ?? "").toString();
      }
      return { id: idx, values };
    });
    setRows(built);
    return true;
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setPreview(null);
    setParseError(null);

    const lower = file.name.toLowerCase();
    const isExcel = lower.endsWith(".xlsx") || lower.endsWith(".xls");

    if (isExcel) {
      // El .xlsx se lee en el navegador (SheetJS, carga diferida) y se pasa por
      // la MISMA tubería que el CSV para conservar la vista previa editable.
      try {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        if (!sheet) {
          setParseError("El archivo de Excel no tiene ninguna hoja con datos.");
          return;
        }
        // header:1 → matriz de filas; raw:false → celdas ya formateadas a texto.
        const matrix = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          blankrows: false,
          raw: false,
        }) as unknown[][];
        const { fields, data } = matrixToTable(matrix);
        loadParsed(fields, data, file.name);
      } catch (err) {
        setParseError(
          `No se pudo leer el Excel: ${err instanceof Error ? err.message : "archivo no válido"}. Verifica que sea un .xlsx con la estructura de la plantilla.`,
        );
      }
      return;
    }

    // CSV
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const fields = (res.meta.fields ?? []).filter(Boolean);
        const data = (res.data ?? []).filter((r) =>
          Object.values(r).some((v) => (v ?? "").toString().trim() !== ""),
        );
        loadParsed(fields, data, file.name);
      },
      error: (err) => {
        setParseError(`No se pudo leer el archivo: ${err.message}`);
      },
    });
  }

  /**
   * Copiar catálogo desde otro negocio del usuario: trae los productos que ya
   * están a la venta allí y precarga el grid (reutiliza toda la tubería del
   * import). El **stock se carga en 0** — cada negocio tiene su propio inventario;
   * el usuario lo ajusta antes de importar.
   */
  async function handleCopyFromBusiness(sourceId: string, sourceName: string) {
    setCopyLoadingId(sourceId);
    setResult(null);
    setPreview(null);
    setParseError(null);
    try {
      const res = await getAllProductOfMyBusinesses({ businessId: sourceId });
      const list: Array<Record<string, unknown>> = Array.isArray(res?.data)
        ? res.data
        : [];
      if (list.length === 0) {
        setParseError(
          `El negocio "${sourceName}" no tiene productos a la venta para copiar.`,
        );
        return;
      }
      const fields = IMPORT_COLUMNS.map((c) => c.header);
      const data = list.map((bp) => {
        const product = (bp.product ?? {}) as Record<string, unknown>;
        const category = (bp.category ?? null) as Record<string, unknown> | null;
        const str = (v: unknown) => (v == null ? "" : String(v));
        const kv: Record<ImportColumnKey, string> = {
          productName: str(product.name),
          productDescription: str(product.description),
          productUnit: str(product.unit),
          categoryName: str(category?.name),
          price: str(bp.price),
          // El precio guardado ya está en CUP, aunque se cotizara en divisa:
          // copiar aquí `bp.priceCurrency` haría que el backend lo convirtiera
          // por segunda vez.
          priceCurrency: "",
          entryPrice: str(bp.entryPrice),
          currency: "", // el costo guardado ya está en CUP
          stock: "0", // cada negocio tiene su propio inventario
          stockAlertThreshold: str(bp.stockAlertThreshold),
        };
        const obj: Record<string, string> = {};
        for (const c of IMPORT_COLUMNS) obj[c.header] = kv[c.key] ?? "";
        return obj;
      });
      if (loadParsed(fields, data, `Copiado de: ${sourceName}`)) {
        setShowCopy(false);
      }
    } catch {
      setParseError(
        "No se pudieron cargar los productos del negocio seleccionado. Intenta de nuevo.",
      );
    } finally {
      setCopyLoadingId(null);
    }
  }

  function updateCell(rowId: number, key: ImportColumnKey, value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, values: { ...r.values, [key]: value } } : r,
      ),
    );
    // Cualquier edición invalida el preview del dry-run.
    setPreview(null);
  }

  function reset() {
    setFileName(null);
    setParsed(null);
    setRows([]);
    setParseError(null);
    setResult(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Descarga en Excel por defecto; si SheetJS no cargara, cae a CSV.
  async function handleDownloadTemplate() {
    try {
      await downloadTemplateXlsx();
    } catch {
      downloadTemplateCsv();
      sileo.error({
        title: "Se descargó en CSV",
        description:
          "No se pudo generar el Excel; te descargamos la plantilla en CSV (misma estructura).",
        styles: { description: "text-[#dc2626]/90! text-[15px]!" },
      });
    }
  }

  async function handleImport(dryRun: boolean) {
    if (!activeBusinessId) {
      sileo.error({
        title: "Sin negocio activo",
        description: "Selecciona un negocio antes de importar.",
        styles: { description: "text-[#dc2626]/90! text-[15px]!" },
      });
      return;
    }
    // Enviar solo filas sin errores de campo. El backend deduplica y omite las
    // que ya están a la venta o repetidas en el archivo.
    const items = rows
      .map((r, i) => ({ r, v: validations[i] }))
      .filter(({ v }) => Object.keys(v.errors).length === 0)
      .map(({ v }) => toImportItem(v.item));

    if (items.length === 0) {
      sileo.error({
        title: "Nada que importar",
        description: "No hay filas válidas. Corrige los errores marcados.",
        styles: { description: "text-[#dc2626]/90! text-[15px]!" },
      });
      return;
    }

    try {
      const response = await importMutation.mutateAsync({
        businessId: activeBusinessId,
        payload: {
          items,
          target,
          mode: "tolerant",
          ...(withSale ? { duplicateStrategy } : {}),
          ...(withSale && registerAsExpense
            ? { registerAsExpense: true }
            : {}),
        },
        dryRun,
      });
      if (dryRun) {
        // El dry-run alimenta el panel de confirmación, no el reporte final.
        setPreview(response.data);
      } else {
        setResult(response.data);
        setPreview(null);
        sileo.success({
          title: "Importación completada",
          fill: "",
          styles: {
            title: "text-white! text-[16px]! font-bold!",
            description: "text-white/90! text-[15px]!",
          },
          description: `Se registraron ${response.data.businessProductsCreated || response.data.productsCreated} productos.`,
        });
      }
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      sileo.error({
        title: "Error al importar",
        description:
          (message as string) ||
          "No se pudo completar la importación. Intenta de nuevo.",
        styles: { description: "text-[#dc2626]/90! text-[15px]!" },
      });
    }
  }

  return (
    <section className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/business/products"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Importar productos
          </h1>
          <p className="text-muted-foreground">
            Carga muchos productos de una sola vez desde una plantilla CSV
          </p>
        </div>
      </div>

      {/* Resultado final */}
      {result && (
        <ImportReport
          result={result}
          onGoToProducts={() => router.push("/dashboard/business/products")}
          onImportMore={reset}
        />
      )}

      {!result && (
        <>
          {/* Paso 1: destino + plantilla + archivo */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-card-foreground">
                    1. Prepara y sube tu archivo
                  </CardTitle>
                  <CardDescription>
                    Descarga la plantilla, complétala en Excel y súbela como
                    Excel (.xlsx) o CSV
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Copiar catálogo desde otro negocio */}
              {otherBusinesses.length > 0 && (
                <div className="flex flex-col gap-2" data-tour="products-import-copy-btn">
                  <Button
                    type="button"
                    variant="outline"
                    className="self-start"
                    onClick={() => setShowCopy((s) => !s)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar de otro negocio
                  </Button>
                  {showCopy && (
                    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3">
                      <span className="text-sm font-medium text-card-foreground">
                        Trae los productos de otro de tus negocios a este
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Se cargan nombre, categoría, precio y costo en el grid.
                        El <b>stock se carga en 0</b> (cada negocio tiene su
                        propio inventario): ajústalo antes de importar.
                      </p>
                      <div className="flex flex-col gap-2">
                        {otherBusinesses.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            disabled={copyLoadingId != null}
                            onClick={() => handleCopyFromBusiness(b.id, b.name)}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50",
                              copyLoadingId != null && "opacity-60",
                            )}
                          >
                            <Store className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-card-foreground">
                              {b.name}
                            </span>
                            {copyLoadingId === b.id && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                Cargando…
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Plantilla + subida */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      data-tour="products-import-template-btn"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar plantilla
                      <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={handleDownloadTemplate}>
                      Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadTemplateCsv()}>
                      CSV (.csv)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={handleFile}
                  aria-label="Subir archivo Excel o CSV de productos"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  data-tour="products-import-upload-btn"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {fileName ? "Cambiar archivo" : "Subir Excel o CSV"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Formatos aceptados: Excel (.xlsx) y CSV. Descarga la plantilla
                (en Excel o CSV), complétala y súbela en cualquiera de los dos
                formatos: misma estructura de columnas.
              </p>

              {fileName && (
                <p className="text-sm text-muted-foreground">
                  Origen: <span className="font-medium">{fileName}</span>
                </p>
              )}

              <ColumnsHelp target={target} />
            </CardContent>
          </Card>

          {/* Errores de parseo */}
          {parseError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Problemas de estructura (encabezados) */}
          {headerValidation && !headerValidation.ok && (
            <HeaderIssues headerValidation={headerValidation} />
          )}
          {headerValidation &&
            headerValidation.ok &&
            headerValidation.unknown.length > 0 && (
              <HeaderIssues headerValidation={headerValidation} warningOnly />
            )}

          {/* Paso 2: opciones + vista previa editable */}
          {rows.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-card-foreground">
                      2. Configura y revisa
                    </CardTitle>
                    <CardDescription>
                      Elige qué hacer con los productos y corrige las celdas en
                      rojo (pasa el cursor para ver cómo).
                    </CardDescription>
                  </div>
                  {structureOk && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge tone="neutral">{counters.total} filas</Badge>
                      <Badge tone="ok">{counters.valid} válidas</Badge>
                      {counters.withError > 0 && (
                        <Badge tone="error">
                          {counters.withError} con error
                        </Badge>
                      )}
                      {counters.duplicates > 0 && (
                        <Badge tone="warn">
                          {counters.duplicates} duplicadas
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {/* Opciones de la importación */}
                <div className="flex flex-col gap-6">
                  {/* Destino */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-card-foreground">
                      ¿Qué quieres hacer con cada producto?
                    </span>
                    <div className="grid gap-3 sm:grid-cols-2" data-tour="products-import-target">
                      <TargetOption
                        active={target === "catalog+sale"}
                        title="Catálogo + a la venta"
                        description="Crea el producto y lo pone a la venta en este negocio con precio y stock."
                        onClick={() => setTarget("catalog+sale")}
                      />
                      <TargetOption
                        active={target === "catalog"}
                        title="Solo al catálogo"
                        description="Crea los productos en el catálogo. Luego los asignas a un negocio."
                        onClick={() => setTarget("catalog")}
                      />
                    </div>
                  </div>

                  {/* Estrategia ante productos ya a la venta (solo con venta) */}
                  {withSale && (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-card-foreground">
                        Si un producto ya está a la venta en este negocio…
                      </span>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <TargetOption
                          active={duplicateStrategy === "skip"}
                          title="Omitir"
                          description="No lo toca; conserva su precio y stock actuales."
                          onClick={() => setDuplicateStrategy("skip")}
                        />
                        <TargetOption
                          active={duplicateStrategy === "update"}
                          title="Actualizar"
                          description="Reemplaza precio y stock con los del archivo (registra un ajuste de inventario)."
                          onClick={() => setDuplicateStrategy("update")}
                        />
                      </div>
                    </div>
                  )}

                  {/* Registrar la entrada como gasto (solo con venta) */}
                  {withSale && (
                    <label
                      className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3"
                      data-tour="products-import-as-expense"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={registerAsExpense}
                        onCheckedChange={(v) =>
                          setRegisterAsExpense(Boolean(v))
                        }
                      />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-card-foreground">
                          Registrar estas entradas como gasto (reposición de
                          stock)
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Crea un gasto por <b>costo × stock</b> de cada producto
                          nuevo con costo y stock. Úsalo para el <b>inventario
                          inicial</b>; no aplica a los que solo se actualizan.
                        </span>
                      </span>
                    </label>
                  )}
                </div>

                {!structureOk && (
                  <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                    Revisa los problemas de estructura de arriba. Si tu archivo no
                    trae precio/stock, cambia el destino a “Solo al catálogo”.
                  </p>
                )}

                {/* Vista previa editable + importación (requiere estructura válida) */}
                {structureOk && (
                  <div
                    className="flex flex-col gap-4 border-t border-border pt-2"
                    data-tour="products-import-grid"
                  >
                    <PreviewGrid
                      rows={rows}
                      validations={validations}
                      duplicateFlags={duplicateFlags}
                      target={target}
                      onEdit={updateCell}
                    />

                    <div className="flex flex-col gap-3 border-t border-border pt-4">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={onlyValid}
                      onCheckedChange={(v) => {
                        setOnlyValid(Boolean(v));
                        setPreview(null);
                      }}
                    />
                    Importar solo las filas válidas (omitir las que tienen error)
                  </label>

                  {preview ? (
                    <ConfirmPanel
                      preview={preview}
                      withSale={withSale}
                      duplicateStrategy={duplicateStrategy}
                      pending={importMutation.isPending}
                      onConfirm={() => handleImport(false)}
                      onBack={() => setPreview(null)}
                    />
                  ) : (
                    <>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={() => handleImport(true)}
                          disabled={!canImport || importMutation.isPending}
                          data-tour="products-import-continue-btn"
                        >
                          {importMutation.isPending ? (
                            "Validando..."
                          ) : (
                            <>
                              Continuar
                              <span className="ml-1 opacity-80">
                                ({onlyValid ? counters.valid : counters.total})
                              </span>
                            </>
                          )}
                        </Button>
                      </div>
                      {!canImport && counters.withError > 0 && !onlyValid && (
                        <p className="text-right text-xs text-destructive">
                          Corrige los {counters.withError} errores o activa
                          “importar solo las válidas”.
                        </p>
                      )}
                    </>
                  )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </section>
  );
}

/* ── Subcomponentes ──────────────────────────────────────────────────────── */

function TargetOption({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:bg-muted/50",
      )}
    >
      <span className="text-sm font-semibold text-card-foreground">
        {title}
      </span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

function ColumnsHelp({ target }: { target: ImportTarget }) {
  const withSale = target === "catalog+sale";
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-card-foreground">
        <Info className="h-4 w-4 text-primary" />
        Columnas de la plantilla
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 pr-4 font-medium">Columna</th>
              <th className="py-1 pr-4 font-medium">Obligatoria</th>
              <th className="py-1 font-medium">Cómo llenarla</th>
            </tr>
          </thead>
          <tbody>
            {IMPORT_COLUMNS.map((c) => {
              const required = c.requiredAlways || (withSale && c.requiredForSale);
              return (
                <tr key={c.key} className="border-t border-border/60">
                  <td className="py-1.5 pr-4 font-mono text-foreground">
                    {c.header}
                  </td>
                  <td className="py-1.5 pr-4">
                    {required ? (
                      <span className="text-destructive">Sí</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="py-1.5 text-muted-foreground">{c.help}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeaderIssues({
  headerValidation,
  warningOnly = false,
}: {
  headerValidation: HeaderValidation;
  warningOnly?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-4 text-sm",
        warningOnly
          ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4" />
        {warningOnly
          ? "Hay columnas que no se reconocen"
          : "La plantilla no coincide con la estructura esperada"}
      </div>
      {headerValidation.missingRequired.length > 0 && (
        <ul className="ml-6 list-disc space-y-1">
          {headerValidation.missingRequired.map((c) => (
            <li key={c.key}>
              Falta la columna <span className="font-mono">{c.header}</span>.{" "}
              {c.help}
            </li>
          ))}
        </ul>
      )}
      {headerValidation.unknown.length > 0 && (
        <ul className="ml-6 list-disc space-y-1">
          {headerValidation.unknown.map((u) => (
            <li key={u.header}>
              La columna <span className="font-mono">{u.header}</span> no se
              reconoce
              {u.suggestion ? (
                <>
                  . ¿Quisiste decir{" "}
                  <span className="font-mono">{u.suggestion}</span>?
                </>
              ) : (
                " y se ignorará."
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PreviewGrid({
  rows,
  validations,
  duplicateFlags,
  target,
  onEdit,
}: {
  rows: EditableRow[];
  validations: ReturnType<typeof validateRow>[];
  duplicateFlags: boolean[];
  target: ImportTarget;
  onEdit: (rowId: number, key: ImportColumnKey, value: string) => void;
}) {
  const withSale = target === "catalog+sale";
  return (
    <div className="max-h-[28rem] overflow-auto rounded-lg border border-border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            {IMPORT_COLUMNS.map((c) => {
              const required = c.requiredAlways || (withSale && c.requiredForSale);
              return (
                <TableHead key={c.key} className="min-w-[9rem]">
                  {c.header}
                  {required && <span className="text-destructive"> *</span>}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => {
            const v = validations[i];
            const isDup = duplicateFlags[i];
            return (
              <TableRow key={row.id} className={cn(isDup && "bg-amber-500/5")}>
                <TableCell className="text-xs text-muted-foreground">
                  {i + 1}
                  {isDup && (
                    <span
                      title="Nombre duplicado en el archivo; se omitirá."
                      className="ml-1 text-amber-500"
                    >
                      ⚠
                    </span>
                  )}
                </TableCell>
                {IMPORT_COLUMNS.map((c) => {
                  const err = v.errors[c.key];
                  return (
                    <TableCell key={c.key} className="p-1">
                      <Input
                        value={row.values[c.key] ?? ""}
                        onChange={(e) => onEdit(row.id, c.key, e.target.value)}
                        title={err ?? undefined}
                        aria-invalid={err ? "true" : "false"}
                        className={cn(
                          "h-8 text-xs",
                          err &&
                            "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive",
                        )}
                      />
                      {err && (
                        <p className="mt-0.5 max-w-[12rem] text-[10px] leading-tight text-destructive">
                          {err}
                        </p>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ConfirmPanel({
  preview,
  withSale,
  duplicateStrategy,
  pending,
  onConfirm,
  onBack,
}: {
  preview: ImportResult;
  withSale: boolean;
  duplicateStrategy: ImportDuplicateStrategy;
  pending: boolean;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const total =
    preview.productsCreated +
    preview.businessProductsCreated +
    preview.businessProductsUpdated;
  const line = (label: string, value: number) => (
    <li className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </li>
  );
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Info className="h-4 w-4 text-primary" />
        Revisión previa — todavía no se ha guardado nada
      </div>
      <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
        {line("Productos nuevos en el catálogo", preview.productsCreated)}
        {line("Reutilizados del catálogo", preview.productsReused)}
        {withSale && line("Se pondrán a la venta", preview.businessProductsCreated)}
        {withSale &&
          duplicateStrategy === "update" &&
          line("Se actualizarán (ya a la venta)", preview.businessProductsUpdated)}
        {line("Categorías nuevas", preview.categoriesCreated)}
        {preview.expensesCreated > 0 &&
          line("Gastos a registrar", preview.expensesCreated)}
        {preview.planLimit != null &&
          line("Cupo restante del plan", preview.remainingQuota ?? 0)}
      </ul>
      {preview.skipped.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {preview.skipped.length} fila(s) se omitirán (duplicadas o ya a la
          venta). Verás el detalle al terminar.
        </p>
      )}
      {preview.errors.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          <span className="font-medium">
            {preview.errors.length} fila(s) no se importarán por un problema de
            datos:
          </span>
          <ul className="ml-4 mt-1 list-disc space-y-0.5">
            {preview.errors.slice(0, 5).map((er) => (
              <li key={`${er.row}-${er.productName}`}>
                Fila {er.row} · {er.productName}: {er.reason}
              </li>
            ))}
            {preview.errors.length > 5 && (
              <li>… y {preview.errors.length - 5} más.</li>
            )}
          </ul>
        </div>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={pending}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Volver a editar
        </Button>
        <Button type="button" onClick={onConfirm} disabled={pending}>
          <PackagePlus className="mr-2 h-4 w-4" />
          {pending ? "Importando..." : `Confirmar e importar ${total}`}
        </Button>
      </div>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "neutral" | "ok" | "error" | "warn";
  children: React.ReactNode;
}) {
  const toneClass = {
    neutral: "bg-muted text-muted-foreground",
    ok: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    error: "bg-destructive/15 text-destructive",
    warn: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-medium",
        toneClass,
      )}
    >
      {children}
    </span>
  );
}

function ImportReport({
  result,
  onGoToProducts,
  onImportMore,
}: {
  result: ImportResult;
  onGoToProducts: () => void;
  onImportMore: () => void;
}) {
  const stats: { label: string; value: number }[] = [
    { label: "Productos creados", value: result.productsCreated },
    { label: "Reutilizados del catálogo", value: result.productsReused },
    { label: "Puestos a la venta", value: result.businessProductsCreated },
    // Solo aparece si hubo actualizaciones (estrategia "actualizar").
    ...(result.businessProductsUpdated > 0
      ? [{ label: "Actualizados", value: result.businessProductsUpdated }]
      : []),
    { label: "Categorías creadas", value: result.categoriesCreated },
    // Solo si se registraron gastos de reposición de stock.
    ...(result.expensesCreated > 0
      ? [{ label: "Gastos registrados", value: result.expensesCreated }]
      : []),
    // `skipped` ya agrupa duplicados y los que ya estaban a la venta.
    { label: "Omitidos", value: result.skipped.length },
  ];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">
              Importación completada
            </CardTitle>
            <CardDescription>
              {result.totalRows} filas procesadas
              {result.planLimit != null && (
                <> · cupo restante del plan: {result.remainingQuota}</>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border bg-muted/20 p-3"
            >
              <div className="text-2xl font-bold text-foreground">
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {result.skipped.length > 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <div className="mb-1 font-medium text-amber-700 dark:text-amber-400">
              Filas omitidas ({result.skipped.length})
            </div>
            <ul className="ml-5 list-disc space-y-0.5 text-amber-700/90 dark:text-amber-400/90">
              {result.skipped.slice(0, 10).map((s) => (
                <li key={`${s.row}-${s.productName}`}>
                  Fila {s.row} · {s.productName}: {s.reason}
                </li>
              ))}
              {result.skipped.length > 10 && (
                <li>… y {result.skipped.length - 10} más.</li>
              )}
            </ul>
          </div>
        )}

        {result.errors.length > 0 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <div className="mb-1 font-medium">
              Filas con error ({result.errors.length})
            </div>
            <ul className="ml-5 list-disc space-y-0.5">
              {result.errors.slice(0, 10).map((er) => (
                <li key={`${er.row}-${er.productName}`}>
                  Fila {er.row} · {er.productName}: {er.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onImportMore}>
            Importar otro archivo
          </Button>
          <Button type="button" onClick={onGoToProducts}>
            Ir a productos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
