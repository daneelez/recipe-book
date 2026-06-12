# Лабораторная: анализ безопасности recipe-book

Проект: **recipe-book** (Node.js monorepo: Express API + React/Vite client).

Инструменты интегрированы в GitHub Actions: [`.github/workflows/security.yml`](../.github/workflows/security.yml).

---

## 1. SAST — Semgrep (7 баллов + 3 за CI)

### Инструмент

[Semgrep](https://semgrep.dev/) — open-source SAST для TypeScript/JavaScript.

### Конфигурация

| Файл | Назначение |
|------|------------|
| [`.semgrep.yml`](../.semgrep.yml) | Корневой конфиг |
| [`security/semgrep/custom-rules.yml`](semgrep/custom-rules.yml) | 6 кастомных правил |
| [`.semgrepignore`](../.semgrepignore) | Исключения (node_modules, исправленные примеры) |

**Подключённые rulesets:**

- `p/security-audit` — общий аудит безопасности
- `p/owasp-top-ten` — OWASP Top 10
- `p/nodejs` — Node.js-специфичные паттерны
- `p/typescript` — TypeScript

**Кастомные правила:**

1. `recipe-book.hardcoded-secret` — захардкоженные секреты
2. `recipe-book.eval-user-input` — `eval()` с пользовательским вводом
3. `recipe-book.sql-string-concat` — SQL-инъекция через конкатенацию
4. `recipe-book.path-traversal` — path traversal в путях к файлам
5. `recipe-book.missing-rate-limit-upload` — загрузка файлов без rate limit
6. `recipe-book.dangerously-set-inner-html` — XSS через React

### Намеренные триггеры

Файлы в `server/src/security-lab/` и `client/src/security-lab/` содержат уязвимости **только для демонстрации сканера**.

### Найденные уязвимости и исправления

| Правило | Файл (до) | Проблема | Исправление |
|---------|-----------|----------|-------------|
| `hardcoded-secret` | `sast-triggers.ts` | API-ключ в коде | `process.env.LAB_API_KEY` → [`sast-triggers-fixed.ts`](../server/src/security-lab/sast-triggers-fixed.ts) |
| `eval-user-input` | `sast-triggers.ts` | RCE через `eval()` | `JSON.parse()` + валидация |
| `sql-string-concat` | `sast-triggers.ts` | SQL-инъекция | Параметризованный запрос `?` |
| `path-traversal` | `sast-triggers.ts` | Обход каталога | `path.resolve()` + проверка префикса |
| `dangerously-set-inner-html` | `SastTrigger.tsx` | Stored/reflected XSS | Рендер текста без HTML → [`SastTriggerFixed.tsx`](../client/src/security-lab/SastTriggerFixed.tsx) |
| `missing-rate-limit-upload` | `app.ts` | DoS на `/api/upload` | Добавить rate limiting (express-rate-limit) в production |

### Локальный запуск

```bash
# Установка: pip install semgrep  (или Docker)
npm run security:sast
```

### CI

Job `sast-semgrep` в workflow `Security Analysis`. Отчёт: артефакт `sast-semgrep-report`.

---

## 2. DAST — OWASP ZAP (7 баллов + 3 за CI)

### Инструмент

[OWASP ZAP](https://www.zaproxy.org/) — open-source DAST. В CI используется `zaproxy/action-baseline`.

### Конфигурация

| Файл | Назначение |
|------|------------|
| [`security/zap/rules.tsv`](zap/rules.tsv) | Настройка уровней алертов ZAP |
| `server/src/security-lab/dast-routes.ts` | Намеренные уязвимые эндпоинты |

**Lab-эндпоинты** (включаются через `ENABLE_SECURITY_LAB=true`):

| URL | Уязвимость |
|-----|------------|
| `GET /api/lab/echo?msg=` | Reflected XSS (нет экранирования HTML) |
| `GET /api/lab/debug-info` | Information disclosure (версия Node, память) |
| `GET /api/lab/insecure-page` | Отсутствие security headers |
| `GET /api/products/test/forTestsOnly` | Неаутентифицированная очистка БД (при `ENABLE_TEST_ROUTES=true`) |

### Найденные уязвимости и исправления

| Алерт ZAP | Как исправить |
|-----------|---------------|
| **Cross Site Scripting (Reflected)** | Экранировать вывод: `encodeURIComponent()` / шаблонизатор; для API — `Content-Type: application/json` вместо HTML |
| **Information Disclosure** | Удалить debug-эндпоинты в production; не отдавать `process.memoryUsage()` |
| **Missing Security Headers** | Подключить `helmet`: CSP, X-Frame-Options, X-Content-Type-Options |
| **Unauthenticated destructive API** | Защитить тестовый маршрут флагом `ENABLE_TEST_ROUTES` (уже исправлено) + добавить аутентификацию для prod |

### Локальный запуск (Docker)

```bash
# 1. Запустить сервер
cd server
set ENABLE_SECURITY_LAB=true
set ENABLE_TEST_ROUTES=true
npm run dev

# 2. ZAP baseline (нужен Docker)
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -r security/reports/zap-report.html
```

### CI

Job `dast-zap`: поднимает сервер, сканирует `http://localhost:3000`. Отчёт: артефакт `dast-zap-report`.

---

## 3. SCA — OWASP Dependency-Check + npm audit (7 баллов + 3 за CI)

### Инструменты

1. **[OWASP Dependency-Check](https://jeremylong.github.io/Dependency-Check/)** — сканирует `node_modules` по базе NVD/CVE
2. **npm audit** — встроенный аудит npm-зависимостей

### Конфигурация

| Файл | Назначение |
|------|------------|
| [`security/dependency-check-suppressions.xml`](dependency-check-suppressions.xml) | Подавление ложных срабатываний |

### Результаты npm audit (пример)

На момент настройки обнаружено **16 уязвимостей** (4 critical, 7 high, 5 moderate):

| Пакет | Severity | Критичность для recipe-book | Рекомендация |
|-------|----------|----------------------------|--------------|
| `shell-quote` (via `concurrently`) | **Critical** | Низкая — devDependency, не в runtime prod | `npm audit fix`, обновить `concurrently` |
| `vitest` | **Critical** | Низкая — только в тестах, UI-сервер не используется в prod | Обновить до ≥3.2.6 |
| `react-router` / `react-router-dom` | **High** | **Средняя** — клиентский SPA, RCE через turbo-stream при определённых условиях | `npm audit fix`, обновить до ≥7.14.2 |
| `vite` | **High** | Низкая — только dev-сервер, не в production build | Обновить Vite |
| `qs` (via `express`) | **Moderate** | **Средняя** — сервер обрабатывает query/body | `npm audit fix` |
| `defu`, `effect` (via `prisma`) | **High** | Низкая — транзитивные dev-зависимости Prisma CLI | Обновить `prisma` |
| `postcss` | **Moderate** | Низкая — транзитивная, XSS в stringify CSS | `npm audit fix` |
| `brace-expansion` | **Moderate** | Низкая | `npm audit fix` |

### Стратегия борьбы с уязвимостями

1. **`npm audit fix`** — автоматическое обновление патч-версий
2. **`npm audit fix --force`** — только после проверки breaking changes
3. **Dependabot / Renovate** — автоматические PR с обновлениями
4. **Разделение dev/prod** — critical в `vitest`/`concurrently` не влияют на production runtime
5. **Приоритет** — сначала `express`/`react-router` (runtime), потом dev-tools

### Локальный запуск

```bash
npm run security:sca
npm run security:sca:report
```

### CI

Job `sca-dependencies`. Отчёты: артефакт `sca-reports` (HTML/JSON от Dependency-Check + npm audit).

---

## 4. GitHub Actions (бонус +9 баллов)

Workflow **Security Analysis** запускается на:

- `push` в `main` / `master`
- `pull_request`
- `workflow_dispatch` (ручной запуск)

Три параллельных job:

```
sast-semgrep ──────► артефакт semgrep-report.json
sca-dependencies ──► артефакт dependency-check + npm-audit
dast-zap ──────────► артефакт zap HTML/JSON/MD
```

### Как посмотреть отчёты

1. Откройте **Actions** → **Security Analysis** → нужный run
2. Внизу страницы — **Artifacts** (скачать ZIP)

---

## 5. Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `ENABLE_SECURITY_LAB=true` | Включить DAST lab-эндпоинты |
| `ENABLE_TEST_ROUTES=true` | Включить `/api/products/test/forTestsOnly` |
| `SEMGREP_APP_TOKEN` | (опционально) Semgrep Cloud в CI |
