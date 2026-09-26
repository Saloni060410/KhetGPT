import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const farmer = await prisma.user.upsert({
    where: { email: "farmer@khetgpt.demo" },
    update: {},
    create: {
      email: "farmer@khetgpt.demo",
      passwordHash: await bcrypt.hash("Farmer@123", 10),
      name: "Demo Farmer",
      role: Role.FARMER,
    },
  });

  await prisma.user.upsert({
    where: { email: "agronomist@khetgpt.demo" },
    update: {},
    create: {
      email: "agronomist@khetgpt.demo",
      passwordHash: await bcrypt.hash("Agronomist@123", 10),
      name: "Demo Agronomist",
      role: Role.AGRONOMIST,
    },
  });

  const farm = await prisma.farm.upsert({
    where: { id: "seed-farm-1" },
    update: {},
    create: { id: "seed-farm-1", name: "Demo Farm", ownerId: farmer.id },
  });

  const field = await prisma.field.upsert({
    where: { id: "seed-field-1" },
    update: {},
    create: {
      id: "seed-field-1",
      name: "Wheat Field 1",
      farmId: farm.id,
      areaAcres: 2.5,
      latitude: 19.9975,
      longitude: 73.7898,
      pincode: "422001",
      cropType: "wheat",
      growthStage: "sowing",
      sowingDate: new Date("2026-11-05"),
    },
  });

  await prisma.soilTest.upsert({
    where: { id: "seed-soiltest-1" },
    update: {},
    create: {
      id: "seed-soiltest-1",
      fieldId: field.id,
      n: 210, p: 9, k: 90, ph: 7.4,
      organicCarbon: 0.42, moisture: 18,
    },
  });

  await prisma.fertilizerLog.createMany({
    data: [
      { id: "seed-fertlog-1", fieldId: field.id, type: "dap", quantityKgPerAcre: 80, appliedOn: new Date("2026-03-10") },
      { id: "seed-fertlog-2", fieldId: field.id, type: "urea", quantityKgPerAcre: 200, appliedOn: new Date("2026-03-25") },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete:", {
    users: await prisma.user.findMany({ select: { id: true, email: true, role: true } }),
    farms: await prisma.farm.findMany(),
    fields: await prisma.field.findMany(),
    soilTests: await prisma.soilTest.findMany(),
    fertilizerLogs: await prisma.fertilizerLog.findMany(),
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });