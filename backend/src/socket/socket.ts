import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message from "../models/Message.js";

interface SocketUser {
  id: string;
  name: string;
}

export const initializeSocket = (
  httpServer: HttpServer
) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(
          new Error("Authentication required")
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as { id: string };

      const user = await User.findById(decoded.id);

      if (!user) {
        return next(
          new Error("User not found")
        );
      }

      socket.data.user = {
        id: user._id.toString(),
        name: user.name
      } as SocketUser;

      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as SocketUser;

    console.log(`${user.name} connected`);

    socket.broadcast.emit("user_join", {
      id: user.id,
      name: user.name
    });

    socket.on(
      "message",
      async (message: string) => {
        try {
          if (!message.trim()) return;
          const savedMessage = await Message.create({
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

          io.emit("message", formattedMessage);
          const totalUsers = await User.countDocuments();
          const totalMessages = await Message.countDocuments();

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

    socket.on("disconnect", () => {
      console.log(`${user.name} disconnected`);

      socket.broadcast.emit("user_leave", {
        id: user.id,
        name: user.name
      });
    });


    socket.on("typing", () => {
      socket.broadcast.emit("user_typing", {
        id: user.id,
        name: user.name,
      });
    });

    socket.on("stop_typing", () => {
      socket.broadcast.emit("user_stop_typing", {
        id: user.id,
      });
    });
  });

  return io;
};