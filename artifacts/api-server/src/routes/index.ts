import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import groupsRouter from "./groups";
import matchesRouter from "./matches";
import predictionsRouter from "./predictions";
import leaderboardRouter from "./leaderboard";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(groupsRouter);
router.use(matchesRouter);
router.use(predictionsRouter);
router.use(leaderboardRouter);
router.use(dashboardRouter);

export default router;
