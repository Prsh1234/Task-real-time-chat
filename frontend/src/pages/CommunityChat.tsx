import { useEffect, useState } from "react";
import {
  LogOut,
  MessageCircle,
  UserCircle,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

import api from "../services/api";
import { socket } from "../services/socket";

import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";

import type { Message, ChatStats } from "../types";
import { useNavigate } from "react-router-dom";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

  const [typingUser, setTypingUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const navigate = useNavigate();
  const handleLogout = () => {
    socket.disconnect();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };
  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );
  const role = currentUser.role;
  const isAdmin = role == "admin" ? true : false;

  const [stats, setStats] = useState<ChatStats>({
    totalUsers: 0,
    totalMessages: 0,
  });

  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    const token = localStorage.getItem("token");

    socket.auth = {
      token,
    };

    loadMessages();
    loadStats();

    socket.connect();

    socket.on("connect", () => {
      setStatus("Connected");
    });

    socket.on("disconnect", () => {
      setStatus("Disconnected");
    });

    socket.on("message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });
    socket.on("stats_update", (newStats: ChatStats) => {
      setStats(newStats);
    });
    socket.on("user_join", (user) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: crypto.randomUUID(),
          sender: user.id,
          senderName: user.name,
          message: `${user.name} joined the chat`,
          createdAt: new Date().toISOString(),
          type: "join",
        },
      ]);
    });

    socket.on("user_leave", (user) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: crypto.randomUUID(),
          sender: user.id,
          senderName: user.name,
          message: `${user.name} left the chat`,
          createdAt: new Date().toISOString(),
          type: "leave",
        },
      ]);
    });
    socket.on(
      "user_typing",
      (user: { id: string; name: string }) => {
        setTypingUser(user);
      }
    );

    socket.on(
      "user_stop_typing",
      ({ id }: { id: string }) => {
        setTypingUser((current) =>
          current?.id === id ? null : current
        );
      }
    );

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("message");
      socket.off("user_join");
      socket.off("user_leave");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("stats_update");
      socket.disconnect();
    };
  }, []);
  const handleTyping = (isTyping: boolean) => {
    if (isTyping) {
      socket.emit("typing");
    } else {
      socket.emit("stop_typing");
    }
  };
  const loadMessages = async () => {
    try {
      const response = await api.get("/chat/messages");

      setMessages(response.data.messages);
      setHasMoreMessages(response.data.hasMore);
    } catch (error) {
      console.error(error);
    }
  };
  const loadOlderMessages = async () => {
    if (
      loadingOlderMessages ||
      !hasMoreMessages ||
      messages.length === 0
    ) {
      return;
    }

    try {
      setLoadingOlderMessages(true);

      const oldestMessage = messages[0];

      const response = await api.get("/chat/messages", {
        params: {
          before: oldestMessage.createdAt,
        },
      });

      const olderMessages: Message[] =
        response.data.messages;

      setHasMoreMessages(response.data.hasMore);

      if (olderMessages.length === 0) {
        return;
      }

      setMessages((prev) => [
        ...olderMessages,
        ...prev,
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOlderMessages(false);
    }
  };
  const loadStats = async () => {
    try {
      const response = await api.get("/chat/stats");
      setStats(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = (message: string) => {
    socket.emit("message", message);
  };

  const connected = status === "Connected";

  return (
    <div className="h-screen overflow-hidden bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col">

        {/* Page title */}
        <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
          {/* Left: Page title */}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Community Chat
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Connect and chat with other users in real time.
            </p>
          </div>

          {/* Right: User actions */}
          <div className="flex shrink-0 items-center gap-2">

            {/* Profile */}
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-slate-100 sm:px-3"
            >
              <UserCircle
                size={22}
                className="text-slate-500"
              />

              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {currentUser.name || "User"}
                </p>

                <p className="text-[11px] text-slate-400">
                  Edit profile
                </p>
              </div>
            </button>

            {/* Divider */}
            <div className="h-7 w-px bg-slate-200" />
            {isAdmin &&
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-slate-100 sm:px-3"
              >
                <UserCircle
                  size={22}
                  className="text-slate-500"
                />

                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-slate-800">
                    {"Admin"}
                  </p>

                </div>
              </button>
            }
            {/* Divider */}
            <div className="h-7 w-px bg-slate-200" />

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 sm:px-3"
              title="Logout"
            >
              <LogOut size={18} />

              <span className="hidden sm:inline">
                Logout
              </span>
            </button>
          </div>
        </div>

        {/* Chat */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Chat Header */}
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">

            {/* Left */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <MessageCircle size={20} />
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900">
                  Live Chat
                </h2>
              </div>
            </div>

            {/* Right: Stats + Connection */}
            <div className="flex shrink-0 items-center gap-2">

              {/* Users */}
              <div className="hidden items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 sm:flex">
                <Users
                  size={16}
                  className="text-blue-600"
                />

                <div className="leading-none">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Users
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {stats.totalUsers}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="hidden items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 sm:flex">
                <MessageCircle
                  size={16}
                  className="text-indigo-600"
                />

                <div className="leading-none">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Messages
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {stats.totalMessages}
                  </p>
                </div>
              </div>

              {/* Connection */}
              <div
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${connected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
                  }`}
              >
                {connected ? (
                  <Wifi size={14} />
                ) : (
                  <WifiOff size={14} />
                )}

                <span className="hidden md:inline">
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="flex shrink-0 gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 sm:hidden">
            <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2">
              <Users
                size={15}
                className="text-blue-600"
              />

              <span className="text-xs text-slate-500">
                Users
              </span>

              <span className="text-sm font-semibold text-slate-800">
                {stats.totalUsers}
              </span>
            </div>

            <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2">
              <MessageCircle
                size={15}
                className="text-indigo-600"
              />

              <span className="text-xs text-slate-500">
                Messages
              </span>

              <span className="text-sm font-semibold text-slate-800">
                {stats.totalMessages}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="min-h-0 flex-1">
            <MessageList
              messages={messages}
              typingUser={typingUser}
              onLoadOlder={loadOlderMessages}
              hasMore={hasMoreMessages}
              loadingOlder={loadingOlderMessages}
            />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-slate-200 bg-white">
            <ChatInput
              onSend={sendMessage}
              onTyping={handleTyping}
            />
          </div>
        </div>
      </div>
    </div>
  );
}