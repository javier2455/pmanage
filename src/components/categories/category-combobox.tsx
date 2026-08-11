"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  categorySelectionForInput,
  normalizeCategory as norm,
} from "@/lib/category-selection"

export type CategoryOption = { id: string; name: string }

/**
 * Id del item «Crear …». Es un centinela local: nunca viaja al backend, lo que
 * se envía en ese caso es el nombre escrito (`categoryName`).
 */
const CREATE_ID = "__create__"

interface CategoryComboboxProps {
  /** Categorías del negocio ya cargadas. */
  categories: CategoryOption[]
  /** Categoría existente elegida. */
  categoryId: string | null
  /** Categoría NUEVA escrita por el usuario; el backend la crea al guardar. */
  categoryName: string | null
  onChange: (next: {
    categoryId: string | null
    categoryName: string | null
  }) => void
  id?: string
  isLoading?: boolean
  invalid?: boolean
}

/**
 * Combobox de categorías que además permite crear una al vuelo: filtra las
 * existentes mientras se escribe y, si el texto no coincide con ninguna, ofrece
 * «Crear "…"». El nombre queda escrito en el formulario y es el backend quien
 * registra la categoría al guardar el producto (find-or-create).
 */
export function CategoryCombobox({
  categories,
  categoryId,
  categoryName,
  onChange,
  id,
  isLoading = false,
  invalid = false,
}: CategoryComboboxProps) {
  const [query, setQuery] = React.useState(categoryName ?? "")

  const trimmed = query.trim()
  const queryKey = norm(query)

  // Filtramos aquí (y desactivamos el filtro interno) para poder añadir el item
  // «Crear …» sin que el filtro lo descarte.
  const matches = React.useMemo(
    () =>
      trimmed
        ? categories.filter((c) => norm(c.name).includes(queryKey))
        : categories,
    [categories, trimmed, queryKey],
  )

  const hasExactMatch = categories.some((c) => norm(c.name) === queryKey)

  // Lo escrito no coincide con ninguna categoría: se ofrece crearla.
  const items = React.useMemo(() => {
    if (!trimmed || hasExactMatch) return matches
    return [...matches, { id: CREATE_ID, name: trimmed }]
  }, [matches, trimmed, hasExactMatch])

  // Memoizado para que la referencia del valor solo cambie con la selección:
  // base-ui lo compara en cada render contra los items.
  const selected: CategoryOption | null = React.useMemo(() => {
    if (categoryId) return categories.find((c) => c.id === categoryId) ?? null
    if (categoryName) return { id: CREATE_ID, name: categoryName }
    return null
  }, [categories, categoryId, categoryName])

  // Nombre de la última opción elegida. Se lee de forma síncrona porque base-ui
  // avisa del cambio de texto en el mismo evento que el del valor, cuando las
  // props del formulario todavía no reflejan la elección.
  const lastChosenName = React.useRef<string | null>(categoryName ?? null)

  function handleValueChange(option: CategoryOption | null) {
    lastChosenName.current = option?.name ?? null
    if (!option) {
      onChange({ categoryId: null, categoryName: null })
      return
    }
    if (option.id === CREATE_ID) {
      onChange({ categoryId: null, categoryName: option.name })
      return
    }
    onChange({ categoryId: option.id, categoryName: null })
  }

  function handleInputValueChange(text: string) {
    setQuery(text)
    const next = categorySelectionForInput(
      text,
      categories,
      lastChosenName.current ?? selected?.name ?? null,
    )
    if (next === "keep") return
    lastChosenName.current =
      next.categoryName ??
      categories.find((c) => c.id === next.categoryId)?.name ??
      null
    onChange(next)
  }

  const hasCategories = categories.length > 0
  const placeholder = isLoading
    ? "Cargando categorías..."
    : hasCategories
      ? "Busca o escribe una categoría..."
      : "Escribe el nombre de tu primera categoría"

  return (
    <Combobox<CategoryOption | null>
      value={selected}
      onValueChange={handleValueChange}
      items={items}
      filter={null}
      // Sin esto no hay item resaltado al escribir y Enter no elige nada: el
      // formulario se lo queda y salta al siguiente campo.
      autoHighlight
      inputValue={query}
      onInputValueChange={handleInputValueChange}
      itemToStringLabel={(opt) => opt?.name ?? ""}
      isItemEqualToValue={(a, b) =>
        (a?.id ?? null) === (b?.id ?? null) &&
        (a?.id !== CREATE_ID || a?.name === b?.name)
      }
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        className="w-full"
        showClear={!!selected}
        disabled={isLoading}
        aria-invalid={invalid ? "true" : "false"}
      />
      <ComboboxContent>
        <ComboboxList className="max-h-64">
          {items.map((opt) =>
            opt.id === CREATE_ID ? (
              <ComboboxItem key={CREATE_ID} value={opt} className="text-primary">
                <Plus className="size-3.5" />
                Crear «{opt.name}»
              </ComboboxItem>
            ) : (
              <ComboboxItem key={opt.id} value={opt}>
                {opt.name}
              </ComboboxItem>
            ),
          )}
          <ComboboxEmpty>
            {hasCategories
              ? "No se encontró ninguna categoría."
              : "Escribe un nombre para crear tu primera categoría."}
          </ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
