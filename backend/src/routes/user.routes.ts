import { Router } from "express";

import {
  getUsers,
  deleteUser,
  updateCurrentUser,
  getCurrentUser,
  getUser
} from "../controllers/user.controller.js";

import {
  authenticate,
  adminOnly
} from "../middleware/auth.middleware.js";

const router = Router();


router.get(
  "/me",
  authenticate,
  getCurrentUser
);

router.get(
  "/",
  authenticate,
  getUsers
);

router.get(
  "/:id",
  authenticate,
  getUser
);



router.put(
  "/me",
  authenticate,
  updateCurrentUser
);



export default router;