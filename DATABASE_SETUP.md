# SIADTL - Setup Database

## 🗄️ Konfigurasaun Database

### 1. Supabase Setup

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Kria proejtu foun ka uza projetu ezistente
3. Hili projetu, depois bainhira buka **Project Settings** > **Database**
5. Kopi **Connection String** (URI format)

### 2. Environment Variables

Edita `.env` file iha root projeto:

```bash
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Optional: Direct connection for migrations
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### 3. Run Database Migration

Depois troka DATABASE_URL:

```bash
# Generate Prisma Client
bun run db:generate

# Push schema to database
bun run db:push
```

### 4. Seed Database (Optional)

Buka URL ida-ida iha browser ka uza curl:

```bash
# Seed with dummy data
curl -X POST http://localhost:3000/api/seed
```

---

## 📁 File Structure

```
prisma/
├── schema.prisma    # Database schema (PostgreSQL compatible)
└── migrations/      # Auto-generated migrations

src/
├── lib/
│   ├── data.ts      # Data layer & database operations
│   └── db.ts        # Prisma client instance
├── hooks/
│   └── use-data.ts  # React hooks for data fetching
└── app/
    └── api/
        ├── reports/route.ts   # Reports CRUD API
        ├── comments/route.ts  # Comments CRUD API
        └── seed/route.ts      # Database seeding API
```

---

## 🔧 Database Schema

### ChurchReport
- id, churchName, region, month, year
- Relasaun: osanTama[], gastu[]

### OsanTama (Receita)
- id, deskrisaun, montante
- Relasaun: ChurchReport

### Gastu (Despesa)
- id, gastuBaSaida, montante
- Relasaun: ChurchReport

### Comment
- id, page, author, content, createdAt

---

## 🚀 Commands

| Command | Deskrisaun |
|---------|------------|
| `bun run db:generate` | Generate Prisma Client |
| `bun run db:push` | Push schema to database |
| `bun run db:migrate` | Create migration |
| `bun run dev` | Start development server |

---

## 📝 Notes

- Database schema diya kompativel ho PostgreSQL (Supabase)
- Prisma ORM uza atu handle database operations
- API routes: `/api/reports`, `/api/comments`, `/api/seed`
- Nanti deit troka `.env` file ba koneksaun database
