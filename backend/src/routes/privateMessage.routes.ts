import { Router } from "express";

import {
  getPrivateMessages,
} from "../controllers/privateChat.contoller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

const router = Router();

router.get<{ userId: string }>(
  "/:userId",
  authenticate,
  getPrivateMessages
);

export default router;