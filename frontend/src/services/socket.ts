import { io } from "socket.io-client";

export const socket = io(
  import.meta.env.VITE_SOCKET_URL,
  {
    autoConnect: false,

  }
);

export function connectSocket(
  token: string
) {
  socket.auth = {
    token,
  };

  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}