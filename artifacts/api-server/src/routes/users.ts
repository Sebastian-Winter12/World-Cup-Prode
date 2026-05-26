import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
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

// JIT-provision: ensure user exists in our DB whenever authenticated
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
    // Create user with data from clerk session
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

router.get("/users/me", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  res.json(GetMeResponse.parse(req.dbUser));
});

router.patch("/users/me", requireAuth, ensureUser, async (req: any, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: any = {};
  if (parsed.data.username) updateData.username = parsed.data.username;
  if (parsed.data.avatarUrl) updateData.avatarUrl = parsed.data.avatarUrl;

  const [updated] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, req.dbUser.id))
    .returning();

  res.json(UpdateMeResponse.parse(updated));
});

export default router;
