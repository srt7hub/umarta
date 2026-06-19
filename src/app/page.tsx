import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center bg-white rounded-2xl shadow-sm border border-stone-200 p-10">
        <Image
          src="/umarta.jpg"
          alt="Умарта"
          width={200}
          height={128}
          priority
          className="mx-auto mb-6 h-auto w-44 object-contain"
        />
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
          Банкетное меню
        </h1>
        <p className="mt-3 text-stone-500">
          Платформа согласования банкетного меню между залом и клиентом.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-white font-medium hover:bg-brand-700 transition-colors"
          >
            Панель администратора
          </Link>
        </div>
        <p className="mt-6 text-xs text-stone-400">
          Клиенты получают доступ к меню по персональной ссылке.
        </p>
      </div>
    </main>
  );
}
