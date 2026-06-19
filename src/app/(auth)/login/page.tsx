"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Неверный email или пароль");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="/umarta.jpg"
            alt="Умарта"
            width={140}
            height={90}
            priority
            className="mx-auto mb-4 h-auto w-32 object-contain"
          />
          <h1 className="text-2xl font-semibold text-stone-900">Вход в панель</h1>
          <p className="text-sm text-stone-500 mt-1">Только для администратора</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="admin@banquet.local"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Пароль
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {loading && <Spinner />}
            Войти
          </button>
        </form>
      </div>
    </main>
  );
}
