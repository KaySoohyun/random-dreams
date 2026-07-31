import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/services/products";
import { DynamicForm } from "@/features/forms/dynamic-form";
import { isFormSchema } from "@/features/forms/types";
import { createOrder } from "@/features/forms/actions";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  return { title: product.name };
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const formSchema = isFormSchema(product.formSchema) ? product.formSchema : null;
  const createOrderAction = createOrder.bind(null, product.id);

  return (
    <div className="container-x py-8">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        &larr; Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6 items-start">
        <section>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-muted mt-3 leading-relaxed">{product.description}</p>
          <div className="mt-6 text-sm text-muted border border-line rounded-xl p-4">
            <span className="font-semibold text-ink">Qué obtenés:</span> texto{" "}
            <code>.txt</code> + imagen <code>.png</code> (1024×1024)
          </div>
          <div className="mt-6 hidden lg:block">
            <div className="h-72 bg-mist rounded-xl flex items-center justify-center text-muted text-sm">
              [ilustración del producto]
            </div>
          </div>
        </section>

        <section>
          <div className="border border-line rounded-xl p-6">
            <h2 className="font-semibold mb-4">Personalizá tu creación</h2>
            {formSchema ? (
              <DynamicForm formSchema={formSchema} action={createOrderAction} />
            ) : (
              <p className="text-sm text-muted">
                El formulario de este producto aún no está disponible.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
