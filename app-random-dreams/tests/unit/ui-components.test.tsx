import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Spinner } from "@/components/ui/spinner";
import { ToastProvider, useToast } from "@/components/ui/toast";

describe("Spinner", () => {
  it("renderiza un spinner accesible con el label por defecto", () => {
    render(<Spinner />);
    expect(screen.getByRole("status", { name: "Cargando" })).toBeTruthy();
  });

  it("respeta el label customizado", () => {
    render(<Spinner label="Generando imagen" />);
    expect(screen.getByRole("status", { name: "Generando imagen" })).toBeTruthy();
  });

  it("aplica las clases de tamaño", () => {
    const { container } = render(<Spinner size="lg" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner?.className).toContain("h-6 w-6");
    expect(spinner?.className).toContain("animate-spin");
  });
});

describe("ToastProvider / useToast", () => {
  function ToastTrigger({ message, variant }: { message: string; variant?: "success" | "error" | "info" }) {
    const { toast } = useToast();
    return (
      <button type="button" onClick={() => toast(message, variant)}>
        disparar
      </button>
    );
  }

  it("lanza un error si useToast se usa fuera del provider", () => {
    expect(() => render(<ToastTrigger message="hola" />)).toThrow(
      "useToast debe usarse dentro de <ToastProvider>"
    );
  });

  it("muestra un toast al dispararlo y lo puede cerrar", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger message="Descarga iniciada" variant="info" />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "disparar" }));
    expect(screen.getByText("Descarga iniciada")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Cerrar notificación/ }));
    expect(screen.queryByText("Descarga iniciada")).toBeNull();
  });

  it("acumula varios toasts sin pisarse", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger message="uno" />
        <ToastTrigger message="dos" />
      </ToastProvider>
    );

    await user.click(screen.getAllByRole("button", { name: "disparar" })[0]);
    await user.click(screen.getAllByRole("button", { name: "disparar" })[1]);

    expect(screen.getByText("uno")).toBeTruthy();
    expect(screen.getByText("dos")).toBeTruthy();
  });

  it("se cierra solo tras el tiempo de auto-dismiss", () => {
    vi.useFakeTimers();
    try {
      render(
        <ToastProvider>
          <ToastTrigger message="temporal" />
        </ToastProvider>
      );
      act(() => {
        screen.getByRole("button", { name: "disparar" }).click();
      });

      expect(screen.getByText("temporal")).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.queryByText("temporal")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
