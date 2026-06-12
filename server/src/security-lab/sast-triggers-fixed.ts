/**
 * Исправленные версии уязвимостей из sast-triggers.ts (для отчёта по лабораторной).
 */

import path from "path";

// FIX: секреты — только из переменных окружения
export function getLabApiKey(): string {
  const key = process.env.LAB_API_KEY;
  if (!key) throw new Error("LAB_API_KEY is not configured");
  return key;
}

// FIX: eval заменён на JSON.parse с валидацией
export function safeParseUserJson(userInput: string): unknown {
  const parsed: unknown = JSON.parse(userInput);
  if (parsed === null || typeof parsed !== "object") {
    throw new Error("Expected JSON object");
  }
  return parsed;
}

// FIX: параметризованный запрос вместо конкатенации
export function safeRawQuery(db: { query: (sql: string, params: string[]) => unknown }, userId: string) {
  return db.query("SELECT * FROM products WHERE id = ?", [userId]);
}

// FIX: нормализация пути и проверка, что файл остаётся внутри baseDir
export function safeResolveUpload(req: { query: { filename?: string } }, baseDir: string) {
  const filename = (req.query.filename ?? "").replace(/[/\\]/g, "");
  const resolved = path.resolve(baseDir, filename);
  const normalizedBase = path.resolve(baseDir);
  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    throw new Error("Path traversal detected");
  }
  return resolved;
}
