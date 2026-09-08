// components/ChatPageHeader.tsx
import {
  ArrowLeft,
  LogOut,
  UserCircle,
} from "lucide-react";

import { socket } from "../services/socket";
import { useNavigate } from "react-router-dom";

interface Props {
  title: string | null;
  subtitle: string;
  showBackButton?: boolean;
}

export default function ChatPageHeader({
  title,
  subtitle,
  showBackButton = false,
}: Props) {
  const navigate = useNavigate();

  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const role = currentUser.role;
  const isAdmin = role == "admin" ? true : false;

  const handleLogout = () => {
    socket.disconnect();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-4">

      {/* Left: Back arrow + Page title */}
      <div className="flex min-w-0 items-center gap-3">
        {showBackButton && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>

          <p className="mt-1 truncate text-sm text-slate-500">
            {subtitle}
          </p>
        </div>
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

        {isAdmin && (
          <>
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

            {/* Divider */}
            <div className="h-7 w-px bg-slate-200" />
          </>
        )}

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
  );
}