import type { Request, Response } from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { cacheMessages, getCachedMessages } from "../services/messageCache.js";


export const getMessages = async (
  req: Request,
  res: Response
) => {
  try {
    const before =
      typeof req.query.before === "string"
        ? req.query.before
        : undefined;

    const limit = Math.min(
      Number(req.query.limit) || 20,
      50
    );

    // Try Redis first
    const cachedMessages = await getCachedMessages(
      "community_chat",
      before,
      limit
    );

    if (cachedMessages.length === limit) {
      console.log(
        `[messages] source=redis community_chat count=${cachedMessages.length}`
      );

      return res.json({
        source: "redis",
        messages: cachedMessages,
        hasMore: true,
      });
    }

    // MongoDB fallback
    const filter = before
      ? {
          createdAt: {
            $lt: new Date(before),
          },
        }
      : {};

    const mongoMessages = await Message.find(filter)
      .populate("sender", "name")
      .sort({
        createdAt: -1,
      })
      .limit(limit + 1)
      .lean();

    const hasMore = mongoMessages.length > limit;

    // Remove extra message used to determine hasMore
    if (hasMore) {
      mongoMessages.pop();
    }

    // Convert newest → oldest into oldest → newest
    const messages = mongoMessages
      .reverse()
      .map((msg: any) => ({
        _id: msg._id,
        sender: msg.sender._id,
        senderName: msg.sender.name,
        message: msg.message,
        createdAt: msg.createdAt,
      }));

    await cacheMessages(
      "community_chat",
      messages
    );

    console.log(
      `[messages] source=mongodb community_chat count=${messages.length}`
    );

    return res.json({
      source: "mongodb",
      messages,
      hasMore,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to retrieve messages",
    });
  }
};


export const getChatStats = async (
  req: Request,
  res: Response
) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMessages = await Message.countDocuments();

    res.json({
      totalUsers,
      totalMessages
    });
  } catch {
    res.status(500).json({
      message: "Failed to retrieve statistics"
    });
  }
};