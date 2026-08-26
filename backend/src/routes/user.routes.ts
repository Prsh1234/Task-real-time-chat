import { Router } from "express";

import {
  getUsers,
  deleteUser,
  updateCurrentUser,
  getCurrentUser
} from "../controllers/user.controller.js";

import {
  authenticate,
  adminOnly
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  adminOnly,
  getUsers
);
router.get(
  "/me",
  authenticate,
  getCurrentUser
);


router.put(
  "/me",
  authenticate,
  updateCurrentUser
);


router.delete(
  "/:id",
  authenticate,
  adminOnly,
  deleteUser
);

export default router;