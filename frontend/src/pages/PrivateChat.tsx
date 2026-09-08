import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  MessageCircle,
  Wifi,
  WifiOff,
} from "lucide-react";

import {
  getPrivateMessages,
  type PrivateMessage,
} from "../services/privateMessagesApi.js";

import { socket } from "../services/socket";
import { useParams } from "react-router-dom";

import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";

import type { Message } from "../types";
import ChatPageHeader from "../components/ChatPageHeader.js";
import { getUserById } from "../services/usersAPi.js";


export default function PrivateChat() {
  /*
   * ========================================
   * USER IDS
   * ========================================
   */

  const { userId } =
    useParams<{ userId: string }>();

  const otherUserId = userId;


  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const currentUserId = currentUser.id;


  /*
   * ========================================
   * STATE
   * ========================================
   */

  const [messages, setMessages] =
    useState<PrivateMessage[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingOlder, setLoadingOlder] =
    useState(false);

  const [hasMore, setHasMore] =
    useState(true);

  const [status, setStatus] =
    useState("Connecting...");

  const [typingUser, setTypingUser] = useState<{
    id: string;
    name: string;
  } | null>(null);


const [otherUserName, setOtherUserName] =
  useState<string | null>(null);

useEffect(() => {
  if (!otherUserId) {
    return;
  }

  let cancelled = false;

  getUserById(otherUserId)
    .then((user) => {
      if (!cancelled) {
        setOtherUserName(user.name);
      }
    })
    .catch((error) => {
      console.error("Failed to load user:", error);
    });

  return () => {
    cancelled = true;
  };
}, [otherUserId]);


  const connected = status === "Connected";


  /*
   * ========================================
   * INITIAL LOAD
   * ========================================
   */

  const loadInitialMessages =
    useCallback(async () => {
      if (!otherUserId) {
        return;
      }

      try {
        setLoading(true);

        const response =
          await getPrivateMessages(
            otherUserId,
            20
          );

        setMessages(response.messages);
        setHasMore(response.hasMore);



      } catch (error) {
        console.error(
          "Failed to load messages:",
          error
        );
      } finally {
        setLoading(false);
      }
    }, [otherUserId]);


  /*
   * ========================================
   * LOAD OLDER MESSAGES
   * ========================================
   */

  const loadOlderMessages = async () => {
    if (
      !otherUserId ||
      loadingOlder ||
      !hasMore ||
      messages.length === 0
    ) {
      return;
    }

    try {
      setLoadingOlder(true);

      const oldestMessage = messages[0];

      const response =
        await getPrivateMessages(
          otherUserId,
          20,
          oldestMessage.createdAt
        );

      setMessages((previous) => [
        ...response.messages,
        ...previous,
      ]);

      setHasMore(response.hasMore);

    } catch (error) {
      console.error(
        "Failed to load older messages:",
        error
      );
    } finally {
      setLoadingOlder(false);
    }
  };


  /*
   * ========================================
   * INITIAL LOAD EFFECT
   * ========================================
   */

  useEffect(() => {
    if (!otherUserId) {
      return;
    }

    setMessages([]);
    setHasMore(true);

    loadInitialMessages();

  }, [
    otherUserId,
    loadInitialMessages,
  ]);


  /*
   * ========================================
   * SOCKET CONNECTION + EVENTS
   * ========================================
   */

  useEffect(() => {
    if (!otherUserId) {
      return;
    }

    const token = localStorage.getItem("token");

    socket.auth = {
      token,
    };

    if (!socket.connected) {
      socket.connect();
    } else {
      setStatus("Connected");
    }

    const joinRoom = () => {
      setStatus("Connected");
      socket.emit(
        "join_private_chat",
        otherUserId
      );
    };

    const handleDisconnect = () => {
      setStatus("Disconnected");
    };

    const handlePrivateMessage =
      (message: PrivateMessage) => {

        const belongsToChat =
          (
            message.sender === currentUserId &&
            message.receiver === otherUserId
          ) ||
          (
            message.sender === otherUserId &&
            message.receiver === currentUserId
          );

        if (!belongsToChat) {
          return;
        }

        if (message.sender === otherUserId) {
          setTypingUser(null);
        }

        setMessages((previous) => {
          const exists = previous.some(
            (item) => item._id === message._id
          );

          if (exists) {
            return previous;
          }

          return [...previous, message];
        });
      };

    const handlePrivateTyping =
      (user: { id: string; name: string }) => {
        if (user.id === otherUserId) {
          setTypingUser(user);
        }
      };

    const handlePrivateStopTyping =
      ({ id }: { id: string }) => {
        setTypingUser((current) =>
          current?.id === id ? null : current
        );
      };

    socket.on("connect", joinRoom);
    socket.on("disconnect", handleDisconnect);
    socket.on(
      "private_message",
      handlePrivateMessage
    );
    socket.on(
      "private_typing",
      handlePrivateTyping
    );
    socket.on(
      "private_stop_typing",
      handlePrivateStopTyping
    );

    if (socket.connected) {
      joinRoom();
    }

    return () => {
      socket.off("connect", joinRoom);
      socket.off("disconnect", handleDisconnect);
      socket.off(
        "private_message",
        handlePrivateMessage
      );
      socket.off(
        "private_typing",
        handlePrivateTyping
      );
      socket.off(
        "private_stop_typing",
        handlePrivateStopTyping
      );
      socket.emit("leave_private_chat", otherUserId);
    };

  }, [
    currentUserId,
    otherUserId,
  ]);


  /*
   * ========================================
   * SEND MESSAGE
   * ========================================
   */

  const sendMessage = (message: string) => {
    if (!message.trim() || !otherUserId) {
      return;
    }

    socket.emit(
      "private_message",
      {
        receiverId: otherUserId,
        message: message.trim(),
      }
    );
  };


  /*
   * ========================================
   * TYPING
   * ========================================
   */

  const handleTyping = (isTyping: boolean) => {
    if (!otherUserId) {
      return;
    }

    if (isTyping) {
      socket.emit("private_typing", {
        receiverId: otherUserId,
      });
    } else {
      socket.emit("private_stop_typing", {
        receiverId: otherUserId,
      });
    }
  };


  /*
   * ========================================
   * RENDER
   * ========================================
   */

  return (
    <div className="h-screen overflow-hidden bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col">
        <ChatPageHeader
          title={otherUserName}
          subtitle={`Your conversation with ${otherUserName}.`}
          showBackButton
        />

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
                <h2 className="truncate font-semibold text-slate-900">
                  {otherUserName}
                </h2>
              </div>
            </div>

            {/* Right: Connection */}
            <div
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${connected
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

          {/* Messages */}
          <div className="min-h-0 flex-1">
            <MessageList
              messages={messages as Message[]}
              typingUser={typingUser}
              onLoadOlder={loadOlderMessages}
              hasMore={hasMore}
              loadingOlder={loadingOlder || loading}
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