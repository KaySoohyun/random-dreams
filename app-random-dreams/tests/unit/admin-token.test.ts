import { afterEach, describe, expect, it } from "vitest";
import { signSession, verifyAdminToken, verifySession } from "@/lib/admin/token";

describe("admin token", () => {
  afterEach(() => {
    delete process.env.ADMIN_TOKEN;
  });

  it("verifyAdminToken acepta el token correcto y rechaza otros", () => {
    process.env.ADMIN_TOKEN = "secreto-admin";
    expect(verifyAdminToken("secreto-admin")).toBe(true);
    expect(verifyAdminToken("secreto-admin ")).toBe(false);
    expect(verifyAdminToken("otro")).toBe(false);
  });

  it("verifyAdminToken rechaza todo si no hay token configurado", () => {
    expect(verifyAdminToken("secreto-admin")).toBe(false);
  });

  it("signSession/verifySession validan una sesión dentro del TTL", () => {
    const value = signSession("secret", 60_000, 1_000_000);
    expect(verifySession(value, "secret", 1_030_000)).toBe(true);
  });

  it("rechaza sesiones expiradas", () => {
    const value = signSession("secret", 60_000, 1_000_000);
    expect(verifySession(value, "secret", 1_060_000)).toBe(false);
  });

  it("rechaza sesiones con firma incorrecta, malformadas o de otro secret", () => {
    const value = signSession("secret", 60_000, 1_000_000);
    expect(verifySession(`${value}x`, "secret", 1_010_000)).toBe(false);
    expect(verifySession("sin-formato", "secret", 1_010_000)).toBe(false);
    expect(verifySession("", "secret", 1_010_000)).toBe(false);
    expect(verifySession(undefined, "secret", 1_010_000)).toBe(false);
    expect(verifySession(value, "otro-secret", 1_010_000)).toBe(false);
  });
});
