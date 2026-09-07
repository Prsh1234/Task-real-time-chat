import { useEffect, useState } from "react";
import {
    LogOut,
    MessageCircle,
    UserCircle,
    Wifi,
    WifiOff,
} from "lucide-react";

import api from "../services/api";
import { socket } from "../services/socket";

import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";

import { type Message } from "../types";
import { useNavigate, useParams } from "react-router-dom";

export default function PrivateChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
    // const [user, setUser] = useState<User[]>();
    const [typingUser, setTypingUser] = useState<{
        id: string;
        name: string;
    } | null>(null);
console.log("typingUser:", typingUser);
    const { userId } = useParams();

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



    const [status, setStatus] = useState("Connecting...");

    useEffect(() => {
        const token = localStorage.getItem("token");

        socket.auth = {
            token,
        };

        loadMessages();

        socket.connect();

        socket.on("connect", () => {
            setStatus("Connected");
            if (userId) {
                socket.emit(
                    "join_private_chat",
                    userId
                );
            }
        });

        socket.on("disconnect", () => {
            setStatus("Disconnected");
        });

        socket.on(
            "private_message",
            (message: Message) => {
                setMessages((prev) => [
                    ...prev,
                    message,
                ]);
            }
        );

   socket.on(
    "private_typing",
    (user: { id: string; name: string }) => {
        console.log("RECEIVED TYPING:", user);
        setTypingUser(user);
    }
);

socket.on(
    "private_stop_typing",
    ({ id }: { id: string }) => {
        console.log("RECEIVED STOP TYPING:", id);

        setTypingUser((current) =>
            current?.id === id ? null : current
        );
    }
);

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("private_message");
            socket.off("private_typing");
            socket.off("private_stop_typing");
            socket.disconnect();
        };
    }, [userId]);
    const handleTyping = (
        isTyping: boolean
    ) => {
        if (!userId) return;

        if (isTyping) {
            socket.emit(
                "private_typing",
                {
                    receiverId: userId,
                }
            );
        } else {
            socket.emit(
                "private_stop_typing",
                {
                    receiverId: userId,
                }
            );
        }
    };
    const loadMessages = async () => {
        try {
            const response = await api.get(
                `/private-chat/${userId}/messages`
            );
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

            const response = await api.get(`/private-chat/${userId}/messages`, {
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


    const sendMessage = (
        message: string
    ) => {
        if (!userId) return;

        socket.emit(
            "private_message",
            {
                receiverId: userId,
                message,
            }
        );
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
                                    
                                </h2>
                            </div>
                        </div>

                        {/* Right: Stats + Connection */}
                        <div className="flex shrink-0 items-center gap-2">

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