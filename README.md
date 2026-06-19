# Mystery Website

Mystery Website 是一個神秘學主題的全端網頁應用，前端使用 React + Vite，後端使用 Express + Prisma，資料庫使用 PostgreSQL/Supabase。專案包含使用者帳號、個人檔案、收藏、塔羅牌庫、塔羅抽牌紀錄、占星、八字、紫微斗數文章與 AI 解讀功能。

## Project Overview

主要功能：

- 使用者註冊、登入與 JWT 驗證
- 個人檔案、頭像、主牌、個人簡介與偏好設定
- 四大主題文章：塔羅、占星、八字、紫微斗數
- 塔羅牌資料庫：大阿爾克那與小阿爾克那
- 塔羅抽牌流程與歷史紀錄
- 占星、八字、紫微斗數推演紀錄
- 文章與歷史紀錄收藏
- Gemini AI 解讀 API
- Vercel 前端部署、Render 後端部署、Supabase PostgreSQL 資料庫

## Tech Stack

Frontend:

- React 19
- Vite
- React Router
- Three.js / React Three Fiber / Drei
- Framer Motion / GSAP
- Lucide React / React Icons
- html2canvas

Backend:

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt
- multer
- Gemini API

Deployment:

- Frontend: Vercel
- Backend: Render
- Database: Supabase PostgreSQL

## Project Structure

```text
mystery/
├─ frontend/
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ components/
│  │  │  ├─ LoginPage.jsx
│  │  │  ├─ MainDashboard.jsx
│  │  │  ├─ ProfilePage.jsx
│  │  │  ├─ ProtectedRoute.jsx
│  │  │  ├─ pages/
│  │  │  │  ├─ TarotPage.jsx
│  │  │  │  ├─ TarotDrawingSystem.jsx
│  │  │  │  ├─ AstrologyPage.jsx
│  │  │  │  ├─ BaZiPage.jsx
│  │  │  │  └─ ZiWeiPage.jsx
│  │  │  └─ results/
│  │  └─ ...
│  ├─ vercel.json
│  └─ package.json
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ migrations/
│  ├─ src/
│  │  ├─ server.js
│  │  ├─ seedIfEmpty.js
│  │  ├─ seedMysticArticles.js
│  │  ├─ seedTarotCards.js
│  │  ├─ tarotMinorCards.js
│  │  └─ spider.js
│  ├─ public/
│  └─ package.json
├─ package.json
└─ README.md
```

## Frontend Routes

Defined in `frontend/src/App.jsx`:

- `/` - entry page
- `/login` - login/register page
- `/maindashboard` - main dashboard
- `/tarot` - tarot article/card system
- `/tarot/drawing` - tarot drawing flow
- `/astrology` - astrology page
- `/bazi` - BaZi page
- `/ziwei` - Zi Wei page
- `/profile` - user profile

Protected routes require login and a valid token in local storage.

## Backend API Summary

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`

User:

- `GET /api/user/profile`
- `POST /api/user/avatar`
- `PUT /api/user/profile/update`
- `PUT /api/user/master-card`
- `DELETE /api/user/master-card`
- `PUT /api/user/change-password`
- `DELETE /api/user/delete`

Favorites:

- `GET /api/user/favorites`
- `POST /api/user/favorites`
- `DELETE /api/user/favorites/:id`

Articles:

- `GET /api/tarot/articles?tabType=origins`
- `GET /api/tarot/articles?tabType=codex`
- `GET /api/astrology/articles?tabType=origins`
- `GET /api/astrology/articles?tabType=codex`
- `GET /api/bazi/articles?tabType=origins`
- `GET /api/bazi/articles?tabType=codex`
- `GET /api/ziwei/articles?tabType=origins`
- `GET /api/ziwei/articles?tabType=codex`

Tarot Cards:

- `GET /api/tarot/cards`
- `GET /api/tarot/cards?suit=MAJOR`
- `GET /api/tarot/cards/:slug`

History:

- `GET /api/history/tarot`
- `GET /api/history/astrology`
- `GET /api/history/bazi`
- `GET /api/history/ziwei`
- `POST /api/history/:system`
- `PUT /api/history/:system/:id`
- `DELETE /api/history/:system/:id`

AI:

- `POST /api/ai/reading`

Static files:

- `/tarot/*` - tarot public assets

## Database

Prisma schema is located at:

```text
backend/prisma/schema.prisma
```

Main models:

- `User` - account profile, password hash, avatar, master card, display preferences
- `Article` - mystic-system articles for TAROT, ASTROLOGY, BAZI, ZIWEI
- `TarotCard` - tarot card metadata, image URLs, meanings, prompts
- `History` - saved reading/result history
- `Favorite` - saved articles or history records

Important enums:

- `SystemType`: `TAROT`, `ASTROLOGY`, `BAZI`, `ZIWEI`
- `ArticleTabType`: `ORIGINS`, `CODEX`, `REPORT`
- `ArticleCategory`: `MYTHOLOGY`, `HISTORY`, `SOUL`, `DIVINATION`
- `TarotSuit`: `MAJOR`, `WANDS`, `CUPS`, `SWORDS`, `DISKS`

## Environment Variables

Backend `.env`:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
PORT=5000
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.0-flash"
AI_PROMPT_MAX_CHARS=4200
AI_RATE_LIMIT_WINDOW_MS=3600000
AI_RATE_LIMIT_MAX=12
AI_MAX_OUTPUT_TOKENS=1200
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SECRET_KEY="your-supabase-secret-key"
SUPABASE_STORAGE_BUCKET="avatars"
```

Required:

- `DATABASE_URL`
- `JWT_SECRET`

Required only when AI reading is enabled:

- `GEMINI_API_KEY`

Required for permanent avatar uploads:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_STORAGE_BUCKET`

Frontend `.env` or Vercel environment variable:

```env
VITE_API_BASE_URL="https://your-render-backend.onrender.com"
```

Local default is:

```text
http://localhost:5000
```

## Local Development

Install dependencies:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

Generate Prisma client:

```bash
cd backend
npx prisma generate
```

Run migrations locally:

```bash
cd backend
npx prisma migrate dev
```

Start both frontend and backend from project root:

```bash
npm run dev
```

Start separately:

```bash
npm run dev:backend
npm run dev:frontend
```

Backend local URL:

```text
http://localhost:5000
```

Frontend local URL is shown by Vite, usually:

```text
http://localhost:5173
```

## Seed Data

Seed scripts are in `backend/src`.

```bash
npm --prefix backend run seed:if-empty
npm --prefix backend run seed:all
npm --prefix backend run seed:articles
npm --prefix backend run seed:tarot-cards
```

Scripts:

- `seed:if-empty` - checks database first; seeds only empty article/card tables
- `seed:all` - runs all seed scripts
- `seed:articles` - seeds four-system articles
- `seed:tarot-cards` - seeds tarot cards and tarot codex articles

The seed scripts use Prisma `upsert`, so rerunning them updates existing rows instead of creating duplicates.

Recommended deployment behavior:

- Put `seed:if-empty` in Render Build Command.
- Do not put seed commands in `start`.
- `npm start` should only start the API server.

## Deployment

### Backend on Render

If Render's root directory is `backend`, use:

Build Command:

```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run seed:if-empty
```

Start Command:

```bash
npm start
```

Required Render environment variables:

```env
DATABASE_URL="your-supabase-postgres-url"
JWT_SECRET="your-secret"
GEMINI_API_KEY="your-gemini-api-key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SECRET_KEY="your-supabase-secret-key"
SUPABASE_STORAGE_BUCKET="avatars"
```

Optional Render environment variables:

```env
GEMINI_MODEL="gemini-2.0-flash"
AI_PROMPT_MAX_CHARS=4200
AI_RATE_LIMIT_WINDOW_MS=3600000
AI_RATE_LIMIT_MAX=12
AI_MAX_OUTPUT_TOKENS=1200
```

### Frontend on Vercel

If Vercel's root directory is `frontend`, use:

Build Command:

```bash
npm run build
```

Output Directory:

```text
dist
```

Required Vercel environment variable:

```env
VITE_API_BASE_URL="https://your-render-backend.onrender.com"
```

`frontend/vercel.json` rewrites every route to `index.html` so React Router can handle browser refreshes on nested routes.

## Common Commands

Project root:

```bash
npm run dev
npm run dev:backend
npm run dev:frontend
```

Backend:

```bash
cd backend
npm run dev
npm start
npm run seed:if-empty
npm run seed:all
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
npx prisma studio
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run preview
npm run lint
```

## Notes

- `spider.js` is now a compatibility entry that runs the clean article seed. It no longer depends on web scraping.
- `seedIfEmpty.js` is intended for Render free-tier deployments where Render Shell may not be available.
- User-uploaded avatars are stored in Supabase Storage. The database stores the public avatar URL in `User.avatarUrl`.
- The Supabase Storage bucket used for avatars should be public if the frontend displays the stored URL directly.
- Supabase stores the persistent app data. Render only runs the backend API.
- Vercel only serves the frontend and calls the Render API through `VITE_API_BASE_URL`.
