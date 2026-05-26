import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable, predictionsTable, groupMembersTable } from "@workspace/db";
import { GetMeResponse, UpdateMeBody, UpdateMeResponse } from "@workspace/api-zod";

const router: IRouter = Router();

export const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.clerkUserId = userId;
  next();
};

export const ensureUser = async (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.clerkUserId = clerkId;

  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!user) {
    const sessionClaims = auth?.sessionClaims as any;
    const email = sessionClaims?.email || `${clerkId}@placeholder.com`;
    const firstName = sessionClaims?.firstName || "";
    const lastName = sessionClaims?.lastName || "";
    const rawUsername = sessionClaims?.username || `${firstName}${lastName}` || `user_${clerkId.slice(-8)}`;
    const username = rawUsername.replace(/\s+/g, "_").toLowerCase() || `user_${clerkId.slice(-8)}`;

    [user] = await db.insert(usersTable).values({
      clerkId,
      username: `${username}_${Math.random().toString(36).slice(-4)}`,
      email,
      avatarUrl: sessionClaims?.imageUrl || null,
    }).returning();
  }
  req.dbUser = user;
  next();
};

function serializeUser(user: Record<string, unknown>) {
  return {
    ...user,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
  };
}

router.get("/users/me", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  res.json(GetMeResponse.parse(serializeUser(req.dbUser)));
});

router.patch("/users/me", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.username !== undefined) updateData.username = parsed.data.username;
  if (parsed.data.avatarUrl !== undefined) updateData.avatarUrl = parsed.data.avatarUrl;
  if (parsed.data.theme !== undefined) updateData.theme = parsed.data.theme;
  if (parsed.data.language !== undefined) updateData.language = parsed.data.language;
  if (parsed.data.notifMatchReminders !== undefined) updateData.notifMatchReminders = parsed.data.notifMatchReminders;
  if (parsed.data.notifGroupActivity !== undefined) updateData.notifGroupActivity = parsed.data.notifGroupActivity;
  if (parsed.data.notifLeaderboard !== undefined) updateData.notifLeaderboard = parsed.data.notifLeaderboard;
  if (parsed.data.notifAnnouncements !== undefined) updateData.notifAnnouncements = parsed.data.notifAnnouncements;

  const [updated] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, req.dbUser.id))
    .returning();

  res.json(UpdateMeResponse.parse(serializeUser(updated)));
});

router.get("/users/me/stats", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const userId = req.dbUser.id as number;

  const predictions = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.userId, userId));

  const groupMemberships = await db
    .select()
    .from(groupMembersTable)
    .where(eq(groupMembersTable.userId, userId));

  const predictionsCount = predictions.length;
  const correctWinners = predictions.filter(p => p.points !== null && p.points >= 5).length;
  const exactScores = predictions.filter(p => p.points !== null && p.points === 7).length;
  const totalPoints = predictions.reduce((acc, p) => acc + (p.points ?? 0), 0);
  const groupsCount = groupMemberships.length;
  const avgPointsPerPrediction =
    predictionsCount > 0 ? Math.round((totalPoints / predictionsCount) * 10) / 10 : 0;

  res.json({ predictionsCount, correctWinners, exactScores, totalPoints, groupsCount, avgPointsPerPrediction });
});

router.delete("/users/me", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const userId = req.dbUser.id as number;
  const clerkId = req.dbUser.clerkId as string;

  try {
    await db.delete(predictionsTable).where(eq(predictionsTable.userId, userId));
    await db.delete(groupMembersTable).where(eq(groupMembersTable.userId, userId));
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    await clerkClient.users.deleteUser(clerkId);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
