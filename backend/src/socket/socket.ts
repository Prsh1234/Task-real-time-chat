import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Message from "../models/Message.js";
import PrivateMessage from "../models/PrivateMessage.js";

import {
  cachePrivateMessages,
} from "../services/privateMessageCache.js";
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
      methods: ["GET", "POST"],
    },
  });


  /*
   * ============================================
   * SOCKET AUTHENTICATION
   * ============================================
   */

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token;

      if (!token) {
        return next(
          new Error("Authentication required")
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as { id: string };

      const user = await User.findById(
        decoded.id
      );

      if (!user) {
        return next(
          new Error("User not found")
        );
      }

      socket.data.user = {
        id: user._id.toString(),
        name: user.name,
      } as SocketUser;

      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });


  /*
   * ============================================
   * CONNECTION
   * ============================================
   */

  io.on("connection", (socket) => {
    const user =
      socket.data.user as SocketUser;

    console.log(
      `${user.name} connected`
    );


    /*
     * ==========================================
     * COMMUNITY CHAT
     * ==========================================
     */

    socket.broadcast.emit("user_join", {
      id: user.id,
      name: user.name,
    });


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
            createdAt:
              savedMessage.createdAt,
          };

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
     * PRIVATE CHAT
     * ==========================================
     */

    socket.on(
      "join_private_chat",
      (otherUserId: string) => {
        const currentUserId =
          user.id;

        const roomId =
          getPrivateRoomId(
            currentUserId,
            otherUserId
          );

        socket.join(roomId);

        console.log(
          `${user.name} joined private room: ${roomId}`
        );
      }
    );


    /*
     * ==========================================
     * PRIVATE MESSAGE
     * ==========================================
     */

    socket.on(
      "private_message",
      async (data: {
        receiverId: string;
        message: string;
      }) => {
        try {
          const messageText =
            data.message.trim();

          if (!messageText) {
            return;
          }

          const senderId =
            user.id;

          const receiverId =
            data.receiverId;


          /*
           * ------------------------------------
           * 1. SAVE PERMANENTLY TO MONGODB
           * ------------------------------------
           */

          const privateMessage =
            await PrivateMessage.create({
              sender: senderId,
              receiver: receiverId,
              senderName: user.name,
              message: messageText,
            });


          /*
           * ------------------------------------
           * 2. FORMAT MESSAGE
           * ------------------------------------
           *
           * Convert ObjectIds / Mongoose document
           * into a normal object for Redis and
           * Socket.IO.
           */

          const formattedMessage = {
            _id:
              privateMessage._id.toString(),

            sender:
              privateMessage.sender.toString(),

            receiver:
              privateMessage.receiver.toString(),

            senderName:
              privateMessage.senderName,

            message:
              privateMessage.message,

            createdAt:
              privateMessage.createdAt,

            updatedAt:
              privateMessage.updatedAt,
          };


          /*
           * ------------------------------------
           * 3. SAVE MESSAGE TO REDIS CACHE
           * ------------------------------------
           */
          await cachePrivateMessages(
            senderId,
            receiverId,
            [formattedMessage]
          );

          /*
           * ------------------------------------
           * 4. GET PRIVATE ROOM
           * ------------------------------------
           */

          const roomId =
            getPrivateRoomId(
              senderId,
              receiverId
            );


          /*
           * ------------------------------------
           * 5. SEND MESSAGE TO BOTH USERS
           * ------------------------------------
           */

          io.to(roomId).emit(
            "private_message",
            formattedMessage
          );


        } catch (error) {
          console.error(
            "Private message error:",
            error
          );

          socket.emit(
            "private_message_error",
            {
              message:
                "Failed to send private message",
            }
          );
        }
      }
    );




    /*
     * ==========================================
     * LEAVE ROOM TYPING
     * ==========================================
     */
    socket.on(
      "leave_private_chat",
      (otherUserId: string) => {
        const roomId = getPrivateRoomId(
          user.id,
          otherUserId
        );

        socket.leave(roomId);

        console.log(
          `${user.name} left private room: ${roomId}`
        );
      }
    );

    /*
     * ==========================================
     * PRIVATE TYPING
     * ==========================================
     */

    socket.on(
      "private_typing",
      ({
        receiverId,
      }: {
        receiverId: string;
      }) => {
        const roomId =
          getPrivateRoomId(
            user.id,
            receiverId
          );

        socket
          .to(roomId)
          .emit(
            "private_typing",
            {
              id: user.id,
              name: user.name,
            }
          );
      }
    );


    /*
     * ==========================================
     * PRIVATE STOP TYPING
     * ==========================================
     */

    socket.on(
      "private_stop_typing",
      ({
        receiverId,
      }: {
        receiverId: string;
      }) => {
        const roomId =
          getPrivateRoomId(
            user.id,
            receiverId
          );

        socket
          .to(roomId)
          .emit(
            "private_stop_typing",
            {
              id: user.id,
            }
          );
      }
    );


    /*
     * ==========================================
     * DISCONNECT
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
  });


  return io;
};


/*
 * ============================================
 * PRIVATE ROOM ID
 * ============================================
 *
 * User A + User B
 *
 * and
 *
 * User B + User A
 *
 * produce the same room.
 */

const getPrivateRoomId = (
  userId1: string,
  userId2: string
) => {
  return [userId1, userId2]
    .sort()
    .join("_");
};

