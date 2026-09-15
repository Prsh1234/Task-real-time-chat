import { Server, Socket } from "socket.io";

import User from "../models/User.js";
import Message from "../models/Message.js";
import { cacheMessages } from "../services/messageCache.js";

interface SocketUser {
  id: string;
  name: string;
}

export const initializeCommunitySocket = (
  io: Server,
  socket: Socket
) => {
  const user = socket.data.user as SocketUser;

  /*
   * ==========================================
   * USER JOIN
   * ==========================================
   */

  socket.broadcast.emit("user_join", {
    id: user.id,
    name: user.name,
  });

  /*
   * ==========================================
   * COMMUNITY MESSAGE
   * ==========================================
   */

  socket.on(
    "message",
    async (message: string) => {
      try {
        if (!message.trim()) {
          return;
        }

        const savedMessage =
          await Message.create({
            sender: user.id,
            senderName: user.name,
            message: message.trim(),
          });

        const formattedMessage = {
          _id: savedMessage._id,
          sender: user.id,
          senderName: user.name,
          message: savedMessage.message,
          createdAt: savedMessage.createdAt,
        };
        await cacheMessages(
          "community_chat",
          [formattedMessage]
        );
        io.emit(
          "message",
          formattedMessage
        );

        const totalUsers =
          await User.countDocuments();

        const totalMessages =
          await Message.countDocuments();

        io.emit("stats_update", {
          totalUsers,
          totalMessages,
        });
      } catch (error) {
        console.error(
          "Message save error:",
          error
        );
      }
    }
  );

  /*
   * ==========================================
   * COMMUNITY TYPING
   * ==========================================
   */

  socket.on("typing", () => {
    socket.broadcast.emit(
      "user_typing",
      {
        id: user.id,
        name: user.name,
      }
    );
  });

  socket.on("stop_typing", () => {
    socket.broadcast.emit(
      "user_stop_typing",
      {
        id: user.id,
      }
    );
  });

  /*
   * ==========================================
   * USER DISCONNECT
   * ==========================================
   */

  socket.on("disconnect", () => {
    console.log(
      `${user.name} disconnected`
    );

    socket.broadcast.emit(
      "user_leave",
      {
        id: user.id,
        name: user.name,
      }
    );
  });
};