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
          <h1 className="font-serif text-2xl uppercase tracking-[2px] font-normal text-ink">
            {product.name}
          </h1>
          <p className="text-muted mt-3 leading-relaxed">{product.description}</p>
        </section>

        <section>
          <div className="rounded-[4px] border border-primary/30 bg-night-card/80 p-6">
            <h2 className="mb-4 font-serif text-sm uppercase tracking-[1.5px] text-ink">
              Personalizá tu creación
            </h2>
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
