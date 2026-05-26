import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, matchesTable, predictionsTable } from "@workspace/db";
import {
  GetMatchParams,
  UpdateMatchScoreParams,
  UpdateMatchScoreBody,
  ListMatchesQueryParams,
} from "@workspace/api-zod";
import { requireAuth, ensureUser } from "./users";
import { calculatePoints } from "../lib/scoring";

const router: IRouter = Router();

const matchWithPrediction = async (match: any, userId?: number) => {
  let myPrediction = null;
  if (userId) {
    const [pred] = await db
      .select()
      .from(predictionsTable)
      .where(and(eq(predictionsTable.matchId, match.id), eq(predictionsTable.userId, userId)));
    if (pred) {
      myPrediction = {
        homeGoals: pred.homeGoals,
        awayGoals: pred.awayGoals,
        points: pred.points,
      };
    }
  }
  return {
    ...match,
    matchDate: match.matchDate instanceof Date ? match.matchDate.toISOString() : match.matchDate,
    myPrediction,
  };
};

router.get("/matches/live", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const matches = await db.select().from(matchesTable).where(eq(matchesTable.status, "live"));
  const result = await Promise.all(matches.map((m) => matchWithPrediction(m, req.dbUser.id)));
  res.json(result);
});

router.get("/matches/upcoming", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const matches = await db
    .select()
    .from(matchesTable)
    .where(and(
      eq(matchesTable.status, "scheduled"),
      gte(matchesTable.matchDate, now),
      lte(matchesTable.matchDate, sevenDays)
    ));
  const result = await Promise.all(matches.map((m) => matchWithPrediction(m, req.dbUser.id)));
  res.json(result);
});

router.get("/matches", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const params = ListMatchesQueryParams.safeParse(req.query);

  let query = db.select().from(matchesTable).$dynamic();
  const conditions: any[] = [];

  if (params.success && params.data.stage) {
    conditions.push(eq(matchesTable.stage, params.data.stage));
  }
  if (params.success && params.data.status) {
    conditions.push(eq(matchesTable.status, params.data.status));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const matches = await query.orderBy(matchesTable.matchDate);
  const result = await Promise.all(matches.map((m) => matchWithPrediction(m, req.dbUser.id)));
  res.json(result);
});

router.get("/matches/:matchId", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const raw = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const params = GetMatchParams.safeParse({ matchId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  res.json(await matchWithPrediction(match, req.dbUser.id));
});

router.patch("/matches/:matchId/score", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const raw = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const params = UpdateMatchScoreParams.safeParse({ matchId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateMatchScoreBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [match] = await db
    .update(matchesTable)
    .set({
      homeScore: body.data.homeScore,
      awayScore: body.data.awayScore,
      status: body.data.status,
    })
    .where(eq(matchesTable.id, params.data.matchId))
    .returning();

  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  // Recalculate points for all predictions on this match if finished
  if (body.data.status === "finished") {
    const predictions = await db.select().from(predictionsTable).where(eq(predictionsTable.matchId, match.id));
    await Promise.all(
      predictions.map(async (pred) => {
        const points = calculatePoints(pred, match);
        await db.update(predictionsTable).set({ points }).where(eq(predictionsTable.id, pred.id));
      })
    );
  }

  res.json({ ...match, matchDate: match.matchDate instanceof Date ? match.matchDate.toISOString() : match.matchDate });
});

export default router;
