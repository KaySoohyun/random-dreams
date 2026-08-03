import { beforeEach, describe, expect, it } from "vitest";
import {
  confirmOrder,
  createPendingOrder,
  getCheckoutOrder,
  getOrderById,
  getOrderGeneration
} from "@/lib/services/orders";
import { resetStoreForTests, updateOrderInStore } from "@/lib/store/orders";

const PRODUCT_ID = "criatura-fantastica";

describe("orders service", () => {
  beforeEach(() => {
    resetStoreForTests();
  });

  it("crea una order PENDING en el store con su formData", async () => {
    const order = await createPendingOrder({
      productId: PRODUCT_ID,
      formData: { nombre_criatura: "Fénix" }
    });

    expect(order.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(order.paymentStatus).toBe("PENDING");
    expect(order.confirmedAt).toBeNull();
    expect(order.formData).toEqual({ nombre_criatura: "Fénix" });
  });

  it("devuelve la order con su producto del catálogo", async () => {
    const { id } = await createPendingOrder({
      productId: PRODUCT_ID,
      formData: { nombre_criatura: "Fénix" }
    });

    const order = await getOrderById(id);
    expect(order).not.toBeNull();
    expect(order?.product?.name).toBe("Criatura fantástica");
    expect(order?.product?.id).toBe(PRODUCT_ID);
  });

  it("devuelve la order con producto y formSubmission para el checkout", async () => {
    const { id } = await createPendingOrder({
      productId: PRODUCT_ID,
      formData: { nombre_criatura: "Fénix" }
    });

    const order = await getCheckoutOrder(id);
    expect(order).not.toBeNull();
    expect(order?.product.name).toBe("Criatura fantástica");
    expect(order?.product.formSchema).toBeDefined();
    expect(order?.formSubmission?.formData).toEqual({ nombre_criatura: "Fénix" });
  });

  it("devuelve la order con producto y generatedResult null para la página de generación", async () => {
    const { id } = await createPendingOrder({
      productId: PRODUCT_ID,
      formData: { nombre_criatura: "Fénix" }
    });

    const order = await getOrderGeneration(id);
    expect(order).not.toBeNull();
    expect(order?.product.id).toBe(PRODUCT_ID);
    expect(order?.generatedResult).toBeNull();
  });

  it("confirma un pedido PENDING: lo pasa a APPROVED, setea confirmedAt y crea el resultado QUEUED", async () => {
    const { id } = await createPendingOrder({
      productId: PRODUCT_ID,
      formData: { nombre_criatura: "Fénix" }
    });

    const result = await await confirmOrder(id);

    expect(result?.transitioned).toBe(true);
    expect(result?.order.paymentStatus).toBe("APPROVED");
    expect(result?.order.generatedResult?.aiResponseStatus).toBe("QUEUED");

    const checkout = await getCheckoutOrder(id);
    expect(checkout?.paymentStatus).toBe("APPROVED");
    expect(checkout?.confirmedAt).toBeInstanceOf(Date);
  });

  it("es idempotente: un pedido ya APPROVED no se actualiza y reutiliza el resultado", async () => {
    const { id } = await createPendingOrder({
      productId: PRODUCT_ID,
      formData: { nombre_criatura: "Fénix" }
    });
    await confirmOrder(id);

    const before = await getOrderGeneration(id);
    const result = await await confirmOrder(id);

    expect(result?.transitioned).toBe(false);
    expect(result?.order.paymentStatus).toBe("APPROVED");
    expect(result?.order.generatedResult).toBe(before?.generatedResult);
  });

  it("no confirma un pedido REJECTED", async () => {
    const { id } = await createPendingOrder({
      productId: PRODUCT_ID,
      formData: { nombre_criatura: "Fénix" }
    });
    updateOrderInStore(id, { paymentStatus: "REJECTED" });

    const result = await await confirmOrder(id);
    expect(result?.order.paymentStatus).toBe("REJECTED");
    expect(result?.transitioned).toBe(false);
    expect(result?.order.generatedResult).toBeNull();
  });

  it("devuelve order null si el pedido no existe", async () => {
    const result = await confirmOrder("ord_404");
    expect(result?.order).toBeNull();
    expect(result?.transitioned).toBe(false);
  });

  it("devuelve null si el pedido no existe en los getters", async () => {
    expect(await getOrderById("ord_404")).toBeNull();
    expect(await getCheckoutOrder("ord_404")).toBeNull();
    expect(await getOrderGeneration("ord_404")).toBeNull();
  });
});
