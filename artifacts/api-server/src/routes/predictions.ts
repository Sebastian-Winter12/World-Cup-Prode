import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, predictionsTable, matchesTable } from "@workspace/db";
import { UpsertPredictionBody, UpsertPredictionParams } from "@workspace/api-zod";
import { requireAuth, ensureUser } from "./users";

const router: IRouter = Router();

const LOCK_MINUTES_BEFORE_MATCH = 5;


router.get("/predictions", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const predictions = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.userId, req.dbUser.id));

  res.json(predictions.map((p) => ({
    ...p,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
  })));
});

router.put("/predictions/:matchId", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const raw = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const params = UpsertPredictionParams.safeParse({ matchId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpsertPredictionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.matchId));
if (!match) {
  res.status(404).json({ error: "Match not found" });
  return;
}

// Check if predictions are locked for this match
const matchTime = new Date(match.matchDate);
const lockTime = new Date(matchTime.getTime() - LOCK_MINUTES_BEFORE_MATCH * 60 * 1000);
if (new Date() >= lockTime) {
  res.status(400).json({ error: "Predictions are locked 30 minutes before the match starts" });
  return;
}

// Check if match already started
if (match.status !== "scheduled") {
  res.status(400).json({ error: "Cannot predict on a match that has already started" });
  return;
}

  const [existing] = await db
    .select()
    .from(predictionsTable)
    .where(and(
      eq(predictionsTable.matchId, params.data.matchId),
      eq(predictionsTable.userId, req.dbUser.id)
    ));

  let prediction;
  if (existing) {
    [prediction] = await db
      .update(predictionsTable)
      .set({ homeGoals: body.data.homeGoals, awayGoals: body.data.awayGoals })
      .where(eq(predictionsTable.id, existing.id))
      .returning();
  } else {
    [prediction] = await db
      .insert(predictionsTable)
      .values({
        matchId: params.data.matchId,
        userId: req.dbUser.id,
        homeGoals: body.data.homeGoals,
        awayGoals: body.data.awayGoals,
      })
      .returning();
  }

  res.json({
    ...prediction,
    createdAt: prediction.createdAt instanceof Date ? prediction.createdAt.toISOString() : prediction.createdAt,
    updatedAt: prediction.updatedAt instanceof Date ? prediction.updatedAt.toISOString() : prediction.updatedAt,
  });
});

export default router;
