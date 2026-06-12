/**
 * Намеренные уязвимости для демонстрации SAST (Semgrep).
 * Этот файл НЕ используется в production-коде — только для сканирования.
 * См. sast-triggers-fixed.ts для исправленных версий.
 */

// rule: recipe-book.hardcoded-secret
export const LAB_API_KEY = "sk_live_recipebook_secret_key_12345";

// rule: recipe-book.eval-user-input
export function unsafeParseUserExpression(userInput: string): unknown {
  // eslint-disable-next-line no-eval
  return eval(`(${userInput})`);
}

// rule: recipe-book.sql-string-concat
export function unsafeRawQuery(db: { query: (sql: string) => unknown }, userId: string) {
  return db.query(`SELECT * FROM products WHERE id = '${userId}'`);
}

// rule: recipe-book.path-traversal
import path from "path";

export function unsafeResolveUpload(req: { query: { filename?: string } }, baseDir: string) {
  return path.join(baseDir, req.query.filename ?? "");
}
