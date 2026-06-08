// scripts/src/fix.ts
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Relajando las reglas de la base de datos...");
  // Esta línea le quita la obligación (NOT NULL) a la columna api_id
  await db.execute(sql`ALTER TABLE matches ALTER COLUMN api_id DROP NOT NULL;`);
  console.log("¡Arreglado! La columna api_id ahora permite estar vacía.");
  process.exit(0);
}

main().catch(console.error);