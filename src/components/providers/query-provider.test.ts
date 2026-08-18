// @vitest-environment jsdom
import { MutationObserver, onlineManager } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeQueryClient } from "./query-provider";

/**
 * Que las consultas se EJECUTEN sin conexión es la base de todo el modo
 * offline: el respaldo en la base local vive dentro de la función de cada
 * consulta, así que si React Query no la llama, no hay copia que valga.
 *
 * Se prueba el comportamiento y no el ajuste (`networkMode`) porque el fallo
 * que hubo en producción no fue escribirlo mal, fue no escribirlo: la consulta
 * quedaba «en pausa», que no es un error —no hay pantalla roja, no hay nada en
 * consola—, y la lista de ventas aparecía vacía como si el negocio no hubiera
 * vendido nunca.
 */

const PAUSED = Symbol("en pausa");

/** Resuelve a `PAUSED` si la promesa no termina: una tarea en pausa no falla,
 *  se queda esperando a que vuelva la red, y sin este corte el test expiraría
 *  a los cinco segundos sin decir por qué. */
async function settledOrPaused<T>(promise: Promise<T>): Promise<T | symbol> {
  return Promise.race([
    promise,
    new Promise<symbol>((resolve) => setTimeout(() => resolve(PAUSED), 50)),
  ]);
}

afterEach(() => {
  onlineManager.setOnline(true);
});

describe("cliente de consultas sin conexión", () => {
  it("ejecuta la consulta aunque el navegador se declare sin conexión", async () => {
    onlineManager.setOnline(false);
    const client = makeQueryClient();
    const queryFn = vi.fn().mockResolvedValue("copia local");

    const result = await settledOrPaused(
      client.fetchQuery({ queryKey: ["prueba"], queryFn }),
    );

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(result).toBe("copia local");
  });

  /**
   * Las consultas con ajustes propios por clave son la mayoría de la
   * aplicación. Si esos ajustes taparan el modo de red, el arreglo funcionaría
   * en las pruebas y no en la pantalla de ventas, que es donde importa.
   */
  it("los ajustes por consulta no tapan el modo de red", async () => {
    onlineManager.setOnline(false);
    const client = makeQueryClient();
    const queryFn = vi.fn().mockResolvedValue("ventas guardadas");

    const result = await settledOrPaused(
      client.fetchQuery({
        queryKey: ["all-sales-by-business-id", "negocio-1", {}],
        queryFn,
      }),
    );

    expect(result).toBe("ventas guardadas");
  });

  /**
   * Sin esto, una venta sin conexión no llega ni a intentarse: el botón
   * «Registrando…» gira indefinidamente delante del cliente y la venta no se
   * guarda en ningún sitio, ni en el servidor ni en la cola local.
   */
  it("ejecuta la mutación aunque el navegador se declare sin conexión", async () => {
    onlineManager.setOnline(false);
    const client = makeQueryClient();
    const mutationFn = vi.fn().mockResolvedValue({ queued: true });
    const observer = new MutationObserver(client, { mutationFn });

    const result = await settledOrPaused(observer.mutate(undefined));

    expect(mutationFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ queued: true });
  });
});
