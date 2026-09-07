import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import privateChatRoutes from "./routes/privateChat.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Chat API is running"
  });
});

app.use("/api/admin", adminRoutes)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use(
  "/api/private-chat",
  privateChatRoutes
);

export default app;