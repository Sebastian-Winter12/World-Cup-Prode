import { Router, type IRouter } from "express";
import { eq, gte, lte, and } from "drizzle-orm";
import { db, matchesTable, predictionsTable, groupsTable, groupMembersTable, usersTable } from "@workspace/db";
import { requireAuth, ensureUser } from "./users";

const router: IRouter = Router();

router.get("/dashboard", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const userId = req.dbUser.id;

  // My predictions summary
  const myPredictions = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.userId, userId));

  const totalPoints = myPredictions.reduce((s, p) => s + (p.points ?? 0), 0);
  const correctWinners = myPredictions.filter((p) => p.points !== null && p.points >= 5).length;
  const exactScores = myPredictions.filter((p) => p.points !== null && p.points === 7).length;
  const predictedCount = myPredictions.length;

  // Total matches
  const allMatches = await db.select().from(matchesTable);
  const totalMatches = allMatches.length;

  // My groups with ranking
  const myMemberships = await db
    .select()
    .from(groupMembersTable)
    .where(eq(groupMembersTable.userId, userId));

  const groupRankings = await Promise.all(
    myMemberships.map(async (membership) => {
      const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, membership.groupId));
      if (!group) return null;

      const allGroupMembers = await db
        .select()
        .from(groupMembersTable)
        .where(eq(groupMembersTable.groupId, group.id));

      const memberPoints = await Promise.all(
        allGroupMembers.map(async (m) => {
          const preds = await db.select({ points: predictionsTable.points }).from(predictionsTable).where(eq(predictionsTable.userId, m.userId));
          return { userId: m.userId, pts: preds.reduce((s, p) => s + (p.points ?? 0), 0) };
        })
      );

      const sorted = memberPoints.sort((a, b) => b.pts - a.pts);
      const myRank = sorted.findIndex((m) => m.userId === userId) + 1;

      return {
        groupId: group.id,
        groupName: group.name,
        rank: myRank || 1,
        totalPoints,
        memberCount: allGroupMembers.length,
      };
    })
  );

  // Upcoming matches (next 7 days)
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingRaw = await db
    .select()
    .from(matchesTable)
    .where(and(
      eq(matchesTable.status, "scheduled"),
      gte(matchesTable.matchDate, now),
      lte(matchesTable.matchDate, sevenDays)
    ));

  const addPrediction = async (match: any) => {
    const [pred] = await db.select().from(predictionsTable).where(
      and(eq(predictionsTable.matchId, match.id), eq(predictionsTable.userId, userId))
    );
    return {
      ...match,
      matchDate: match.matchDate instanceof Date ? match.matchDate.toISOString() : match.matchDate,
      myPrediction: pred ? { homeGoals: pred.homeGoals, awayGoals: pred.awayGoals, points: pred.points } : null,
    };
  };

  const upcomingMatches = await Promise.all(upcomingRaw.slice(0, 5).map(addPrediction));

  // Recent finished matches
  const recentRaw = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.status, "finished"));

  const recentResults = await Promise.all(recentRaw.slice(-5).reverse().map(addPrediction));

  res.json({
    totalPoints,
    predictionsCount: predictedCount,
    correctWinners,
    exactScores,
    predictedCount,
    totalMatches,
    groupRankings: groupRankings.filter(Boolean),
    upcomingMatches,
    recentResults,
  });
});

export default router;
