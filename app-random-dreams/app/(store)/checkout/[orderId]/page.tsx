import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCheckoutOrder } from "@/lib/services/orders";
import { isFormSchema } from "@/features/forms/types";
import { confirmOrderAction } from "@/features/checkout/actions";
import { ConfirmForm } from "@/features/checkout/confirm-form";
import { OrderSummary } from "@/features/checkout/order-summary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Confirmar" };
}

export default async function CheckoutPage({
  params
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getCheckoutOrder(orderId);
  if (!order) notFound();

  if (order.paymentStatus === "APPROVED") {
    redirect(`/generacion/${order.id}`);
  }

  const formSchema = isFormSchema(order.product.formSchema) ? order.product.formSchema : null;
  const confirmAction = confirmOrderAction.bind(null, order.id);

  return (
    <div className="container-x max-w-2xl py-10">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        &larr; Volver al catálogo
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mt-4">Confirmar tu creación</h1>

      {order.paymentStatus === "REJECTED" ? (
        <p className="mt-6 text-sm text-danger">Este pedido no puede confirmarse.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {formSchema ? (
            <OrderSummary
              productName={order.product.name}
              formSchema={formSchema}
              formData={order.formSubmission?.formData}
            />
          ) : (
            <p className="text-sm text-muted">
              El resumen de este producto no está disponible.
            </p>
          )}
          <ConfirmForm action={confirmAction} />
        </div>
      )}
    </div>
  );
}
