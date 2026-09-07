import { Request, Response } from "express";

import PrivateMessage from "../models/PrivateMessage";

import {
  getCachedPrivateMessages,
  cachePrivateMessages,
} from "../services/privateMessageCache";

interface AuthenticatedRequest
  extends Request {
  user: {
    id: string;
    name?: string;
    role?: string;
  };
}

/**
 * GET
 *
 * /api/private/messages/:userId
 *
 * Query:
 *
 * ?limit=20
 *
 * or:
 *
 * ?limit=20&before=2026-09-07T10:30:00.000Z
 */
export async function getPrivateMessages(
  req: Request,
  res: Response
) {
  try {
    const authenticatedRequest =
      req as AuthenticatedRequest;

    const currentUserId =
      authenticatedRequest.user.id;

    const otherUserId =
      req.params.userId;

    const limit = Math.min(
      Number(req.query.limit) || 20,
      50
    );

    const before =
      typeof req.query.before === "string"
        ? req.query.before
        : undefined;

    /*
     * ========================================
     * 1. CHECK REDIS
     * ========================================
     */

    const cachedMessages =
      await getCachedPrivateMessages(
        currentUserId,
        otherUserId,
        before
          ? new Date(before)
          : undefined,
        limit
      );

    /*
     * If Redis has enough messages,
     * return immediately.
     */
    if (cachedMessages.length === limit) {
      return res.json({
        source: "redis",
        messages: cachedMessages,
        hasMore: true,
      });
    }

    /*
     * ========================================
     * 2. REDIS DOES NOT HAVE ENOUGH DATA
     * ========================================
     *
     * Query MongoDB.
     */

    const query: any = {
      $or: [
        {
          sender: currentUserId,
          receiver: otherUserId,
        },
        {
          sender: otherUserId,
          receiver: currentUserId,
        },
      ],
    };

    /*
     * For older messages:
     *
     * createdAt < oldestLoadedMessage
     */
    if (before) {
      query.createdAt = {
        $lt: new Date(before),
      };
    }

    /*
     * Get one extra message so we can
     * determine hasMore.
     */
    const mongoMessages =
      await PrivateMessage.find(query)
        .sort({
          createdAt: -1,
        })
        .limit(limit + 1)
        .lean();

    const hasMore =
      mongoMessages.length > limit;

    if (hasMore) {
      mongoMessages.pop();
    }

    /*
     * MongoDB returned newest → oldest.
     *
     * Reverse it before sending to React.
     */
    const messages =
      mongoMessages.reverse();

    /*
     * ========================================
     * 3. ADD MONGODB RESULTS TO REDIS
     * ========================================
     */

    await cachePrivateMessages(
      currentUserId,
      otherUserId,
      messages
    );

    /*
     * ========================================
     * 4. RETURN
     * ========================================
     */

    return res.json({
      source: "mongodb",
      messages,
      hasMore,
    });
  } catch (error) {
    console.error(
      "Get private messages error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to retrieve private messages",
    });
  }
}