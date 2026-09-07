import { useEffect, useState } from "react";
import {
  Trash2,
  Users,
  Loader2,
  UserCircle,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAdminUsers,
  deleteUser,
  type User,
} from "../api/user.api";

const AdminUsers = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);
  const [error, setError] = useState("");

  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminUsers();

      setUsers(data);
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
    loadUsers();
  }, []);

  const handleDelete = async (user: User) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?\n\n` +
        "This will also permanently delete all of their chat messages."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(user._id);
      setError("");

      await deleteUser(user._id);

      setUsers((currentUsers) =>
        currentUsers.filter(
          (currentUser) =>
            currentUser._id !== user._id
        )
      );
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          "Failed to delete user"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

return (
  <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
        {/* Left: Page title */}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Users
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage registered users and their accounts.
          </p>
        </div>

        {/* Right: User actions */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Chat */}
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 sm:px-3"
            title="Community Chat"
          >
            <MessageCircle size={18} />

            <span className="hidden sm:inline">
              Chat
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

            <div className="hidden text-left sm:block">
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
                Registered Users
              </p>

              <p className="text-xs text-slate-400">
                Users excluding your admin account
              </p>
            </div>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {users.length}{" "}
            {users.length === 1 ? "user" : "users"}
          </span>
        </div>

        {/* Empty State */}
        {users.length === 0 ? (
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

            <p className="mt-1 text-sm text-slate-500">
              There are no other users to manage.
            </p>
          </div>
        ) : (
          /* User List */
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50/70"
              >
                {/* User Information */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <span className="text-sm font-semibold text-slate-600">
                      {user.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user.name}
                    </p>

                    <p className="truncate text-sm text-slate-500">
                      {user.email}
                    </p>

                    <div className="mt-1">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-500">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delete */}
                <button
                  type="button"
                  disabled={
                    deletingId === user._id
                  }
                  onClick={() =>
                    handleDelete(user)
                  }
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title={`Delete ${user.name}`}
                >
                  {deletingId === user._id ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={16} />
                  )}

                  <span className="hidden sm:inline">
                    Delete
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default AdminUsers;