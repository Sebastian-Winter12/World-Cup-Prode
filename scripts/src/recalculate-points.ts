import { db } from "@workspace/db";
import { matchesTable, predictionsTable } from "@workspace/db/schema";
import { eq, isNotNull } from "drizzle-orm";

function calculatePoints(
  prediction: { homeGoals: number; awayGoals: number },
  match: { homeScore: number | null; awayScore: number | null; status: string }
): number | null {
  if (match.status !== "finished" || match.homeScore === null || match.awayScore === null) {
    return null;
  }
  const predWinner = Math.sign(prediction.homeGoals - prediction.awayGoals);
  const actualWinner = Math.sign(match.homeScore - match.awayScore);
  let points = 0;
  if (predWinner === actualWinner) points += 1;
if (prediction.homeGoals === match.homeScore && prediction.awayGoals === match.awayScore) points += 3;
  return points;
}

async function main() {
  const finishedMatches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.status, "finished"));

  console.log(`🔄 Recalculando puntos para ${finishedMatches.length} partidos finalizados...`);

  let updated = 0;

  for (const match of finishedMatches) {
    const predictions = await db
      .select()
      .from(predictionsTable)
      .where(eq(predictionsTable.matchId, match.id));

    for (const pred of predictions) {
      const points = calculatePoints(pred, match);
      await db
        .update(predictionsTable)
        .set({ points })
        .where(eq(predictionsTable.id, pred.id));
      updated++;
    }
  }

  console.log(`✅ Listo. Se actualizaron ${updated} predicciones.`);
  process.exit(0);
}

main().catch(console.error);