import { Loader2, LogOut, MessageCircle, UserCircle, Users, X } from "lucide-react";
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getGroupChats, type GroupChat } from "../services/groupMessageApi";
import GroupInvitations from "./GroupInvitations";

export default function GroupList() {
    const [groupName, setGroupName] = useState("");
    const [groupChats, setGroupChats] = useState<GroupChat[]>([]);;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const currentUser = JSON.parse(
        localStorage.getItem("user") || "{}"
    );
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [message, setMessage] = useState("");

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/", { replace: true });
    };
    const navigate = useNavigate();
    const handleClick = () => {
        setShowCreateGroup(true);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!groupName.trim()) {
            return;
        }

        console.log("Creating group:", groupName);
        try {
            const response = await api.post("/groupChat/create", {
                groupName: groupName
            });
            console.log(response.data.message)
        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Something went wrong"
            );

        } finally {

        }


        setGroupName("");
        setShowCreateGroup(false);
    };

    const handleClose = () => {
        setGroupName("");
        setShowCreateGroup(false);
    };

    const loadGroups = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getGroupChats();

            setGroupChats(data);
        } catch (error: any) {
            console.error(error);

            setError(
                error?.response?.data?.message ||
                "Failed to load users"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGroups();
    }, []);
    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
        );
    }
    return (
        <>
            <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="space-y-6">
                    <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
                        {/* Left: Page title */}
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Group Chat
                            </h1>
                        </div>

                        {/* Right: User actions */}
                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate("/home")}
                                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 sm:px-3 cursor-pointer"
                                title="Private Chat"
                            >
                                <MessageCircle size={18} />

                                <span className="hidden sm:inline">
                                    Private Chat
                                </span>
                            </button>

                            {/* Divider */}
                            <div className="h-7 w-px bg-slate-200" />
                            {/* Chat */}
                            <button
                                type="button"
                                onClick={() => navigate("/chat")}
                                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 sm:px-3 cursor-pointer"
                                title="Community Chat"
                            >
                                <MessageCircle size={18} />

                                <span className="hidden sm:inline">
                                    Community Chat
                                </span>
                            </button>

                            {/* Divider */}
                            <div className="h-7 w-px bg-slate-200" />

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

                                <div className="hidden text-left sm:block cursor-pointer">
                                    <p className="text-sm font-semibold text-slate-800">
                                        {currentUser.name || "Admin"}
                                    </p>

                                    <p className="text-[11px] text-slate-400">
                                        Edit profile
                                    </p>
                                </div>
                            </button>

                            {/* Divider */}
                            <div className="h-7 w-px bg-slate-200" />

                            {/* Logout */}
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 sm:px-3 cursor-pointer"
                                title="Logout"
                            >
                                <LogOut size={18} />

                                <span className="hidden sm:inline">
                                    Logout
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                                    <Users
                                        size={18}
                                        className="text-slate-600"
                                    />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        Chat with others
                                    </p>

                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClick}
                                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 active:scale-95"
                            >
                                Create a Group
                            </button>
                        </div>

                    </div>

                    {/* Invitations */}
                    <GroupInvitations />

                    {/* Error */}
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Users Card */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {/* Card Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                                    <Users
                                        size={18}
                                        className="text-slate-600"
                                    />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        Chat with others
                                    </p>

                                </div>
                            </div>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {groupChats.length}{" "}
                                {groupChats.length === 1 ? "user" : "users"}
                            </span>
                        </div>

                        {/* Empty State */}
                        {groupChats.length === 0 ? (
                            <div className="px-6 py-16 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                    <Users
                                        size={22}
                                        className="text-slate-400"
                                    />
                                </div>

                                <p className="mt-4 text-sm font-semibold text-slate-900">
                                    No users found
                                </p>
                            </div>
                        ) : (
                            /* User List */
                            <div className="divide-y divide-slate-100">
                                {groupChats.map((groupChat) => (
                                    <div
                                        key={groupChat._id}
                                        className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50/70"
                                    >
                                        {/* User Information */}
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                                                <span className="text-sm font-semibold text-slate-600">
                                                    {groupChat.groupName
                                                        ?.charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {groupChat.groupName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Chat */}
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/groupChat/${groupChat._id}`)}
                                            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50" title={`Chat ${groupChat.groupName}`}
                                        >
                                            <MessageCircle size={16} />

                                            <span className="hidden sm:inline">
                                                Chat
                                            </span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
            {/* Create Group Modal */}
            {showCreateGroup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                    onClick={handleClose}
                >
                    <div
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Create a Group
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Enter a name for your new group.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            <label
                                htmlFor="groupName"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Group name
                            </label>

                            <input
                                id="groupName"
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="e.g. Developers"
                                autoFocus
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                            {message && (
                                <div
                                    className={`mb-4 rounded-lg border p-3 text-sm `}
                                >
                                    {message}
                                </div>
                            )}
                            {/* Buttons */}
                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={!groupName.trim()}
                                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Create Group
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}