import { Router } from "express";

import {
  getUsers,
  deleteUser
} from "../controllers/user.controller.js";

import {
  authenticate,
  adminOnly
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/users",
  authenticate,
  adminOnly,
  getUsers
);

router.delete(
  "/:id",
  authenticate,
  adminOnly,
  deleteUser
);

export default router;