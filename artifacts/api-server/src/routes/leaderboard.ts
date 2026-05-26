import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, groupsTable, groupMembersTable, usersTable, predictionsTable } from "@workspace/db";
import { GetGroupLeaderboardParams } from "@workspace/api-zod";
import { requireAuth, ensureUser } from "./users";

const router: IRouter = Router();

router.get("/groups/:groupId/leaderboard", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const raw = Array.isArray(req.params.groupId) ? req.params.groupId[0] : req.params.groupId;
  const params = GetGroupLeaderboardParams.safeParse({ groupId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, params.data.groupId));
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const memberRows = await db
    .select({ gm: groupMembersTable, u: usersTable })
    .from(groupMembersTable)
    .innerJoin(usersTable, eq(usersTable.id, groupMembersTable.userId))
    .where(eq(groupMembersTable.groupId, params.data.groupId));

  const entries = await Promise.all(
    memberRows.map(async ({ u }) => {
      const predictions = await db
        .select()
        .from(predictionsTable)
        .where(eq(predictionsTable.userId, u.id));

      const totalPoints = predictions.reduce((s, p) => s + (p.points ?? 0), 0);
      const correctWinners = predictions.filter((p) => p.points !== null && p.points >= 5).length;
      const exactScores = predictions.filter((p) => p.points !== null && p.points === 7).length;

      return {
        userId: u.id,
        username: u.username,
        avatarUrl: u.avatarUrl,
        totalPoints,
        correctWinners,
        exactScores,
      };
    })
  );

  const sorted = entries.sort((a, b) => b.totalPoints - a.totalPoints);
  const ranked = sorted.map((e, i) => ({ ...e, rank: i + 1 }));

  res.json(ranked);
});

export default router;
