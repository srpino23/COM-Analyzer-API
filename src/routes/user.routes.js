import { Router } from "express";
const router = Router();

import * as UserCtrl from "../controllers/user.controller";

router.post("/addUser", UserCtrl.addUser);

router.post("/getUser", UserCtrl.getUser);

export default router;
