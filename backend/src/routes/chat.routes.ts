import { Router } from "express";

import {
  getMessages,
  getChatStats
} from "../controllers/chat.controller.js";

import {
  authenticate
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/messages",
  authenticate,
  getMessages
);

router.get(
  "/stats",
  authenticate,
  getChatStats
);

export default router;