import { db } from "@workspace/db";
import { matchesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const API_TOKEN = process.env.API_TOKEN;

// 1️⃣ DICCIONARIO DE TRADUCCIÓN (Para los nombres rebeldes)
const TEAM_ALIASES: Record<string, string> = {
  "Côte d'Ivoire": "Ivory Coast",
  "Türkiye": "Turkey",
  "Curaçao": "Curacao",
  // Unificamos a Bosnia
  "Bosnia & Herzegovina": "Bosnia",
  "Bosnia and Herzegovina": "Bosnia",
  "Bosnia-H.": "Bosnia",
  // Unificamos a Congo
  "DR Congo": "Congo",
  "Congo DR": "Congo",
};
function normalizeTeamName(name: string): string {
  const resolvedName = TEAM_ALIASES[name] || name;
  return resolvedName.toLowerCase().replace(/[^a-z0-9]/g, ""); // Quita espacios y tildes
}

async function main() {
  if (!API_TOKEN) {
    console.error("❌ ERROR: No se encontró la variable de entorno API_TOKEN.");
    process.exit(1);
  }

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/2000/matches?season=2026",
    { headers: { "X-Auth-Token": API_TOKEN } }
  );
  
  const data: any = await res.json();
  
  if (!data.matches) {
     console.error("❌ ERROR: La API no devolvió partidos.", data);
     process.exit(1);
  }
  
  const apiMatches = data.matches;
  const dbMatches = await db.select().from(matchesTable);

  const mapping: { dbId: number; apiId: number; title: string }[] = [];
  const unmatched: any[] = [];

  for (const apiMatch of apiMatches) {
    if (!apiMatch.homeTeam.name || !apiMatch.awayTeam.name) continue;

    const apiDate = new Date(apiMatch.utcDate);

    const found = dbMatches.find((dbMatch) => {
      // 2️⃣ TOLERANCIA DE FECHA (Permitimos diferencia de hasta 24 horas)
      const dbDate = new Date(dbMatch.matchDate);
      const timeDiff = Math.abs(dbDate.getTime() - apiDate.getTime());
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      const isDateCloseEnough = hoursDiff <= 24;

      // 3️⃣ BÚSQUEDA NORMALIZADA DE NOMBRES
      const apiHome = normalizeTeamName(apiMatch.homeTeam.shortName || apiMatch.homeTeam.name);
      const apiAway = normalizeTeamName(apiMatch.awayTeam.shortName || apiMatch.awayTeam.name);
      
      const dbHome = normalizeTeamName(dbMatch.homeTeam);
      const dbAway = normalizeTeamName(dbMatch.awayTeam);

      const homeOk = dbHome.includes(apiHome) || apiHome.includes(dbHome);
      const awayOk = dbAway.includes(apiAway) || apiAway.includes(dbAway);

      // Algunos partidos podrían estar invertidos en la API vs la DB (Local vs Visitante)
      const reverseOk = (dbHome.includes(apiAway) || apiAway.includes(dbHome)) && 
                        (dbAway.includes(apiHome) || apiHome.includes(dbAway));

      return isDateCloseEnough && (homeOk && awayOk || reverseOk);
    });

    if (found) {
      mapping.push({ 
        dbId: found.id, 
        apiId: apiMatch.id, 
        title: `${found.homeTeam} vs ${found.awayTeam}` 
      });
    } else {
      unmatched.push({
        apiId: apiMatch.id,
        home: apiMatch.homeTeam.shortName || apiMatch.homeTeam.name,
        away: apiMatch.awayTeam.shortName || apiMatch.awayTeam.name,
        date: apiMatch.utcDate,
      });
    }
  }

  console.log(`\n✅ Mapeados: ${mapping.length}`);
  console.log(`❌ Sin mapear: ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log("\nSin mapear (Aún rebeldes):");
    unmatched.forEach((m: any) =>
      console.log(`  [${m.apiId}] ${m.home} vs ${m.away} — ${m.date}`)
    );
  }

  console.log("\nGuardando los IDs en la base de datos...");
  
  for (const m of mapping) {
    await db.update(matchesTable)
      .set({ apiId: m.apiId } as any) // Usamos 'as any' temporalmente por si TypeScript se queja
      .where(eq(matchesTable.id, m.dbId));
  }
  
  console.log("¡Todos los partidos han sido enlazados con la API exitosamente!");
  process.exit(0);
}

main().catch(console.error);