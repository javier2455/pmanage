// @vitest-environment jsdom
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { CategoryCombobox } from "./category-combobox";

const CATEGORIES = [
  { id: "c1", name: "Bebidas" },
  { id: "c2", name: "Snacks" },
  { id: "c3", name: "Lácteos" },
];

/**
 * Réplica del formulario de asignación: react-hook-form con `watch`/`setValue`
 * y la lista de categorías recreada en cada render, como ocurre en la página.
 */
function Harness({
  categories = CATEGORIES,
  onChange,
}: {
  categories?: { id: string; name: string }[];
  onChange?: (v: unknown) => void;
}) {
  const { watch, setValue } = useForm<{
    categoryId: string | null;
    categoryName: string | null;
  }>({ defaultValues: { categoryId: null, categoryName: null } });

  const items = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <form>
      <CategoryCombobox
        id="category-select"
        categories={items}
        categoryId={watch("categoryId") ?? null}
        categoryName={watch("categoryName") ?? null}
        onChange={(next) => {
          setValue("categoryId", next.categoryId, { shouldValidate: true });
          setValue("categoryName", next.categoryName, { shouldValidate: true });
          onChange?.(next);
        }}
      />
      <input aria-label="siguiente" />
    </form>
  );
}

const options = () => screen.queryAllByRole("option").map((el) => el.textContent);

afterEach(cleanup);

describe("CategoryCombobox", () => {
  it("filtra las categorías mientras se escribe", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(options()).toHaveLength(3);

    await user.type(input, "beb");
    // La existente que coincide + la opción de crear una distinta con ese texto.
    expect(options()).toEqual(["Bebidas", "Crear «beb»"]);
  });

  it("solo ofrece crear cuando no coincide ninguna", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole("combobox"), "granos");

    expect(options()).toEqual(["Crear «granos»"]);
  });

  it("Enter confirma la categoría nueva escrita", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const input = screen.getByRole("combobox") as HTMLInputElement;
    await user.type(input, "granos");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenLastCalledWith({
      categoryId: null,
      categoryName: "granos",
    });
    expect(input.value).toBe("granos");
  });

  it("Enter elige la categoría existente filtrada", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const input = screen.getByRole("combobox") as HTMLInputElement;
    await user.type(input, "snac");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenLastCalledWith({
      categoryId: "c2",
      categoryName: null,
    });
    expect(input.value).toBe("Snacks");
  });

  it("al hacer clic se elige la categoría existente", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const input = screen.getByRole("combobox") as HTMLInputElement;
    await user.type(input, "lá");
    await user.click(screen.getByRole("option", { name: "Lácteos" }));

    expect(onChange).toHaveBeenLastCalledWith({
      categoryId: "c3",
      categoryName: null,
    });
    expect(input.value).toBe("Lácteos");
  });

  it("permite forzar una categoría nueva parecida a una existente", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.type(screen.getByRole("combobox"), "beb");
    await user.click(screen.getByRole("option", { name: /Crear/ }));

    expect(onChange).toHaveBeenLastCalledWith({
      categoryId: null,
      categoryName: "beb",
    });
  });

  it("permite crear la primera categoría cuando el negocio no tiene ninguna", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness categories={[]} onChange={onChange} />);

    const input = screen.getByRole("combobox") as HTMLInputElement;
    expect(input.hasAttribute("disabled")).toBe(false);

    await user.type(input, "Granos");
    expect(onChange).toHaveBeenLastCalledWith({
      categoryId: null,
      categoryName: "Granos",
    });
    expect(options()).toEqual(["Crear «Granos»"]);
  });
});
