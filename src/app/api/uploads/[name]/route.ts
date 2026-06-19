import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

// Раздача загруженных фото блюд с диска в рантайме. В продакшене (next start)
// папка public раздаётся снапшотом на момент старта, поэтому файлы, появившиеся
// после запуска, отдаём здесь напрямую из <корень>/uploads.

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  // Защита от обхода каталога: разрешаем только простое имя файла.
  if (name.includes("/") || name.includes("\\") || name.includes("..")) {
    return NextResponse.json({ error: "Недопустимое имя" }, { status: 400 });
  }

  const ext = path.extname(name).toLowerCase();
  const contentType = MIME[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Недопустимый тип" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "uploads", name);
  try {
    await stat(filePath);
    const data = await readFile(filePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }
}
