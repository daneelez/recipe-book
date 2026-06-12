# Recipe Book

Веб-приложение для ведения книги рецептов: каталог продуктов и блюд с расчётом КБЖУ, фильтрами, загрузкой фотографий и UI-тестами.

Monorepo на **Node.js**:


| Пакет     | Стек                                  |
| --------- | ------------------------------------- |
| `server/` | Express, Prisma (SQLite), Zod, Vitest |
| `client/` | React 19, Vite, React Router          |


---

## Структура проекта

```
recipe-book/
├── client/                 # React SPA (порт 5173)
├── server/                 # REST API (порт 3000)
│   ├── prisma/schema.prisma
│   └── src/
│       ├── routes/         # /api/products, /api/dishes
│       └── security-lab/   # намеренные уязвимости для сканеров
├── security/               # конфиги и отчёты анализа безопасности
│   ├── semgrep/
│   ├── zap/
│   └── REPORT.md           # подробный отчёт по лабораторной
├── .github/workflows/
│   └── security.yml        # SAST + DAST + SCA в CI
└── package.json            # npm workspaces
```

---

## Быстрый старт

### Требования

- Node.js 22+
- npm 10+

### Установка и запуск

```bash
npm install
npm run db:push          # создать SQLite-базу (server/dev.db)
npm run dev              # сервер :3000 + клиент :5173
```

Клиент проксирует `/api` и `/uploads` на бэкенд (см. `client/vite.config.ts`).

### Сборка и тесты

```bash
npm run build            # server + client
npm test                 # unit-тесты сервера (Vitest)
npm run test:ui          # UI-тесты (Playwright)
npm run test:ui:headed   # Playwright с браузером
```

### Переменные окружения (server)

Создайте `server/.env`:

```env
DATABASE_URL="file:./dev.db"
PORT=3000
```


| Переменная                 | Назначение                                 |
| -------------------------- | ------------------------------------------ |
| `DATABASE_URL`             | Путь к SQLite-базе Prisma                  |
| `PORT`                     | Порт API (по умолчанию 3000)               |
| `ENABLE_SECURITY_LAB=true` | Включить DAST lab-эндпоинты (`/api/lab/*`) |
| `ENABLE_TEST_ROUTES=true`  | Включить тестовый маршрут очистки БД       |


---

## API (кратко)


| Метод                 | Путь                       | Описание                          |
| --------------------- | -------------------------- | --------------------------------- |
| `GET`                 | `/api/health`              | Проверка работоспособности        |
| `GET/POST/PUT/DELETE` | `/api/products`            | CRUD продуктов                    |
| `GET/POST/PUT/DELETE` | `/api/dishes`              | CRUD блюд                         |
| `POST`                | `/api/dishes/preview-kbju` | Расчёт КБЖУ порции                |
| `POST`                | `/api/upload`              | Загрузка фото (до 5 файлов, 5 МБ) |


---

## Анализ безопасности

В проекте настроены три уровня автоматизированного тестирования безопасности. Все инструменты интегрированы в **GitHub Actions** (workflow `[Security Analysis](.github/workflows/security.yml)`).

Подробный отчёт с примерами уязвимостей и исправлений: `[security/REPORT.md](security/REPORT.md)`.

### SAST — Semgrep (статический анализ)

**Инструмент:** [Semgrep](https://semgrep.dev/) — open-source SAST для TypeScript/JavaScript.

**Конфигурация:**


| Файл                                                                     | Назначение                                      |
| ------------------------------------------------------------------------ | ----------------------------------------------- |
| `[.semgrep.yml](.semgrep.yml)`                                           | Корневой конфиг                                 |
| `[security/semgrep/custom-rules.yml](security/semgrep/custom-rules.yml)` | 6 кастомных правил                              |
| `[.semgrepignore](.semgrepignore)`                                       | Исключения (node_modules, исправленные примеры) |


**Подключённые rulesets:** `p/security-audit`, `p/owasp-top-ten`, `p/nodejs`, `p/typescript`.

**Кастомные правила:**

1. `recipe-book.hardcoded-secret` — захардкоженные секреты
2. `recipe-book.eval-user-input` — `eval()` с пользовательским вводом
3. `recipe-book.sql-string-concat` — SQL-инъекция через конкатенацию
4. `recipe-book.path-traversal` — path traversal в путях к файлам
5. `recipe-book.missing-rate-limit-upload` — загрузка файлов без rate limit
6. `recipe-book.dangerously-set-inner-html` — XSS через React

**Намеренные триггеры** (только для демонстрации сканера):

- `server/src/security-lab/sast-triggers.ts`
- `client/src/security-lab/SastTrigger.tsx`

**Исправленные версии:**

- `server/src/security-lab/sast-triggers-fixed.ts`
- `client/src/security-lab/SastTriggerFixed.tsx`

**Локальный запуск:**

```bash
# pip install semgrep   или Docker
npm run security:sast
```

**Результат сканирования:** 5 находок (hardcoded secret, eval, SQL injection, XSS, upload без rate limit).

**CI:** job `sast-semgrep` → артефакт `sast-semgrep-report`.

---

### DAST — OWASP ZAP (динамический анализ)

**Инструмент:** [OWASP ZAP](https://www.zaproxy.org/) — baseline-скан через `zaproxy/action-baseline`.

**Конфигурация:**


| Файл                                               | Назначение                    |
| -------------------------------------------------- | ----------------------------- |
| `[security/zap/rules.tsv](security/zap/rules.tsv)` | Уровни алертов ZAP            |
| `server/src/security-lab/dast-routes.ts`           | Намеренные уязвимые эндпоинты |


**Lab-эндпоинты** (`ENABLE_SECURITY_LAB=true`):


| URL                                   | Уязвимость                                                   |
| ------------------------------------- | ------------------------------------------------------------ |
| `GET /api/lab/echo?msg=`              | Reflected XSS                                                |
| `GET /api/lab/debug-info`             | Information disclosure                                       |
| `GET /api/lab/insecure-page`          | Отсутствие security headers                                  |
| `GET /api/products/test/forTestsOnly` | Неаутентифицированная очистка БД (`ENABLE_TEST_ROUTES=true`) |


**Как исправлять находки ZAP:**


| Алерт                            | Решение                                                        |
| -------------------------------- | -------------------------------------------------------------- |
| Cross Site Scripting (Reflected) | Экранировать вывод; для API — `Content-Type: application/json` |
| Information Disclosure           | Убрать debug-эндпоинты в production                            |
| Missing Security Headers         | Подключить `helmet` (CSP, X-Frame-Options и др.)               |
| Unauthenticated destructive API  | Защита флагом `ENABLE_TEST_ROUTES` + аутентификация в prod     |


**Локальный запуск (Docker):**

```bash
# PowerShell — запустить сервер
cd server
$env:ENABLE_SECURITY_LAB="true"
$env:ENABLE_TEST_ROUTES="true"
npm run dev

# ZAP baseline (в другом терминале)
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py `
  -t http://host.docker.internal:3000 `
  -r security/reports/zap-report.html
```

**CI:** job `dast-zap` поднимает сервер и сканирует `http://localhost:3000` → артефакт `dast-zap-report`.

---

### SCA — OWASP Dependency-Check + npm audit (композитный анализ)

**Инструменты:**

1. [OWASP Dependency-Check](https://jeremylong.github.io/Dependency-Check/) — сканирование `node_modules` по CVE/NVD
2. **npm audit** — встроенный аудит npm-зависимостей

**Конфигурация:** `[security/dependency-check-suppressions.xml](security/dependency-check-suppressions.xml)`

**Результаты npm audit** (на момент настройки): **16 уязвимостей** (4 critical, 7 high, 5 moderate).


| Пакет                               | Severity | Критичность для приложения          | Рекомендация       |
| ----------------------------------- | -------- | ----------------------------------- | ------------------ |
| `shell-quote` (via `concurrently`)  | Critical | Низкая — devDependency              | `npm audit fix`    |
| `vitest`                            | Critical | Низкая — только тесты               | Обновить до ≥3.2.6 |
| `react-router` / `react-router-dom` | High     | **Средняя** — клиентский SPA        | `npm audit fix`    |
| `vite`                              | High     | Низкая — только dev-сервер          | Обновить Vite      |
| `qs` (via `express`)                | Moderate | **Средняя** — серверный runtime     | `npm audit fix`    |
| `defu`, `effect` (via `prisma`)     | High     | Низкая — dev-зависимости Prisma CLI | Обновить `prisma`  |
| `postcss`, `brace-expansion`        | Moderate | Низкая                              | `npm audit fix`    |


**Стратегия:**

1. `npm audit fix` — патч-обновления
2. `npm audit fix --force` — только после проверки breaking changes
3. Dependabot / Renovate — автоматические PR
4. Приоритет: runtime (`express`, `react-router`) → dev-tools

**Локальный запуск:**

```bash
npm run security:sca
npm run security:sca:report    # JSON в security/reports/npm-audit.json
```

**CI:** job `sca-dependencies` → артефакт `sca-reports`.

---

## GitHub Actions

Workflow **Security Analysis** запускается при:

- `push` в `main` / `master`
- `pull_request`
- ручном запуске (`workflow_dispatch`)

```
sast-semgrep ──────► semgrep-report.json
sca-dependencies ──► dependency-check + npm-audit
dast-zap ──────────► ZAP HTML / JSON / MD
```

### Как посмотреть отчёты

1. GitHub → **Actions** → **Security Analysis** → нужный run
2. Внизу страницы — **Artifacts** (скачать ZIP)

### Опциональные секреты


| Секрет              | Назначение                                         |
| ------------------- | -------------------------------------------------- |
| `SEMGREP_APP_TOKEN` | Semgrep Cloud (не обязателен для OSS-сканирования) |


---

## Скрипты npm (корень)


| Команда                       | Описание                        |
| ----------------------------- | ------------------------------- |
| `npm run dev`                 | Сервер + клиент в dev-режиме    |
| `npm run build`               | Production-сборка               |
| `npm test`                    | Unit-тесты сервера              |
| `npm run test:ui`             | Playwright UI-тесты             |
| `npm run db:push`             | Применить схему Prisma к SQLite |
| `npm run security:sast`       | Semgrep SAST                    |
| `npm run security:sca`        | npm audit                       |
| `npm run security:sca:report` | npm audit → JSON-отчёт          |


---

## Лицензия

Учебный проект.