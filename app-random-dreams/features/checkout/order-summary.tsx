import type { FormSchema } from "@/features/forms/types";
import type { Prisma } from "@/lib/generated/prisma/client";

type OrderSummaryProps = {
  productName: string;
  formSchema: FormSchema;
  formData: Prisma.JsonValue | undefined;
};

function formatValue(field: FormSchema["fields"][number], value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function OrderSummary({ productName, formSchema, formData }: OrderSummaryProps) {
  const data = formData as Record<string, unknown>;
  return (
    <div className="rounded-[4px] border border-primary/30 bg-night-card/60 p-6">
      <h2 className="font-serif text-sm uppercase tracking-[1.5px] text-ink">{productName}</h2>
      <dl className="mt-4 space-y-2.5">
        {formSchema.fields.map((field) => (
          <div key={field.name} className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1">
            <dt className="text-sm text-faint">{field.label}</dt>
            <dd className="text-sm font-medium">{formatValue(field, data[field.name])}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 pt-5 border-t border-primary/20 text-sm text-muted space-y-1">
        <p>
          Entrega: texto <code>.txt</code> + imagen <code>.png</code> (generado en ~1 min).
        </p>
        <p className="font-medium text-ink">Sin cargo.</p>
      </div>
    </div>
  );
}
