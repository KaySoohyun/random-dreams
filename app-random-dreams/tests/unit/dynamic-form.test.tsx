import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DynamicForm } from "@/features/forms/dynamic-form";
import type { FormActionState, FormSchema } from "@/features/forms/types";

const schema: FormSchema = {
  fields: [
    { name: "nombre", label: "Tu nombre", type: "text", required: true, maxLength: 60 },
    { name: "tono", label: "Tono", type: "select", required: true, options: ["Nostálgico", "Épico"] },
    { name: "animales", label: "Animales", type: "multiselect", required: true, min: 2, max: 3, options: ["León", "Águila"] }
  ]
};

describe("DynamicForm", () => {
  it("renderiza un campo por cada campo del formSchema", () => {
    render(<DynamicForm formSchema={schema} action={vi.fn()} />);
    expect(screen.getByLabelText(/Tu nombre/)).toBeTruthy();
    expect(screen.getByLabelText(/Tono/)).toBeTruthy();
    expect(screen.getByRole("group", { name: "Animales" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeTruthy();
  });

  it("llama a la action con los valores del formulario al enviarlo completo", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({} as FormActionState);
    render(<DynamicForm formSchema={schema} action={action} />);

    await user.type(screen.getByLabelText(/Tu nombre/), "Martín");
    await user.selectOptions(screen.getByLabelText(/Tono/), "Épico");
    await user.click(screen.getByRole("button", { name: "León" }));
    await user.click(screen.getByRole("button", { name: "Águila" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("nombre")).toBe("Martín");
    expect(formData.get("tono")).toBe("Épico");
    expect(formData.get("animales")).toContain("León");
    expect(formData.get("animales")).toContain("Águila");
  });

  it("bloquea el envío con errores de validación en cliente", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({} as FormActionState);
    render(<DynamicForm formSchema={schema} action={action} />);

    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(action).not.toHaveBeenCalled();
  });
});
