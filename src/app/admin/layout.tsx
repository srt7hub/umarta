import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Страница логина имеет собственный layout-проход; защищаем всё остальное.
  // Если сессии нет — middleware/страница перенаправит. Здесь дополнительно
  // оборачиваем контент в shell только для авторизованных.
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <AdminNav userEmail={session.user?.email ?? ""} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
