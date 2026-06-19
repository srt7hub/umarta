import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/api";

// Разрешённые типы и лимит размера загружаемых изображений
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 МБ
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// POST /api/upload — загрузка фото блюда. Файл сохраняется в public/uploads,
// возвращается публичный путь для записи в Dish.imageUrl.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Допустимы только JPG, PNG или WebP" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Файл больше 8 МБ" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${randomUUID()}.${EXT[file.type]}`;
  // Храним вне public/, т.к. в продакшене (next start) public раздаётся по
  // снапшоту на момент старта и новые файлы туда не попадают. Отдаём их
  // через рантайм-роут /api/uploads/<name>, который читает диск напрямую.
  const uploadDir = path.join(process.cwd(), "uploads");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);

  return NextResponse.json({ url: `/api/uploads/${fileName}` }, { status: 201 });
}
