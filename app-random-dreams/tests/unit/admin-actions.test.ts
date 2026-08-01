import { beforeEach, describe, expect, it, vi } from "vitest";

const setMock = vi.fn();
const deleteMock = vi.fn();
const getMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => ({ set: setMock, delete: deleteMock, get: getMock })
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { generatedResult: { findUnique: vi.fn(), update: vi.fn() } }
}));

vi.mock("@/lib/services/generation", () => ({
  retryGeneration: vi.fn()
}));

vi.mock("@/trigger/pipeline", () => ({
  runGenerationInline: vi.fn()
}));

vi.mock("@/trigger/events", () => ({
  enqueueGeneration: vi.fn().mockResolvedValue(undefined),
  sendOrderConfirmed: vi.fn().mockResolvedValue(undefined)
}));

import {
  adminLoginAction,
  adminLogoutAction,
  adminRetryOrderAction
} from "@/features/admin/actions";
import { ADMIN_SESSION_NAME } from "@/lib/admin/session";
import { signSession } from "@/lib/admin/token";
import { retryGeneration } from "@/lib/services/generation";
import { enqueueGeneration } from "@/trigger/events";

const SECRET = "tok-admin-test";

function catchRedirect(fn: () => Promise<unknown>): string | undefined {
  return fn().then(
    () => undefined,
    (error) => (error instanceof Error && error.message.startsWith("REDIRECT:") ? error.message : (() => { throw error; })())
  );
}

describe("admin actions", () => {
  beforeEach(() => {
    process.env.ADMIN_TOKEN = SECRET;
    vi.clearAllMocks();
    getMock.mockReturnValue(undefined);
  });

  it("adminLoginAction con token correcto setea la cookie y redirige a /admin", async () => {
    const formData = new FormData();
    formData.set("token", SECRET);

    const target = await catchRedirect(() => adminLoginAction(undefined, formData));

    expect(target).toBe("REDIRECT:/admin");
    expect(setMock).toHaveBeenCalledWith(
      ADMIN_SESSION_NAME,
      expect.stringContaining("."),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "strict",
        path: "/admin"
      })
    );
  });

  it("adminLoginAction con token incorrecto devuelve error y no setea cookie", async () => {
    const formData = new FormData();
    formData.set("token", "malo");

    const result = await adminLoginAction(undefined, formData);

    expect(result).toEqual({ error: "Token incorrecto." });
    expect(setMock).not.toHaveBeenCalled();
  });

  it("adminLogoutAction con sesión válida borra la cookie y redirige a login", async () => {
    getMock.mockReturnValue({ value: signSession(SECRET, 60_000) });

    const target = await catchRedirect(() => adminLogoutAction());

    expect(target).toBe("REDIRECT:/admin/login");
    expect(deleteMock).toHaveBeenCalledWith(ADMIN_SESSION_NAME);
  });

  it("adminLogoutAction sin sesión redirige a login sin borrar la cookie", async () => {
    const target = await catchRedirect(() => adminLogoutAction());

    expect(target).toBe("REDIRECT:/admin/login");
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("adminRetryOrderAction reintenta (retryGeneration + encole en Trigger.dev) y redirige al detalle", async () => {
    getMock.mockReturnValue({ value: signSession(SECRET, 60_000) });
    vi.mocked(retryGeneration).mockResolvedValue({ id: "r1" } as never);

    const target = await catchRedirect(() => adminRetryOrderAction("ord_1", new FormData()));

    expect(target).toBe("REDIRECT:/admin/ordenes/ord_1");
    expect(retryGeneration).toHaveBeenCalledWith("ord_1");
    expect(enqueueGeneration).toHaveBeenCalledWith("ord_1");
  });

  it("adminRetryOrderAction no encola si no hay resultado para reintentar", async () => {
    getMock.mockReturnValue({ value: signSession(SECRET, 60_000) });
    vi.mocked(retryGeneration).mockResolvedValue(null);

    const target = await catchRedirect(() => adminRetryOrderAction("ord_1", new FormData()));

    expect(target).toBe("REDIRECT:/admin/ordenes/ord_1");
    expect(enqueueGeneration).not.toHaveBeenCalled();
  });

  it("adminRetryOrderAction sin sesión no reintenta", async () => {
    const target = await catchRedirect(() => adminRetryOrderAction("ord_1", new FormData()));

    expect(target).toBe("REDIRECT:/admin/login");
    expect(retryGeneration).not.toHaveBeenCalled();
  });
});
