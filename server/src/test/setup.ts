import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, "..", "..");
process.env.DATABASE_URL = "file:./test.db";

execSync("npx prisma db push --skip-generate", {
  cwd: serverRoot,
  env: { ...process.env, DATABASE_URL: "file:./test.db" },
  stdio: "pipe",
});
