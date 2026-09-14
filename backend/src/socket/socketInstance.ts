import type { Server } from "socket.io";

let io: Server;

export const setSocketIO = (server: Server) => {
    io = server;
};

export const getSocketIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};