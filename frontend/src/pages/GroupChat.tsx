import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    MessageCircle,
    UserPlus,
    Wifi,
    WifiOff,
} from "lucide-react";


import { socket } from "../services/socket";
import { useNavigate, useParams } from "react-router-dom";

import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";

import type { Message } from "../types";
import ChatPageHeader from "../components/ChatPageHeader.js";
import { getGroupById, getGroupMessages, type GroupMessage } from "../services/groupMessageApi.js";
import InviteUserModal from "../components/InviteUserModal.js";


export default function GroupChat() {
    /*
     * ========================================
     * USER IDS
     * ========================================
     */
    const [accessChecked, setAccessChecked] = useState(false);
    const { groupId } =
        useParams<{ groupId: string }>();

const navigate = useNavigate();

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
        useState<GroupMessage[]>([]);

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

    const [showInviteModal, setShowInviteModal] =
        useState(false);
    const [group, setGroup] = useState<{
        _id: string;
        groupName: string;
        owner: {
            _id: string;
            name: string;
        };
    } | null>(null);


    useEffect(() => {
        if (!groupId) {
            return;
        }

        let cancelled = false;
        setAccessChecked(false);

         getGroupById(groupId)
        .then((group) => {
            if (!cancelled) {
                setGroup(group);
                setAccessChecked(true);
            }
        })
        .catch((error) => {
            if (cancelled) return;

            if (
                error.response?.status === 403 ||
                error.response?.status === 404
            ) {
                navigate("/groupList");
                return;
            }

            console.error("Failed to load group:", error);
        });


        return () => {
            cancelled = true;
        };
    }, [groupId]);
    const groupName =
        group?.groupName ?? null;

    const isOwner =
        group?.owner?._id === currentUserId;

    const connected = status === "Connected";


    /*
     * ========================================
     * INITIAL LOAD
     * ========================================
     */

    const loadInitialMessages =
        useCallback(async () => {
            if (!groupId) {
                return;
            }

            try {
                setLoading(true);

                const response =
                    await getGroupMessages(
                        groupId,
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
        }, [groupId]);


    /*
     * ========================================
     * LOAD OLDER MESSAGES
     * ========================================
     */

    const loadOlderMessages = async () => {
        if (
            !groupId ||
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
                await getGroupMessages(
                    groupId,
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
        if (!groupId || !accessChecked) {
            return;
        }

        setMessages([]);
        setHasMore(true);

        loadInitialMessages();

    }, [
        groupId,
        loadInitialMessages,
        accessChecked
    ]);


    /*
     * ========================================
     * SOCKET CONNECTION + EVENTS
     * ========================================
     */

    useEffect(() => {
        if (!groupId || !accessChecked) {
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
                "join_group_chat",
                groupId
            );
        };

        const handleDisconnect = () => {
            setStatus("Disconnected");
        };

        const handleGroupMessage =
            (message: GroupMessage) => {

                if (
                    message.group !== groupId
                ) {
                    return;
                }

                if (
                    message.sender !==
                    currentUserId
                ) {
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

        const handleGroupTyping =
            (user: { id: string; name: string }) => {
                if (user.id === currentUserId) {
                    return;
                }
                setTypingUser(user);

            };

        const handleGroupStopTyping =
            ({ id }: { id: string }) => {

                setTypingUser(
                    (current) =>
                        current?.id === id
                            ? null
                            : current
                );
            };

        socket.on("connect", joinRoom);
        socket.on("disconnect", handleDisconnect);
        socket.on(
            "group_message",
            handleGroupMessage
        );
        socket.on(
            "group_typing",
            handleGroupTyping
        );
        socket.on(
            "group_stop_typing",
            handleGroupStopTyping
        );

        if (socket.connected) {
            joinRoom();
        }

        return () => {
            socket.off("connect", joinRoom);
            socket.off("disconnect", handleDisconnect);
            socket.off(
                "group_message",
                handleGroupMessage
            );
            socket.off(
                "group_typing",
                handleGroupTyping
            );
            socket.off(
                "group_stop_typing",
                handleGroupStopTyping
            );
            socket.emit("leave_group_chat", groupId);
        };

    }, [
        currentUserId,
        groupId,
        accessChecked
    ]);


    /*
     * ========================================
     * SEND MESSAGE
     * ========================================
     */

    const sendMessage = (message: string) => {
        if (!message.trim() || !groupId) {
            return;
        }

        socket.emit(
            "group_message",
            {
                groupId: groupId,
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
        if (!groupId) {
            return;
        }

        if (isTyping) {
            socket.emit("group_typing", {
                groupId: groupId,
            });
        } else {
            socket.emit("group_stop_typing", {
                groupId: groupId,
            });
        }
    };


    /*
     * ========================================
     * RENDER
     * ========================================
     */
    if(!accessChecked){
        return(
            <>
            </>
        )
    }

    return (
        <div className="h-screen overflow-hidden bg-slate-50 p-4 sm:p-6">
            <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col">
                <ChatPageHeader
                    title={groupName}
                    subtitle={`Your conversation with ${groupName}.`}
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
                                    {groupName}
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
                        {isOwner && (
                            <button
                                onClick={() =>
                                    setShowInviteModal(true)
                                }
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                <UserPlus size={16} />

                                <span className="hidden sm:inline">
                                    Invite
                                </span>
                            </button>
                        )}
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
            {showInviteModal && groupId && (
                <InviteUserModal
                    groupId={groupId}
                    onClose={() =>
                        setShowInviteModal(false)
                    }
                />
            )}
        </div>

    );
}