import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, groupsTable, groupMembersTable, usersTable, predictionsTable } from "@workspace/db";
import {
  CreateGroupBody,
  JoinGroupBody,
  GetGroupParams,
  LeaveGroupParams,
} from "@workspace/api-zod";
import { requireAuth, ensureUser } from "./users";
import { nanoid } from "nanoid";

const router: IRouter = Router();

router.get("/groups", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const userId = req.dbUser.id;

  const memberships = await db
    .select()
    .from(groupMembersTable)
    .where(eq(groupMembersTable.userId, userId));

  const groupIds = memberships.map((m) => m.groupId);
  if (groupIds.length === 0) {
    res.json([]);
    return;
  }

  const groups = await db.select().from(groupsTable).where(
    sql`${groupsTable.id} = ANY(${sql.raw(`ARRAY[${groupIds.join(",")}]::int[]`)})`
  );

  // Get member counts and user points per group
  const result = await Promise.all(
    groups.map(async (g) => {
      const memberCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(groupMembersTable)
        .where(eq(groupMembersTable.groupId, g.id));

      // Calculate my points in this group
      const myPredictions = await db
        .select({ points: predictionsTable.points })
        .from(predictionsTable)
        .where(eq(predictionsTable.userId, userId));

      const myPoints = myPredictions.reduce((sum, p) => sum + (p.points ?? 0), 0);

      // Calculate my rank
      const allMemberIds = (
        await db.select({ userId: groupMembersTable.userId }).from(groupMembersTable).where(eq(groupMembersTable.groupId, g.id))
      ).map((m) => m.userId);

      const memberPoints = await Promise.all(
        allMemberIds.map(async (mid) => {
          const preds = await db.select({ points: predictionsTable.points }).from(predictionsTable).where(eq(predictionsTable.userId, mid));
          return { userId: mid, points: preds.reduce((s, p) => s + (p.points ?? 0), 0) };
        })
      );

      const sorted = memberPoints.sort((a, b) => b.points - a.points);
      const myRank = sorted.findIndex((m) => m.userId === userId) + 1;

      return {
        ...g,
        memberCount: Number(memberCount[0]?.count ?? 0),
        myPoints,
        myRank: myRank || 1,
      };
    })
  );

  res.json(result);
});

router.post("/groups", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const parsed = CreateGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const inviteCode = nanoid(8).toUpperCase();

  const [group] = await db.insert(groupsTable).values({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    inviteCode,
    creatorId: req.dbUser.id,
  }).returning();

  // Auto-join as member
  await db.insert(groupMembersTable).values({
    groupId: group.id,
    userId: req.dbUser.id,
  });

  res.status(201).json(group);
});

router.post("/groups/join", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const parsed = JoinGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.inviteCode, parsed.data.inviteCode));
  if (!group) {
    res.status(404).json({ error: "Group not found with that invite code" });
    return;
  }

  // Check if already a member
  const [existing] = await db.select().from(groupMembersTable).where(
    and(eq(groupMembersTable.groupId, group.id), eq(groupMembersTable.userId, req.dbUser.id))
  );

  if (!existing) {
    await db.insert(groupMembersTable).values({
      groupId: group.id,
      userId: req.dbUser.id,
    });
  }

  res.json(group);
});

router.get("/groups/:groupId", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const raw = Array.isArray(req.params.groupId) ? req.params.groupId[0] : req.params.groupId;
  const params = GetGroupParams.safeParse({ groupId: parseInt(raw, 10) });
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
    .where(eq(groupMembersTable.groupId, group.id));

  const members = await Promise.all(
    memberRows.map(async ({ gm, u }) => {
      const preds = await db.select({ points: predictionsTable.points }).from(predictionsTable).where(eq(predictionsTable.userId, u.id));
      const points = preds.reduce((s, p) => s + (p.points ?? 0), 0);
      const correctWinners = preds.filter(p => p.points !== null && p.points >= 5).length;
      const exactScores = preds.filter(p => p.points !== null && p.points === 7).length;
      return {
        userId: u.id,
        username: u.username,
        avatarUrl: u.avatarUrl,
        points,
        correctWinners,
        exactScores,
        previousRank: null,
        joinedAt: gm.joinedAt.toISOString(),
      };
    })
  );

  res.json({ ...group, members });
});

router.post("/groups/:groupId/leave", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const raw = Array.isArray(req.params.groupId) ? req.params.groupId[0] : req.params.groupId;
  const params = LeaveGroupParams.safeParse({ groupId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(groupMembersTable).where(
    and(
      eq(groupMembersTable.groupId, params.data.groupId),
      eq(groupMembersTable.userId, req.dbUser.id)
    )
  );

  res.json({ success: true });
});

export default router;
