"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_NAME,
  ADMIN_SESSION_TTL_MS,
  createAdminSessionValue,
  getAdminSession
} from "@/lib/admin/session";
import { verifyAdminToken } from "@/lib/admin/token";
import { retryGeneration } from "@/lib/services/generation";
import { sendOrderConfirmed } from "@/inngest/events";

async function requireAdminSession() {
  if (!(await getAdminSession())) redirect("/admin/login");
}

export async function adminLoginAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const token = String(formData.get("token") ?? "");
  if (!verifyAdminToken(token)) {
    return { error: "Token incorrecto." };
  }

  const store = await cookies();
  store.set(ADMIN_SESSION_NAME, createAdminSessionValue(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_SESSION_TTL_MS / 1000,
    path: "/admin"
  });

  redirect("/admin");
}

export async function adminLogoutAction() {
  await requireAdminSession();
  const store = await cookies();
  store.delete(ADMIN_SESSION_NAME);
  redirect("/admin/login");
}

export async function adminRetryOrderAction(orderId: string, _formData: FormData) {
  await requireAdminSession();

  const result = await retryGeneration(orderId);
  if (result) {
    try {
      await sendOrderConfirmed(orderId);
    } catch (error) {
      console.warn("No se pudo enviar el evento order/confirmed desde el panel admin:", error);
    }
  }

  redirect(`/admin/ordenes/${orderId}`);
}
