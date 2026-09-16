import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

import {
  initializeCommunitySocket,
} from "./communitySocket.js";

import {
  initializePrivateSocket,
} from "./privateSocket.js";
import { initializeGroupSocket } from "./groupSocket.js";
import { setSocketIO } from "./socketInstance.js";
import { initializeInvitationSocket } from "./invitationSocket.js";
import { addOnlineUser, getOnlineUsers, removeOnlineUser } from "../services/onlineUsersRedis.js";


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
  setSocketIO(io);

  /*
   * ==========================================
   * SOCKET AUTHENTICATION
   * ==========================================
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

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET!
        ) as { id: string };

      const user =
        await User.findById(decoded.id);

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
      next(
        new Error("Invalid token")
      );
    }
  });


  /*
   * ==========================================
   * CONNECTION
   * ==========================================
   */

  io.on("connection", async (socket) => {

    const user =
      socket.data.user as SocketUser;

    console.log(
      `${user.name} connected`
    );
    /*
     * ==========================================
     * USER JOIN
     * ==========================================
     */

    // Add user to Redis
    await addOnlineUser(user.id);

    // Get all currently online users
    const onlineUsers = await getOnlineUsers();

    io.emit("online_users", onlineUsers);

    socket.on("get_online_users", async () => {
      const onlineUsers = await getOnlineUsers();

      socket.emit("online_users", onlineUsers);
    });

    /*
     * ==========================================
     * USER DISCONNECT
     * ==========================================
     */
    socket.on("disconnect", async () => {
      console.log(`${user.name} disconnected`);

      // Remove user from Redis
      await removeOnlineUser(user.id);

      // Get updated online users
      const onlineUsers = await getOnlineUsers();

      // Send updated list
      io.emit("online_users", onlineUsers);
    });

    socket.join(`user:${user.id}`);

    initializeCommunitySocket(
      io,
      socket
    );

    initializePrivateSocket(
      io,
      socket
    );

    initializeGroupSocket(
      io,
      socket
    );

    initializeInvitationSocket(
      io,
      socket
    );
  });


  return io;
};