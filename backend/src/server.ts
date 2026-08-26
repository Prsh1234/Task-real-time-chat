import "dotenv/config";

import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initializeSocket } from "./socket/socket.js";
import { seedAdmin } from "./config/seedAdmin.js";

const PORT = process.env.PORT;

const startServer = async () => {
  await connectDB();
    await seedAdmin();
  const httpServer = http.createServer(app);

  initializeSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`CORS origin: ${process.env.CLIENT_URL}`);
  });
};

startServer();