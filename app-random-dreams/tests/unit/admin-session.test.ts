import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => ({ get: getMock })
}));

import {
  ADMIN_SESSION_NAME,
  createAdminSessionValue,
  getAdminSession
} from "@/lib/admin/session";
import { signSession, verifySession } from "@/lib/admin/token";

const SECRET = "tok-admin-test";

describe("admin session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_TOKEN = SECRET;
  });

  afterEach(() => {
    delete process.env.ADMIN_TOKEN;
  });

  it("getAdminSession devuelve false si no hay token configurado", async () => {
    delete process.env.ADMIN_TOKEN;
    expect(await getAdminSession()).toBe(false);
  });

  it("getAdminSession devuelve false si no hay cookie de sesión", async () => {
    getMock.mockReturnValue(undefined);
    expect(await getAdminSession()).toBe(false);
  });

  it("getAdminSession valida la cookie firmada", async () => {
    const value = signSession(SECRET, 60_000);
    getMock.mockReturnValue({ value });
    expect(await getAdminSession()).toBe(true);
  });

  it("getAdminSession rechaza una cookie inválida o vencida", async () => {
    getMock.mockReturnValue({ value: "basura" });
    expect(await getAdminSession()).toBe(false);

    const expired = signSession(SECRET, 60_000, 1_000_000);
    getMock.mockReturnValue({ value: expired });
    expect(await getAdminSession()).toBe(false);
  });

  it("createAdminSessionValue devuelve una sesión válida firmada", async () => {
    const value = createAdminSessionValue();
    expect(value).toBeTruthy();
    expect(value).toContain(".");
    expect(verifySession(value, SECRET)).toBe(true);
  });

  it("createAdminSessionValue devuelve vacío si no hay token configurado", () => {
    delete process.env.ADMIN_TOKEN;
    expect(createAdminSessionValue()).toBe("");
  });

  it("getAdminSession consulta la cookie con el nombre correcto", async () => {
    getMock.mockReturnValue(undefined);
    await getAdminSession();
    expect(getMock).toHaveBeenCalledWith(ADMIN_SESSION_NAME);
  });
});
