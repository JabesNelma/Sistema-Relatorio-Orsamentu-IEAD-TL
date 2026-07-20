# IEAD Rejiaun 1 - Sistema Finansa

Sistem Manajemen Keuangan untuk Gereja IEAD (Igreja Evangélica Assembleia de Deus) Timor-Leste.

## Versi 0.1.0

### Fitur Utama

- **Login Google OAuth** - Super Admin login menggunakan Google OAuth dengan pembatasan email
- **QR Login** - Admin Regional dan Admin Lokal login menggunakan QR token
- **Dashboard Multi-Level**:
  - Super Admin: Overview seluruh region, manajemen user, QR tokens
  - Admin Regional: Rekapitulasi keuangan dari suku-suku di regionnya
  - Admin Lokal: Input laporan keuangan harian
- **Laporan Keuangan** - Persembahan, perpuluhan, dan kontribusi lainnya
- **Export Excel** - Export data keuangan ke format Excel

### Teknologi

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth (Google OAuth), Session-based auth (QR Login)

## Setup

### 1. Clone Repository

```bash
git clone git@github.com:JabesNelma/IEAD-Rejiaun-1.git
cd IEAD-Rejiaun-1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy `.env.example` ke `.env` dan isi dengan konfigurasi Anda:

```bash
cp .env.example .env
```

Edit `.env` dengan nilai yang sesuai:
- `DATABASE_URL` dan `DIRECT_URL` dari Supabase
- `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari Supabase
- `SUPER_ADMIN_EMAIL` - Email Google yang akan menjadi Super Admin
- `JWT_SECRET` - Secret key minimal 32 karakter

### 4. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema ke database
npx prisma db push

# Seed data awal (opsional)
npx prisma db seed
```

### 5. Setup Google OAuth di Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Masuk ke **Authentication** → **Providers**
4. Enable **Google** provider
5. Masukkan Google OAuth Client ID dan Client Secret dari [Google Cloud Console](https://console.cloud.google.com/)
6. Tambahkan redirect URL: `http://localhost:3000/api/auth/google/callback`

### 6. Jalankan Aplikasi

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## Struktur User

| Role | Login Method | Akses |
|------|--------------|-------|
| SUPER_ADMIN | Google OAuth | Seluruh sistem, manajemen user & QR tokens |
| ADMIN_REGIONAL | QR Token | Dashboard regional, rekapitulasi keuangan |
| ADMIN_LOKAL | QR Token | Input laporan keuangan suku |

## API Endpoints

### Authentication
- `GET /api/auth/google` - Memulai Google OAuth flow
- `GET /api/auth/google/callback` - Callback dari Google OAuth
- `POST /api/auth/qr-login` - Login dengan QR token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Admin (Super Admin only)
- `GET/POST /api/admin/users` - Manajemen users
- `GET/POST /api/admin/qr-codes` - Manajemen QR tokens
- `GET/POST /api/admin/regions` - Manajemen regions
- `GET/POST /api/admin/sukus` - Manajemen sukus

### Financial
- `GET/POST /api/financial/reports` - Laporan keuangan
- `GET /api/financial/regional-summary` - Ringkasan regional
- `GET /api/financial/lokal-summary` - Ringkasan lokal

### Export
- `GET /api/export/excel` - Export data ke Excel

## Deployment

### Vercel (Recommended)

1. Push ke GitHub
2. Connect repository di Vercel
3. Set environment variables di Vercel dashboard
4. Deploy

### Self-hosted

```bash
npm run build
NODE_ENV=production npm start
```

## Kontribusi

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## Lisensi

MIT License - Lihat file [LICENSE](LICENSE) untuk detail.

## Kontak

- **Developer**: Jabes Nelma
- **Email**: jabesnelma056@gmail.com
- **GitHub**: [JabesNelma](https://github.com/JabesNelma)