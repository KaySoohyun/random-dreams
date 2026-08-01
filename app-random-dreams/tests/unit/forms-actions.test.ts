import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  })
);

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("@/lib/services/products", () => ({
  getProductById: vi.fn()
}));

vi.mock("@/lib/services/orders", () => ({
  createPendingOrder: vi.fn()
}));

import { createOrder } from "@/features/forms/actions";
import { getProductById } from "@/lib/services/products";
import { createPendingOrder } from "@/lib/services/orders";

const product = {
  id: "p1",
  formSchema: {
    fields: [
      { name: "nombre", label: "Tu nombre", type: "text", required: true },
      { name: "estilo", label: "Estilo", type: "select", required: true, options: ["A", "B"] }
    ]
  }
};

function formData(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}

function catchRedirect(fn: () => Promise<unknown>): string | undefined {
  return fn().then(
    () => undefined,
    (error) => (error instanceof Error && error.message.startsWith("REDIRECT:") ? error.message : (() => { throw error; })())
  );
}

describe("createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProductById).mockResolvedValue(product as never);
    vi.mocked(createPendingOrder).mockResolvedValue({ id: "ord_1" } as never);
  });

  it("crea el pedido con los datos validados y redirige al checkout", async () => {
    const target = await catchRedirect(() =>
      createOrder("p1", undefined, formData({ nombre: "Martín", estilo: "A" }))
    );

    expect(target).toBe("REDIRECT:/checkout/ord_1");
    expect(createPendingOrder).toHaveBeenCalledWith({
      productId: "p1",
      formData: { nombre: "Martín", estilo: "A" }
    });
  });

  it("devuelve error si el producto no existe", async () => {
    vi.mocked(getProductById).mockResolvedValue(null as never);

    const result = await createOrder("p1", undefined, formData({ nombre: "Martín", estilo: "A" }));

    expect(result).toEqual({ serverError: "El producto ya no está disponible." });
    expect(createPendingOrder).not.toHaveBeenCalled();
  });

  it("devuelve error si el formSchema es inválido", async () => {
    vi.mocked(getProductById).mockResolvedValue({
      id: "p1",
      formSchema: { fields: [{ name: "x" }] }
    } as never);

    const result = await createOrder("p1", undefined, formData({ nombre: "Martín" }));

    expect(result).toEqual({
      serverError: "El formulario de este producto tiene un error de configuración."
    });
    expect(createPendingOrder).not.toHaveBeenCalled();
  });

  it("devuelve errores por campo sin crear el pedido si falla la validación", async () => {
    const result = await createOrder("p1", undefined, formData({ nombre: "", estilo: "A" }));

    expect(result.success).toBeUndefined();
    expect((result as { errors?: Record<string, string> }).errors?.nombre).toContain("obligatorio");
    expect(createPendingOrder).not.toHaveBeenCalled();
  });

  it("devuelve los valores crudos junto a los errores", async () => {
    const result = await createOrder("p1", undefined, formData({ nombre: "", estilo: "" }));

    expect((result as { values?: Record<string, string> }).values).toEqual({
      nombre: "",
      estilo: ""
    });
  });
});
