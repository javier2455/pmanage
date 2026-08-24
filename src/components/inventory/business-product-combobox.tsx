"use client";

import {
    Combobox,
    ComboboxCollection,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { useAllProductOfMyBusinesses } from "@/hooks/use-business";
import type { BusinessWithProducts } from "@/lib/types/business";

interface BusinessProductComboboxProps {
    businessId: string;
    value: BusinessWithProducts | null;
    onValueChange: (product: BusinessWithProducts | null) => void;
    /**
     * Id del input. Hace falta cuando algo externo lo referencia: la etiqueta
     * con `htmlFor` o un paso del tour anclado por selector.
     */
    id?: string;
    /** Si viene, se renderiza una `Label` asociada al input. */
    label?: string;
    /**
     * Texto del input cuando ya hay productos que elegir. Los estados de carga
     * y de negocio sin productos los pone el componente: son los mismos
     * siempre, y dejarlos fuera invita a que un consumidor los olvide.
     */
    placeholder?: string;
    /**
     * Bloquea el input mientras carga o cuando el negocio no tiene productos.
     * El filtro del historial lo quiere; un formulario de alta, no siempre.
     */
    disableWhenEmpty?: boolean;
    className?: string;
}

/**
 * Selector de un producto del negocio activo, con búsqueda por nombre.
 *
 * Estaba copiado tal cual en el filtro del historial y en el formulario de
 * entrada de stock. Se extrajo al aparecer el tercer consumidor —la vista de
 * rentabilidad— porque mantener tres copias del mismo `Combobox` garantiza que
 * acaben divergiendo. El formulario de entrada sigue con su propia copia: allí
 * el selector está entretejido con `react-hook-form` y cambiarlo alteraría un
 * comportamiento que nadie ha pedido tocar.
 *
 * Devuelve el objeto entero y no un id, porque quien lo usa suele necesitar
 * también la unidad y el nombre del producto.
 */
export function BusinessProductCombobox({
    businessId,
    value,
    onValueChange,
    id,
    label,
    placeholder,
    disableWhenEmpty = true,
    className,
}: BusinessProductComboboxProps) {
    const { data, isLoading } = useAllProductOfMyBusinesses(businessId);
    const products: BusinessWithProducts[] = data?.data ?? [];

    const resolvedPlaceholder = isLoading
        ? "Cargando productos…"
        : products.length === 0
          ? "No hay productos en este negocio"
          : (placeholder ?? "Buscar producto...");

    return (
        <div className={className}>
            {label && (
                <Label htmlFor={id} className="mb-2 block text-card-foreground">
                    {label}
                </Label>
            )}
            <Combobox<BusinessWithProducts | null>
                value={value}
                onValueChange={(item) => onValueChange(item)}
                items={products}
                itemToStringLabel={(bp) => (bp ? bp.product.name : "")}
                isItemEqualToValue={(a, b) => a?.id === b?.id}
            >
                <ComboboxInput
                    id={id}
                    placeholder={resolvedPlaceholder}
                    className="w-full"
                    showClear={!!value}
                    disabled={
                        disableWhenEmpty && (isLoading || products.length === 0)
                    }
                />
                <ComboboxContent>
                    <ComboboxList className="max-h-64">
                        <ComboboxCollection>
                            {(item: BusinessWithProducts) => (
                                <ComboboxItem key={item.id} value={item}>
                                    {item.product.name}
                                </ComboboxItem>
                            )}
                        </ComboboxCollection>
                        <ComboboxEmpty>
                            No se encontró ningún producto.
                        </ComboboxEmpty>
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
        </div>
    );
}
