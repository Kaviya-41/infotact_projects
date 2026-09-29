import { Router } from "express";
import authController from "../controllers/authController.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authController.getProfile);
router.put("/me", authController.updateProfile);
router.put("/password", authController.changePassword);

export default router;
