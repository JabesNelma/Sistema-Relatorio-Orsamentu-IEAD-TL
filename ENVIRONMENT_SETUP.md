# Environment Setup Guide

## 📁 File Structure

```
pi1/
├── .env                    # Development environment (local, ignored by git)
├── .env.example            # Template untuk development (committed to git)
├── .env.production         # Production environment (NEVER commit this!)
├── .env.production.example # Template untuk production (committed to git)
└── .gitignore              # Mengabaikan semua file .env production
```

## 🔐 Keamanan Environment Variables

### ✅ Yang Sudah Aman

1. **File `.env.production` sudah di-ignore oleh Git**
   - Lihat di `.gitignore` ada rule eksplisit: `.env.production`
   - File ini **tidak akan pernah terpush ke GitHub**

2. **Template file `.env.production.example` aman untuk di-commit**
   - Hanya berisi placeholder, tidak ada nilai asli
   - Bisa di-share ke tim tanpa resiko kebocoran

### 🚀 Cara Setup Environment Production

#### 1. Copy template file
```bash
cp .env.production.example .env.production
```

#### 2. Generate JWT Secret yang aman
```bash
# Gunakan openssl untuk generate secret yang kuat (minimum 32 karakter)
openssl rand -base64 32
```
Copy hasilnya ke `JWT_SECRET` di `.env.production`

#### 3. Isi nilai production yang sebenarnya

Edit `.env.production` dan ganti semua placeholder dengan nilai production:

```bash
# Database - Production Supabase
DATABASE_URL="postgresql://postgres.[PROD-REF]:[PASSWORD]@..."
DIRECT_URL="postgresql://postgres.[PROD-REF]:[PASSWORD]@..."

# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://[PROD-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[PROD-KEY]

# Admin Email Production
SUPER_ADMIN_EMAIL=production-admin@domain.com
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=production-admin@domain.com

# Production Domain
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# JWT Secret (hasil dari openssl rand -base64 32)
JWT_SECRET=generated-32-char-secret-here
```

#### 4. Verifikasi keamanan
```bash
# Pastikan .env.production tidak akan ter-commit
git status

# Seharusnya TIDAK ada .env.production di list
# Jika ada, JANGAN commit!
```

## ⚠️ PENTING - Jangan Lakukan Ini!

1. **JANGAN pernah commit file `.env.production` ke GitHub**
   - Berisi kredensial production yang sensitif
   - Bisa disalahgunakan jika sampai ke tangan yang salah

2. **JANGAN share file `.env.production` via chat/email**
   - Gunakan password manager atau secure channel
   - Setiap anggota tim harus generate sendiri dari template

3. **JANGAN hard-code secrets di dalam kode**
   - Selalu gunakan environment variables
   - Pastikan tidak ada sensitive data di git history

## 🔄 Deployment Workflow

### Development
```bash
# Gunakan .env untuk development
npm run dev
```

### Production Build
```bash
# Next.js akan otomatis menggunakan .env.production
npm run build
npm run start
```

### Deployment ke Server
```bash
# 1. Di server, copy .env.production.example ke .env.production
# 2. Isi dengan nilai production yang sebenarnya
# 3. Build dan run aplikasi
npm run build
npm run start
```

## 🔍 Checklist Sebelum Deploy

- [ ] File `.env.production` sudah ada dan terisi
- [ ] JWT_SECRET sudah digenerate dengan aman (min 32 chars)
- [ ] NEXT_PUBLIC_BASE_URL sudah menggunakan domain production
- [ ] Database credentials sudah benar (production Supabase)
- [ ] Super admin email sudah benar
- [ ] Jalankan `git status` - pastikan `.env.production` TIDAK ada di list
- [ ] Test koneksi database production sebelum deploy

## 📞 Support

Jika ada masalah dengan environment setup:
1. Cek file `.env.production` ada dan terisi
2. Verifikasi format value (tidak ada spasi, quote benar)
3. Test koneksi database manual
4. Cek logs untuk error messages

---

**Remember: Security is everyone's responsibility! 🔒**