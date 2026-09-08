import type {
  RequestHandler,
} from "express";

import PrivateMessage from "../models/PrivateMessage.js";

import {
  getCachedPrivateMessages,
  cachePrivateMessages,
} from "../services/privateMessageCache.js";

interface PrivateMessageParams {
  userId: string;
}

export const getPrivateMessages: RequestHandler<
  PrivateMessageParams
> = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const currentUserId =
      req.user._id.toString();

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

    const cachedMessages =
      await getCachedPrivateMessages(
        currentUserId,
        otherUserId,
        before,
        limit
      );

    if (
      cachedMessages.length === limit
    ) {
        console.log(`[messages] source=redis user=${currentUserId} other=${otherUserId} count=${cachedMessages.length}`);

      return res.json({
        source: "redis",
        messages: cachedMessages,
        hasMore: true,
      });
    }

    const query = {
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
      ...(before
        ? {
            createdAt: {
              $lt: new Date(before),
            },
          }
        : {}),
    };

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

    const messages =
      mongoMessages.reverse();

    await cachePrivateMessages(
      currentUserId,
      otherUserId,
      messages
    );
console.log(`[messages] source=mongodb user=${currentUserId} other=${otherUserId} count=${messages.length}`);

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
};


// 1) "private_chat:6a9cfdd6cfdbc1b6fc93cf49_6a9e7cd39804963769f40427"
// 2) "private_chat:6a8d8bdad03ef477d85e2e2e_6a8da147451dfc9c97baed00"
// 3) "private_chat:6a8da147451dfc9c97baed00_6a9cfdd6cfdbc1b6fc93cf49"
// 4) "private_chat:6a8d7d68777b181736afb055_6a8da147451dfc9c97baed00"
// 5) "private_chat:6a8da147451dfc9c97baed00_6a9e7cd39804963769f40427"
// 6) "private_chat:6a8d7d68777b181736afb055_6a9cfdd6cfdbc1b6fc93cf49"


// docker exec -it chat-redis redis-cli ZRANGE "private_chat:6a9cfdd6cfdbc1b6fc93cf49_6a9e7cd39804963769f40427" 0 -1 WITHSCORES
// docker exec -it chat-redis redis-cli ZRANGE "private_chat:6a8d8bdad03ef477d85e2e2e_6a8da147451dfc9c97baed00" 0 -1 WITHSCORES
// docker exec -it chat-redis redis-cli ZRANGE "private_chat:6a8da147451dfc9c97baed00_6a9cfdd6cfdbc1b6fc93cf49" 0 -1 WITHSCORES
// docker exec -it chat-redis redis-cli ZRANGE "private_chat:6a8d7d68777b181736afb055_6a8da147451dfc9c97baed00" 0 -1 WITHSCORES
// docker exec -it chat-redis redis-cli ZRANGE "private_chat:6a8da147451dfc9c97baed00_6a9e7cd39804963769f40427" 0 -1 WITHSCORES
// docker exec -it chat-redis redis-cli ZRANGE "private_chat:6a8d7d68777b181736afb055_6a9cfdd6cfdbc1b6fc93cf49" 0 -1 WITHSCORES