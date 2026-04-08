import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { productsRouter } from "./routes/products.js";
import { dishesRouter } from "./routes/dishes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
export const uploadsDir = path.join(root, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { files: 5, fileSize: 5 * 1024 * 1024 },
});

export function createApp() {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use("/uploads", express.static(uploadsDir));

  app.post("/api/upload", upload.array("photos", 5), (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) {
      res.status(400).json({ error: "Нет файлов" });
      return;
    }
    const urls = files.map((f) => `/uploads/${f.filename}`);
    res.json({ urls });
  });

  app.use("/api/products", productsRouter);
  app.use("/api/dishes", dishesRouter);

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    if (err && typeof err === "object" && "name" in err && (err as { name?: string }).name === "ZodError") {
      res.status(400).json({ error: "Некорректные данные" });
      return;
    }
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  });

  return app;
}
