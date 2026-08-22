"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageComposer } from "@/components/product-list-share/message-composer";
import { MessagePreview } from "@/components/product-list-share/message-preview";
import { ProductSelector } from "@/components/product-list-share/product-selector";
import { TemplateBar } from "@/components/product-list-share/template-bar";
import { useBusiness } from "@/context/business-context";
import { useAllProductOfMyBusinesses } from "@/hooks/use-business";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useCreateProductListTemplateMutation,
  useDeleteProductListTemplateMutation,
  useProductListPreviewQuery,
  useProductListRecipientsQuery,
  useProductListTemplatesQuery,
  useSendProductListMutation,
} from "@/hooks/use-product-list";
import { toastApiError, toastError, toastSuccess } from "@/lib/toast";
import {
  DEFAULT_PRODUCT_LIST_OPTIONS,
  type ProductListOptions,
  type ProductListTemplate,
  type SelectableBusinessProduct,
} from "@/lib/types/product-list";
import { MAX_PRODUCTS_PER_LIST } from "@/lib/validations/product-list";

const BUSINESS_RECIPIENT_ID = "business";
const PREVIEW_DEBOUNCE_MS = 400;

export default function ProductListBroadcastPage() {
  const { activeBusinessId } = useBusiness();

  const [search, setSearch] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [intro, setIntro] = useState("");
  const [outro, setOutro] = useState("");
  const [options, setOptions] = useState<ProductListOptions>(
    DEFAULT_PRODUCT_LIST_OPTIONS,
  );
  const [recipientId, setRecipientId] = useState(BUSINESS_RECIPIENT_ID);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim());

  const productsQuery = useAllProductOfMyBusinesses(
    activeBusinessId ?? "",
    debouncedSearch,
  );
  const products: SelectableBusinessProduct[] = useMemo(
    () => productsQuery.data?.data ?? [],
    [productsQuery.data],
  );

  const recipientsQuery = useProductListRecipientsQuery(
    activeBusinessId ?? undefined,
  );
  const templatesQuery = useProductListTemplatesQuery(
    activeBusinessId ?? undefined,
  );

  // La previa se pide con retardo: sin él, cada tecla de la introducción
  // lanzaría una petición.
  const previewPayload = useDebouncedValue(
    {
      businessId: activeBusinessId ?? "",
      productIds: selectedIds,
      intro: intro.trim() || undefined,
      outro: outro.trim() || undefined,
      options,
    },
    PREVIEW_DEBOUNCE_MS,
  );
  const previewQuery = useProductListPreviewQuery(
    previewPayload,
    !!activeBusinessId,
  );

  const sendMutation = useSendProductListMutation();
  const createTemplate = useCreateProductListTemplateMutation();
  const deleteTemplate = useDeleteProductListTemplateMutation();

  const recipients = recipientsQuery.data ?? [];
  const templates = templatesQuery.data ?? [];
  const hasSelection = selectedIds.length > 0;

  /**
   * Carga una plantilla resolviendo su criterio contra el inventario actual:
   * las categorías guardadas mandan, menos lo que se excluyó a mano. Así una
   * plantilla vieja nunca falla ni publica productos que ya no existen.
   */
  function handleLoadTemplate(template: ProductListTemplate | null) {
    setActiveTemplateId(template?.id ?? null);
    if (!template) return;

    setIntro(template.intro ?? "");
    setOutro(template.outro ?? "");
    setOptions({ ...DEFAULT_PRODUCT_LIST_OPTIONS, ...template.options });
    setOnlyInStock(template.onlyInStock);

    const categories = template.categoryIds;
    const excluded = new Set(template.excludedProductIds ?? []);
    const resolved = products.filter((product) => {
      if (excluded.has(product.id)) return false;
      if (template.onlyInStock && Number(product.stock) <= 0) return false;
      if (!categories || categories.length === 0) return true;
      return product.category ? categories.includes(product.category.id) : false;
    });

    setSelectedIds(resolved.map((product) => product.id));
  }

  /**
   * Deriva el criterio de lo que hay seleccionado: las categorías presentes en
   * la selección, y como exclusiones los productos de esas mismas categorías
   * que el usuario dejó fuera.
   */
  function handleSaveTemplate(name: string) {
    if (!activeBusinessId) return;

    const selected = new Set(selectedIds);
    const categoryIds = [
      ...new Set(
        products
          .filter((product) => selected.has(product.id) && product.category)
          .map((product) => product.category!.id),
      ),
    ];
    const excludedProductIds = products
      .filter(
        (product) =>
          !selected.has(product.id) &&
          product.category &&
          categoryIds.includes(product.category.id),
      )
      .map((product) => product.id);

    createTemplate.mutate(
      {
        businessId: activeBusinessId,
        name,
        intro: intro.trim() || undefined,
        outro: outro.trim() || undefined,
        categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        onlyInStock,
        excludedProductIds:
          excludedProductIds.length > 0 ? excludedProductIds : undefined,
        options,
      },
      {
        onSuccess: (template) => {
          setActiveTemplateId(template.id);
          toastSuccess({ title: "Plantilla guardada" });
        },
        onError: (error) =>
          toastApiError(error, "No se pudo guardar la plantilla."),
      },
    );
  }

  function handleDeleteTemplate(templateId: string) {
    deleteTemplate.mutate(templateId, {
      onSuccess: () => {
        setActiveTemplateId(null);
        toastSuccess({ title: "Plantilla eliminada" });
      },
      onError: (error) =>
        toastApiError(error, "No se pudo eliminar la plantilla."),
    });
  }

  function handleSend() {
    if (!activeBusinessId || !hasSelection) return;

    if (selectedIds.length > MAX_PRODUCTS_PER_LIST) {
      toastError({
        title: "Demasiados productos",
        description: `Puedes compartir hasta ${MAX_PRODUCTS_PER_LIST} productos por envío.`,
      });
      return;
    }

    sendMutation.mutate(
      {
        businessId: activeBusinessId,
        productIds: selectedIds,
        intro: intro.trim() || undefined,
        outro: outro.trim() || undefined,
        options,
        recipientId,
      },
      {
        onSuccess: (result) => {
          // La selección y los textos NO se limpian: si el envío salió a
          // medias, el usuario necesita su trabajo intacto para reintentar.
          if (result.sent) {
            toastSuccess({
              title: "Listado enviado",
              description: `Revisa el WhatsApp de ${result.recipientLabel} y reenvíalo a tu grupo.`,
            });
            return;
          }
          toastError({
            title: "Envío incompleto",
            description:
              result.error ??
              "Algunos mensajes no llegaron a salir. Revisa WhatsApp antes de reintentar.",
          });
        },
        onError: (error) =>
          toastApiError(
            error,
            "No se pudo enviar el listado. Revisa la conexión e inténtalo de nuevo.",
          ),
      },
    );
  }

  if (!activeBusinessId) {
    return (
      <section>
        <p className="text-muted-foreground">
          Selecciona un negocio para compartir su listado de productos.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Listado de productos
        </h1>
        <p className="text-muted-foreground">
          Arma el mensaje, recíbelo por WhatsApp y reenvíalo a tu grupo de
          clientes.
        </p>
      </div>

      <TemplateBar
        templates={templates}
        activeTemplateId={activeTemplateId}
        onLoad={handleLoadTemplate}
        onSave={handleSaveTemplate}
        onDelete={handleDeleteTemplate}
        isSaving={createTemplate.isPending}
        canSave={hasSelection}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6 rounded-lg border p-4">
          <ProductSelector
            products={products}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            search={search}
            onSearchChange={setSearch}
            onlyInStock={onlyInStock}
            onOnlyInStockChange={setOnlyInStock}
            isLoading={productsQuery.isLoading}
          />

          <MessageComposer
            intro={intro}
            outro={outro}
            options={options}
            onIntroChange={setIntro}
            onOutroChange={setOutro}
            onOptionsChange={setOptions}
          />
        </div>

        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <p className="text-sm font-medium">Vista previa</p>

          <MessagePreview
            messages={previewQuery.data?.messages ?? []}
            productCount={previewQuery.data?.productCount ?? 0}
            isLoading={previewQuery.isFetching}
            isError={previewQuery.isError}
            hasSelection={hasSelection}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="recipient">Enviar a</Label>
            <Select value={recipientId} onValueChange={setRecipientId}>
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Elige un destinatario" />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((recipient) => (
                  <SelectItem key={recipient.id} value={recipient.id}>
                    {recipient.label} · {recipient.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {recipients.length === 0 && !recipientsQuery.isLoading && (
              <p className="text-xs text-muted-foreground">
                No hay ningún número válido registrado. Añade el teléfono del
                negocio en sus datos.
              </p>
            )}
          </div>

          <Button
            type="button"
            onClick={handleSend}
            disabled={
              !hasSelection ||
              sendMutation.isPending ||
              recipients.length === 0 ||
              previewQuery.isFetching
            }
          >
            <Send data-icon="inline-start" />
            {sendMutation.isPending ? "Enviando..." : "Enviar por WhatsApp"}
          </Button>
        </div>
      </div>
    </section>
  );
}
