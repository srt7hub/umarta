"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/admin", label: "Мероприятия", exact: true },
  { href: "/admin/calendar", label: "Календарь", exact: false },
  { href: "/admin/dishes", label: "Блюда", exact: false },
];

export function AdminNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Image
                src="/umarta.jpg"
                alt="Умарта"
                width={96}
                height={62}
                priority
                className="h-9 w-auto object-contain"
              />
              <span className="font-semibold text-stone-900 hidden sm:block">
                Банкетное меню
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {links.map((l) => {
                const active = l.exact
                  ? pathname === l.href
                  : pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`rounded-lg px-2 sm:px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-500 hidden md:block">
              {userEmail}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
