import { Router } from "express";

/**
 * Намеренные эндпоинты для демонстрации DAST (OWASP ZAP).
 * Подключаются только при ENABLE_SECURITY_LAB=true.
 */
export const dastLabRouter = Router();

// Reflected XSS — ZAP обнаружит отсутствие экранирования
dastLabRouter.get("/echo", (req, res) => {
  const msg = (req.query.msg as string | undefined) ?? "hello";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<html><body><p>Вы ввели: ${msg}</p></body></html>`);
});

// Information disclosure — утечка внутренней информации
dastLabRouter.get("/debug-info", (_req, res) => {
  res.json({
    nodeVersion: process.version,
    env: process.env.NODE_ENV,
    cwd: process.cwd(),
    memory: process.memoryUsage(),
  });
});

// Missing security headers — ответ без CSP, X-Frame-Options и т.д.
dastLabRouter.get("/insecure-page", (_req, res) => {
  res.send("<html><body><h1>Insecure page</h1></body></html>");
});
