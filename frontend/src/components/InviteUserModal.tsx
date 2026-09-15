import {
    useEffect,
    useState,
} from "react";

import {
    Search,
    UserPlus,
    X,
} from "lucide-react";

import {
    searchGroupUsers,
    type GroupUser,
} from "../services/groupInvitationApi";
import { socket } from "../services/socket";

interface InviteUserModalProps {
    groupId: string;
    onClose: () => void;
}

export default function InviteUserModal({
    groupId,
    onClose,
}: InviteUserModalProps) {
    const [query, setQuery] =
        useState("");

    const [users, setUsers] =
        useState<GroupUser[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [invitingUserId, setInvitingUserId] =
        useState<string | null>(null);

    const [message, setMessage] =
        useState<string | null>(null);

    useEffect(() => {
        if (!query.trim()) {
            setUsers([]);
            return;
        }

        const timer = setTimeout(
            async () => {
                try {
                    setLoading(true);

                    const result =
                        await searchGroupUsers(
                            groupId,
                            query.trim()
                        );

                    setUsers(result);

                } catch (error) {
                    console.error(
                        "Failed to search users:",
                        error
                    );
                } finally {
                    setLoading(false);
                }
            },
            300
        );

        return () => {
            clearTimeout(timer);
        };
    }, [groupId, query]);

    const handleInvite = (userId: string) => {
        setInvitingUserId(userId);
        setMessage(null);

        socket.emit(
            "invitation",
            {
                groupId,
                receiverId: userId,
            },
            (response: {
                success: boolean;
                message: string;
            }) => {
                if (response.success) {
                    setUsers((previous) =>
                        previous.filter(
                            (user) =>
                                user._id !== userId
                        )
                    );
                }

                setMessage(response.message);
                setInvitingUserId(null);
            }
        );
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Invite users
                        </h2>

                        <p className="text-sm text-slate-500">
                            Search for a user to invite
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 hover:bg-slate-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-5">

                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            value={query}
                            onChange={(event) =>
                                setQuery(
                                    event.target.value
                                )
                            }
                            placeholder="Search name or email..."
                            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 outline-none focus:border-blue-500"
                        />
                    </div>

                    {message && (
                        <p className="mt-3 text-sm text-slate-600">
                            {message}
                        </p>
                    )}

                    {/* Results */}
                    <div className="mt-4 space-y-2">

                        {loading && (
                            <p className="text-sm text-slate-500">
                                Searching...
                            </p>
                        )}

                        {!loading &&
                            query &&
                            users.length === 0 && (
                                <p className="text-sm text-slate-500">
                                    No users found.
                                </p>
                            )}

                        {users.map((user) => (
                            <div
                                key={user._id}
                                className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-900">
                                        {user.name}
                                    </p>

                                    <p className="truncate text-sm text-slate-500">
                                        {user.email}
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        handleInvite(
                                            user._id
                                        )
                                    }
                                    disabled={
                                        invitingUserId ===
                                        user._id
                                    }
                                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                                >
                                    <UserPlus
                                        size={15}
                                    />

                                    {invitingUserId ===
                                        user._id
                                        ? "Sending..."
                                        : "Invite"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}