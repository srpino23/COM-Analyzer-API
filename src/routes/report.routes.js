import { Router } from "express";
const router = Router();

import * as ReportCtrl from "../controllers/report.controller";

import multer from "../libs/multer";

router.get("/getReports", ReportCtrl.getReports);

router.post("/uploadCsv", multer.single('file'), ReportCtrl.uploadCsv);

router.get("/downloadDailyReport/:id", ReportCtrl.downloadDailyReport);

router.get("/generateFullReport", ReportCtrl.generateFullReport);

export default router;