import type { Request, Response } from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";


export const getMessages = async (
  req: Request,
  res: Response
) => {
  try {
    const { before } = req.query;

    const filter = before
      ? {
          createdAt: {
            $lt: new Date(before as string),
          },
        }
      : {};

    const messages = await Message.find(filter)
      .populate("sender", "name")
      .sort({ createdAt: -1 })
      .limit(100);

    const formattedMessages = messages
      .reverse()
      .map((msg: any) => ({
        _id: msg._id,
        sender: msg.sender._id,
        senderName: msg.sender.name,
        message: msg.message,
        createdAt: msg.createdAt,
      }));

    res.json({
      messages: formattedMessages,
      hasMore: messages.length === 100,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
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