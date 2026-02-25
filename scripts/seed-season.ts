import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Seasons are user-specific in FORC3, so this script
  // just logs a message. Seasons are created per-user via /api/seasons
  console.log("✓ Season system ready — seasons are created per-user via the app");
  console.log("  Users can start a season from the Seasons page (/seasons)");

  // Count existing seasons
  const count = await prisma.season.count();
  console.log(`  Current seasons in DB: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
