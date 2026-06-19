import Link from "next/link";

export default function EventNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl border border-stone-200 shadow-sm p-10">
        <h1 className="text-2xl font-semibold text-stone-900">
          Мероприятие не найдено
        </h1>
        <p className="mt-2 text-stone-500">
          Ссылка недействительна или мероприятие было удалено. Проверьте ссылку,
          полученную от банкетного зала.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
