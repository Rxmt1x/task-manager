# Task Manager API

یک API ساده و ماژولار برای مدیریت تسک‌ها با **Node.js + Express + TypeORM + PostgreSQL**.

این پروژه برای یادگیری بک‌اند طراحی شده و تمرکز اصلی آن روی این موارد است:
- احراز هویت کاربر (Signup / Signin)
- محافظت از مسیرها با JWT
- مدیریت تسک‌ها به‌صورت **User-scoped** (هر کاربر فقط تسک‌های خودش را می‌بیند و تغییر می‌دهد)
- جستجو، فیلتر و صفحه‌بندی در لیست تسک‌ها

---

## پروژه دقیقا چه کاری انجام می‌دهد؟

بعد از ثبت‌نام یا ورود، برای کاربر یک توکن JWT صادر می‌شود. این توکن در هدر درخواست‌های محافظت‌شده ارسال می‌شود:

```http
Authorization: Bearer <token>
```

سرور با استفاده از middleware احراز هویت، کاربر را شناسایی می‌کند (`req.user`) و تمام عملیات تسک را بر اساس `userId` محدود می‌کند.

یعنی:
- کاربر فقط تسک‌های خودش را می‌بیند.
- کاربر فقط تسک‌های خودش را ویرایش یا حذف می‌کند.

---

## تکنولوژی‌ها

- **Node.js**
- **Express**
- **TypeORM** (با `EntitySchema` در JavaScript)
- **PostgreSQL**
- **JWT** برای احراز هویت
- **bcryptjs** برای هش کردن پسورد
- **dotenv** برای مدیریت متغیرهای محیطی

---

## ساختار پوشه‌ها

```bash
.
├── middleware
│   └── auth.js                 # بررسی JWT و ست کردن req.user
├── routes
│   ├── auth.js                 # مسیرهای احراز هویت (signup/signin/me)
│   └── tasks.js                # مسیرهای مدیریت تسک (CRUD + search + pagination)
├── src
│   ├── data-source.js          # تنظیمات TypeORM DataSource
│   ├── entity
│   │   ├── User.js             # Entity کاربر
│   │   └── Task.js             # Entity تسک
│   └── migration
│       └── 1770650572144-Init.js # Migration ساخت جدول‌های user و task
├── server.js                   # نقطه شروع برنامه و mount کردن routeها
├── package.json
└── README.md
```

---

## نحوه اجرا

### 1) نصب وابستگی‌ها

```bash
npm install
```

### 2) ساخت فایل `.env`

یک فایل `.env` در ریشه پروژه بسازید:

```env
PORT=5000
JWT_SECRET=your-super-secret-key
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=task_manager_db
DB_SCHEMA=public
NODE_ENV=development
```

### 3) اجرای پروژه

حالت توسعه:

```bash
npm run dev
```

حالت معمولی:

```bash
npm start
```

---

## نحوه احراز هویت

1. با `POST /auth/signup` ثبت‌نام کنید.
2. یا با `POST /auth/signin` وارد شوید.
3. از پاسخ، `token` را بردارید.
4. در درخواست‌های محافظت‌شده، هدر زیر را بفرستید:

```http
Authorization: Bearer <token>
```

---

## Endpoint

Base URL پیشنهادی در لوکال:

```text
http://localhost:5000
```

### عمومی

#### `GET /`
بررسی سلامت اولیه API.

---

### احراز هویت (`/auth`)

#### `POST /auth/signup`
ثبت‌نام کاربر جدید.

نمونه body:

```json
{
  "email": "user@example.com",
  "password": "123456",
  "name": "Ali"
}
```

---

#### `POST /auth/signin`
ورود کاربر و دریافت توکن.

نمونه body:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

---

#### `GET /auth/me` 🔒
دریافت اطلاعات کاربر لاگین‌شده.

---

### تسک‌ها (`/tasks`) 🔒

> همه endpointهای این بخش نیاز به توکن JWT دارند.

#### `GET /tasks`
دریافت لیست تسک‌های کاربر جاری + صفحه‌بندی + جستجو + فیلتر.

Query params:
- `page` (پیش‌فرض: `1`)
- `limit` (پیش‌فرض: `20`، حداکثر: `100`)
- `q` (جستجو در `title` و `description`)
- `status` (`pending` | `in progress` | `done`)
- `priority` (`low` | `medium` | `high`)

نمونه:

```http
GET /tasks?page=1&limit=20&q=report&status=pending&priority=high
```

---

#### `GET /tasks/:id`
دریافت یک تسک مشخص (فقط اگر متعلق به همان کاربر باشد).

---

#### `POST /tasks`
ساخت تسک جدید.

نمونه body:

```json
{
  "title": "Finish backend task",
  "description": "Implement auth guard",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-12-01T10:00:00.000Z"
}
```

فیلدهای زمانی `createdAt` و `updatedAt` به‌صورت خودکار مدیریت می‌شوند.

---

#### `PATCH /tasks/:id`
ویرایش بخشی از تسک (عنوان، توضیحات، وضعیت، اولویت، تاریخ سررسید).

نمونه body:

```json
{
  "status": "in progress",
  "priority": "medium"
}
```

---

#### `DELETE /tasks/:id`
حذف تسک (فقط اگر متعلق به همان کاربر باشد).

---

## مدل داده تسک

هر تسک شامل این فیلدهاست:
- `title`
- `description`
- `status` (`pending` | `in progress` | `done`)
- `priority` (`low` | `medium` | `high`)
- `dueDate`
- `createdAt` (اتوماتیک)
- `updatedAt` (اتوماتیک)

---

## نکات امنیتی و توسعه

- فایل `.env` را commit نکنید (در `.gitignore` قرار دارد).
- برای محیط production مقدار قوی برای `JWT_SECRET` تنظیم کنید.
- در نسخه‌های بعدی می‌توانید اضافه کنید:
  - Rate limit روی auth routeها
  - Validation حرفه‌ای‌تر (مثلا با `zod` یا `joi`)
  - Refresh Token
  - لاگ‌گیری ساخت‌یافته و تست خودکار

---

## وضعیت فعلی پروژه

این نسخه، یک هسته بک‌اند قابل‌استفاده برای Task Manager است که نیازهای اصلی زیر را پوشش می‌دهد:
- Signup / Signin
- Auth Guard
- Task CRUD
- Search / Filter / Pagination
- User ownership enforcement
