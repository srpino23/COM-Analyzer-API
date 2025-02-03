import { Router } from "express";
const router = Router();

import * as CameraCtrl from "../controllers/camera.controller";

router.post("/addCamera", CameraCtrl.addCamera);

router.get("/getCameras", CameraCtrl.getCameras);

router.get("/getCamera/:id", CameraCtrl.getCamera);

router.put("/updateCamera/:id", CameraCtrl.updateCamera);

router.delete("/deleteCamera/:id", CameraCtrl.deleteCamera);

router.put("/updateStatus/:id", CameraCtrl.updateStatus);

export default router;
