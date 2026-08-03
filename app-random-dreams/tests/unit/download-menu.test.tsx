import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/toast";
import { DownloadMenu } from "@/features/result/download-menu";

async function openMenu(hasText: boolean, hasImage: boolean) {
  render(
    <ToastProvider>
      <DownloadMenu orderId="ord_1" hasText={hasText} hasImage={hasImage} />
    </ToastProvider>
  );
  await userEvent.click(screen.getByRole("button", { name: "Descargar resultado" }));
}

describe("DownloadMenu", () => {
  it("muestra siempre los 3 items (PDF, Texto, Imagen) en el menú", async () => {
    await openMenu(true, true);

    expect(screen.getByRole("menuitem", { name: "PDF (.pdf)" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Texto (.txt)" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Imagen" })).toBeTruthy();
  });

  it("deshabilita con tooltip 'No disponible' los items sin contenido", async () => {
    await openMenu(true, false);

    const pdf = screen.getByRole("menuitem", { name: "PDF (.pdf)" });
    const texto = screen.getByRole("menuitem", { name: "Texto (.txt)" });
    const imagen = screen.getByRole("menuitem", { name: "Imagen" });

    expect(pdf.getAttribute("aria-disabled")).toBeNull();
    expect(texto.getAttribute("aria-disabled")).toBeNull();
    expect(imagen.getAttribute("aria-disabled")).toBe("true");
    expect(imagen.getAttribute("title")).toBe("No disponible");
  });

  it("deshabilita PDF y Texto si no hay texto, e Imagen si no hay imagen", async () => {
    await openMenu(false, false);

    expect(screen.getByRole("menuitem", { name: "PDF (.pdf)" }).getAttribute("aria-disabled")).toBe(
      "true"
    );
    expect(screen.getByRole("menuitem", { name: "Texto (.txt)" }).getAttribute("aria-disabled")).toBe(
      "true"
    );
    expect(screen.getByRole("menuitem", { name: "Imagen" }).getAttribute("aria-disabled")).toBe(
      "true"
    );
  });
});
