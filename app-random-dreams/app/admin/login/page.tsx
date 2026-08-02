import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { LoginForm } from "@/features/admin/login-form";

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");

  return (
    <div className="container-x max-w-sm py-16">
      <h1 className="font-serif text-2xl uppercase tracking-[2px] font-normal text-ink">Acceso al panel</h1>
      <p className="text-sm text-muted mt-2">Ingresá el token de administración.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
