import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

// Проверка авторизации администратора для защищённых маршрутов
export async function requireAdmin(): Promise<
  { ok: true; email: string | null } | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Не авторизован" }, { status: 401 }),
    };
  }
  return { ok: true, email: session.user?.email ?? null };
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
