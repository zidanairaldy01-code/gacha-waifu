# Panduan Deploy: Vercel (Frontend) + Railway (Backend)

## Overview

| Bagian | Platform | URL |
|--------|----------|-----|
| Frontend (Next.js) | Vercel | `https://gacha-waifu-xxx.vercel.app` |
| Backend (Laravel) | Railway | `https://gacha-waifu-backend-xxx.railway.app` |

---

## LANGKAH 1 — Push ke GitHub

Pastikan project sudah ada di GitHub. Kalau belum:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/USERNAME/gacha-waifu.git
git push -u origin main
```

> **Penting:** File `.env` dan `.env.local` otomatis tidak ter-commit (ada di `.gitignore`).
> Kamu perlu set environment variables secara manual di Railway & Vercel.

---

## LANGKAH 2 — Deploy Backend ke Railway

### 2a. Buat akun & project baru di Railway

1. Buka [railway.app](https://railway.app) → Login dengan GitHub
2. Klik **"New Project"** → **"Deploy from GitHub repo"**
3. Pilih repo `gacha-waifu`
4. **PENTING:** Di bagian **"Root Directory"**, ubah ke `backend`
5. Railway akan detect Laravel via nixpacks otomatis

### 2b. Set Environment Variables di Railway

Di Railway dashboard → pilih service → tab **"Variables"**, tambahkan:

```
APP_NAME=GachaWaifu
APP_ENV=production
APP_KEY=                ← generate dulu (lihat di bawah)
APP_DEBUG=false
APP_URL=                ← isi setelah Railway beri domain (format: https://xxx.railway.app)
DB_CONNECTION=sqlite
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
LOG_CHANNEL=stderr
LOG_LEVEL=error
FRONTEND_URL=           ← isi setelah Vercel beri domain
GROQ_API_KEY=           ← API key Groq kamu (dari .env lokal)
```

### 2c. Generate APP_KEY

Jalankan di terminal lokal:
```bash
cd backend
php artisan key:generate --show
```
Copy outputnya (format: `base64:xxx...`) ke variabel `APP_KEY` di Railway.

### 2d. Set domain Railway

Setelah deploy selesai, Railway akan beri domain otomatis.
- Railway dashboard → Settings → Networking → **"Generate Domain"**
- Copy domain ini untuk dipakai di Vercel dan update `APP_URL` + `FRONTEND_URL`

---

## LANGKAH 3 — Deploy Frontend ke Vercel

### 3a. Import project ke Vercel

1. Buka [vercel.com](https://vercel.com) → Login dengan GitHub
2. Klik **"Add New Project"** → Import repo `gacha-waifu`
3. **Root Directory**: biarkan kosong (root) karena Next.js ada di root
4. Framework: Vercel akan detect Next.js otomatis

### 3b. Set Environment Variables di Vercel

Di Vercel → project → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://xxx.railway.app/api
```

Ganti `xxx.railway.app` dengan domain Railway yang kamu dapat di langkah 2d.

### 3c. Deploy

Klik **Deploy**. Vercel akan build dan beri domain seperti `https://gacha-waifu-xxx.vercel.app`.

---

## LANGKAH 4 — Update CORS di Railway

Setelah dapat domain Vercel, update variabel `FRONTEND_URL` di Railway:

```
FRONTEND_URL=https://gacha-waifu-xxx.vercel.app
```

Railway akan auto-restart dan apply perubahan.

---

## Troubleshooting

### Backend error 500
- Cek logs di Railway → tab "Deployments" → klik deployment → "View Logs"
- Pastikan `APP_KEY` sudah diset
- Pastikan `APP_DEBUG=false` (jangan set true di production)

### CORS error di browser
- Pastikan `FRONTEND_URL` di Railway sudah diisi dengan URL Vercel yang benar
- Pastikan URL tanpa trailing slash

### Database kosong / waifu tidak muncul
- Railway terminal: `php artisan db:seed --force`
- Atau cek apakah migration sudah jalan di logs

### SQLite hilang saat Railway restart
Ini normal karena Railway tidak persist filesystem secara default pada free tier.
Untuk data yang persist, tambahkan **PostgreSQL plugin** di Railway:
1. Railway project → **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway akan auto-set `DATABASE_URL`
3. Tambah variabel: `DB_CONNECTION=pgsql`
4. Hapus `DB_CONNECTION=sqlite`

---

## Catatan Biaya

- **Vercel**: Free tier cukup untuk demo (100GB bandwidth/bulan)
- **Railway**: Free tier $5 credit/bulan, cukup untuk demo ringan
