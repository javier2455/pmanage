/**
 * Reglas del combobox de categorías con creación al vuelo
 * (ver components/categories/category-combobox.tsx).
 */

export type CategoryLike = { id: string; name: string };

export type CategorySelection = {
  /** Categoría existente elegida. */
  categoryId: string | null;
  /** Categoría nueva: viaja por nombre y el backend la crea al guardar. */
  categoryName: string | null;
};

export const normalizeCategory = (value: string) => value.trim().toLowerCase();

/**
 * Categoría que corresponde al texto escrito en el combobox.
 *
 * - `"keep"`: el texto es el de la opción ya elegida (base-ui lo escribe en el
 *   input al seleccionar), así que la selección no se toca.
 * - Coincidencia exacta con una categoría del negocio: se elige esa.
 * - Coincidencia parcial: se asume que sigue buscando, no se elige nada.
 * - Sin ninguna coincidencia: lo escrito se toma como categoría nueva, para que
 *   no se pierda aunque no llegue a pulsar «Crear …».
 */
export function categorySelectionForInput(
  text: string,
  categories: readonly CategoryLike[],
  selectedName: string | null,
): CategorySelection | "keep" {
  if (selectedName && normalizeCategory(text) === normalizeCategory(selectedName)) {
    return "keep";
  }

  const value = text.trim();
  if (!value) {
    return { categoryId: null, categoryName: null };
  }

  const key = normalizeCategory(value);
  const exact = categories.find((c) => normalizeCategory(c.name) === key);
  if (exact) {
    return { categoryId: exact.id, categoryName: null };
  }

  const stillSearching = categories.some((c) =>
    normalizeCategory(c.name).includes(key),
  );
  return { categoryId: null, categoryName: stillSearching ? null : value };
}
