import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

// Timor-Leste administrative structure grouped into 3 regions.
const REGIONS = [
  {
    name: "Regiaun 1",
    code: "R1",
    description: "Rejiaun Leste (Lautém, Viqueque, Baucau, Manatuto)",
    municipalities: [
      { name: "Lautém", sukus: ["Lospalos", "Tutuala", "Luro", "Iliomar"] },
      { name: "Viqueque", sukus: ["Viqueque", "Uatucarbau", "Baguia", "Ossu"] },
      { name: "Baucau", sukus: ["Baucau", "Vemasse", "Baguia", "Quelicai"] },
      { name: "Manatuto", sukus: ["Manatuto", "Laleia", "Barique", "Soibada"] },
    ],
  },
  {
    name: "Regiaun 2",
    code: "R2",
    description: "Rejiaun Sentral (Dili, Aileu, Ermera, Liquiçá)",
    municipalities: [
      { name: "Dili", sukus: ["Dili Centro", "Cristo Rei", "Dom Aleixo", "Metinaro"] },
      { name: "Aileu", sukus: ["Aileu", "Laulara", "Liquidoe", "Remexio"] },
      { name: "Ermera", sukus: ["Ermera", "Atsabe", "Hatulia", "Letefoho"] },
      { name: "Liquiçá", sukus: ["Liquiçá", "Bazartete", "Maubara", "Loes"] },
    ],
  },
  {
    name: "Regiaun 3",
    code: "R3",
    description: "Rejiaun Suroeste (Ainaro, Covalima, Manufahi, Bobonaro)",
    municipalities: [
      { name: "Ainaro", sukus: ["Ainaro", "Hato-Udo", "Hatobuilico", "Maubisse"] },
      { name: "Covalima", sukus: ["Suai", "Fatumean", "Fatululic", "Tilomar"] },
      { name: "Manufahi", sukus: ["Same", "Betano", "Fatuberliu", "Turiscai"] },
      { name: "Bobonaro", sukus: ["Maliana", "Balibo", "Atabae", "Bobonaro"] },
    ],
  },
];

function randomToken() {
  return randomBytes(24).toString("hex");
}

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create regions, municipalities, sukus
  for (const region of REGIONS) {
    const createdRegion = await prisma.region.create({
      data: {
        name: region.name,
        code: region.code,
        description: region.description,
      },
    });

    for (const muni of region.municipalities) {
      const createdMuni = await prisma.municipality.create({
        data: { name: muni.name, regionId: createdRegion.id },
      });
      for (const sukuName of muni.sukus) {
        await prisma.suku.create({
          data: {
            name: sukuName,
            municipalityId: createdMuni.id,
            regionId: createdRegion.id,
          },
        });
      }
    }
    console.log(`  ✓ ${region.name} — ${region.municipalities.length} munisipalidade`);
  }

  // 2. Create Super Admin (Google SSO account)
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "jabesnelma056@gmail.com";
  const superAdmin = await prisma.profile.create({
    data: {
      email: superAdminEmail,
      name: "Super Administrador",
      role: "SUPER_ADMIN",
      active: true,
    },
  });
  console.log(`  ✓ Super Admin: ${superAdmin.email}`);

  // 3. Create one Admin Regional per region + QR token
  for (const region of REGIONS) {
    const regionRow = await prisma.region.findFirst({ where: { code: region.code } });
    if (!regionRow) continue;
    const admin = await prisma.profile.create({
      data: {
        name: `Admin Regional ${region.name}`,
        role: "ADMIN_REGIONAL",
        regionId: regionRow.id,
        active: true,
      },
    });
    await prisma.qrToken.create({
      data: {
        token: randomToken(),
        profileId: admin.id,
        label: `QR ${region.name}`,
        active: true,
      },
    });
    console.log(`  ✓ Admin Regional: ${admin.name}`);
  }

  // 4. Create Admin Lokal — 3 per region (9 total) — with QR tokens + sample reports.
  // Distribute across all regions so every regional dashboard has data.
  const regions = await prisma.region.findMany({ orderBy: { id: "asc" } });
  const adminNames = [
    "João Amaral", "Maria Soares", "Paulo da Costa", // Regiaun 1
    "Ana Pereira", "Carlos Ximenes", "Beatriz Guterres", // Regiaun 2
    "António Babo", "Filomena Belo", "Domingos Maia", // Regiaun 3
  ];
  const sampleSukus: { id: number; name: string; regionId: number; municipalityId: number }[] = [];
  for (const region of regions) {
    const sukusInRegion = await prisma.suku.findMany({
      where: { regionId: region.id },
      take: 3,
    });
    sampleSukus.push(...sukusInRegion);
  }

  for (let i = 0; i < sampleSukus.length; i++) {
    const suku = sampleSukus[i];
    const admin = await prisma.profile.create({
      data: {
        name: adminNames[i] ?? `Admin Lokal ${i + 1}`,
        role: "ADMIN_LOKAL",
        regionId: suku.regionId,
        sukuId: suku.id,
        active: true,
      },
    });
    await prisma.qrToken.create({
      data: {
        token: randomToken(),
        profileId: admin.id,
        label: `QR ${suku.name}`,
        active: true,
      },
    });

    // Create sample financial reports for the last 30 days
    const now = new Date();
    for (let d = 0; d < 30; d++) {
      const date = new Date(now);
      date.setDate(now.getDate() - d);
      // skip some days randomly to look realistic
      if (d % 7 === 5 || d % 7 === 6) continue;
      const persembahan = Math.round(20 + Math.random() * 180);
      const perpuluhan = Math.round(30 + Math.random() * 220);
      const kontribusi = Math.round(0 + Math.random() * 150);
      await prisma.financialReport.create({
        data: {
          date,
          persembahan,
          perpuluhan,
          kontribusi,
          catatan: d % 5 === 0 ? "Misa Domingo" : null,
          sukuId: suku.id,
          createdById: admin.id,
        },
      });
    }
    console.log(`  ✓ Admin Lokal: ${admin.name} (${suku.name})`);
  }

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
