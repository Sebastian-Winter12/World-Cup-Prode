import { db } from "@workspace/db";
import { matchesTable, predictionsTable } from "@workspace/db/schema"; // Asegúrate de importar predictionsTable
import { eq, count } from "drizzle-orm"; // Asegúrate de importar count
const API_TOKEN = process.env.API_TOKEN;

// Mapeo de estados de la API externa a los estados de tu Base de Datos
const STATUS_MAP: Record<string, "scheduled" | "live" | "finished"> = {
  "SCHEDULED": "scheduled",
  "TIMED": "scheduled",
  "LIVE": "live",
  "IN_PLAY": "live",
  "PAUSED": "live",
  "FINISHED": "finished",
  "POSTPONED": "scheduled",
  "SUSPENDED": "live",
  "CANCELLED": "finished",
};

async function main() {
  if (!API_TOKEN) {
    console.error("❌ ERROR: No se encontró la variable de entorno API_TOKEN.");
    process.exit(1);
  }

  console.log("🔄 Consultando actualizaciones de partidos en la API...");
  try {
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/2000/matches?season=2026",
      { headers: { "X-Auth-Token": API_TOKEN } }
    );
    
    const data: any = await res.json();
    
    if (!data.matches) {
      console.error("❌ ERROR: La API no devolvió partidos válidos.", data);
      process.exit(1);
    }

    const apiMatches = data.matches;
    
    // Traemos los partidos actuales de tu base de datos
    const dbMatches = await db.select().from(matchesTable);
    let updatedCount = 0;

    for (const apiMatch of apiMatches) {
      // Buscamos si el partido de la API corresponde a uno mapeado en tu DB
      const currentDbMatch = dbMatches.find((m) => m.apiId === apiMatch.id);

      if (!currentDbMatch) continue;

      // Normalizamos el estado y los goles de la API
      const newStatus = STATUS_MAP[apiMatch.status] || "scheduled";
      const newHomeScore = apiMatch.score?.fullTime?.home ?? null;
      const newAwayScore = apiMatch.score?.fullTime?.away ?? null;

      // Evaluamos si realmente cambió algo para evitar llamadas innecesarias a la DB
      const hasChanged =
        currentDbMatch.status !== newStatus ||
        currentDbMatch.homeScore !== newHomeScore ||
        currentDbMatch.awayScore !== newAwayScore;

      if (hasChanged) {
        console.log(`🔹 Cambio detectado: ${currentDbMatch.homeTeam} vs ${currentDbMatch.awayTeam}`);
        console.log(`   [Estado] DB: ${currentDbMatch.status} ➔ API: ${newStatus}`);
        console.log(`   [Goles]  DB: ${currentDbMatch.homeScore}-${currentDbMatch.awayScore} ➔ API: ${newHomeScore}-${newAwayScore}`);

        await db.update(matchesTable)
          .set({
            status: newStatus,
            homeScore: newHomeScore,
            awayScore: newAwayScore,
            updatedAt: new Date(),
          })
          .where(eq(matchesTable.id, currentDbMatch.id));

        updatedCount++;
      }
    }

    console.log(`\n✅ Sincronización finalizada. Se actualizaron ${updatedCount} partidos.`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Error crítico durante la actualización:", error);
    process.exit(1);
  }
}

main();