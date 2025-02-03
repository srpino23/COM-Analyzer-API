import { Router } from "express";
const router = Router();

import * as ServerCtrl from "../controllers/server.controller";

router.post("/addServer", ServerCtrl.addServer);

router.get("/getServers", ServerCtrl.getServers);

router.get("/getServer/:id", ServerCtrl.getServer);

router.get("/getServerCameras/:id", ServerCtrl.getServerCameras);

router.put("/updateServer/:id", ServerCtrl.updateServer);

router.delete("/deleteServer/:id", ServerCtrl.deleteServer);

router.put("/updateStatus/:id", ServerCtrl.updateStatus);

export default router;
