import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import loansRouter from "./loans";
import analysisRouter from "./analysis";
import settlementRouter from "./settlement";
import letterRouter from "./letter";
import historyRouter from "./history";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(loansRouter);
router.use(analysisRouter);
router.use(settlementRouter);
router.use(letterRouter);
router.use(historyRouter);
router.use(dashboardRouter);

export default router;
