"use server";

import { redirect } from "next/navigation";
import { formDataToObject, validateForm } from "./build-form-schema";
import { isFormSchema } from "./types";
import type { FormActionState } from "./types";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getProductById } from "@/lib/services/products";
import { createPendingOrder } from "@/lib/services/orders";

export async function createOrder(
  productId: string,
  prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const product = await getProductById(productId);
  if (!product) {
    return { serverError: "El producto ya no está disponible." };
  }
  if (!isFormSchema(product.formSchema)) {
    return { serverError: "El formulario de este producto tiene un error de configuración." };
  }

  const rawValues = formDataToObject(product.formSchema, formData);
  const result = validateForm(product.formSchema, rawValues);
  if (!result.success) {
    return {
      errors: result.errors,
      values: rawValues as Record<string, string>
    };
  }

  const order = await createPendingOrder({
    productId: product.id,
    formData: result.data as Prisma.InputJsonValue
  });

  redirect(`/checkout/${order.id}`);
}
