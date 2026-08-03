import type { FormSchema } from "@/features/forms/types";
import type { Prisma } from "@/lib/generated/prisma/client";

type OrderSummaryProps = {
  productName: string;
  formSchema: FormSchema;
  formData: Prisma.JsonValue | Record<string, unknown> | null | undefined;
};

function formatValue(field: FormSchema["fields"][number], value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function OrderSummary({ productName, formSchema, formData }: OrderSummaryProps) {
  const data = (formData ?? {}) as Record<string, unknown>;
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
    </div>
  );
}
