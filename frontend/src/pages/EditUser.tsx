import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Save,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import api from "../services/api";



const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must not exceed 72 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must not exceed 80 characters"),

  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(255),

  currentPassword: z.string(),

  newPassword: z.string(),

  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  /*
   * Password fields are optional when the user
   * only wants to update name/email.
   */
  const changingPassword =
    data.currentPassword.length > 0 ||
    data.newPassword.length > 0 ||
    data.confirmPassword.length > 0;

  if (!changingPassword) {
    return;
  }

  if (!data.currentPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["currentPassword"],
      message: "Current password is required",
    });
  }

  if (!data.newPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["newPassword"],
      message: "New password is required",
    });
  } else {
    const result = passwordSchema.safeParse(
      data.newPassword
    );

    if (!result.success) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message:
          result.error.issues[0].message,
      });
    }
  }

  if (!data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "Please confirm your new password",
    });
  }

  if (
    data.newPassword &&
    data.confirmPassword &&
    data.newPassword !== data.confirmPassword
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "Passwords do not match",
    });
  }

  if (
    data.currentPassword &&
    data.newPassword &&
    data.currentPassword === data.newPassword
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["newPassword"],
      message:
        "New password must be different from your current password",
    });
  }
});

export default function EditUser() {
  const navigate = useNavigate();


  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error" | "">("");

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        setLoading(true);

        const response =
          await api.get("/users/me");

        const data = response.data;

        setName(data.name || "");
        setEmail(data.email || "");
      } catch (error) {
        console.error(error);

        setMessage(
          "Unable to load your account information."
        );

        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setErrors({});
    setMessage("");
    setMessageType("");

    const parsed = profileSchema.safeParse({
      name,
      email,
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};

      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;

        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }

    try {
      setSaving(true);

      const updateData: {
        name: string;
        email: string;
        currentPassword?: string;
        password?: string;
      } = {
        name: name.trim(),
        email: email.trim(),
      };

      /*
       * Only include password information when
       * the user actually wants to change it.
       */
      if (newPassword) {
        updateData.currentPassword =
          currentPassword;

        updateData.password =
          newPassword;
      }

      const response = await api.put(
        "/users/me",
        updateData
      );

      const updatedUser = response.data;



      /*
       * Clear password fields after successful update.
       */
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      /*
       * Keep localStorage synchronized.
       */
      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          id:
            updatedUser._id ||
            updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        })
      );

      setMessage(
        "Profile updated successfully!"
      );

      setMessageType("success");
    } catch (error: any) {
      console.error(error);

      setMessage(
        error?.response?.data?.message ||
          "Failed to update your profile."
      );

      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading your profile...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Header */}
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
                {name
                  ? name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Edit Profile
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Update your account information.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 px-6 py-6 sm:px-8"
          >

            {/* Message */}
            {message && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  messageType === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full Name
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  maxLength={80}
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                    errors.name
                      ? "border-red-500"
                      : "border-slate-200"
                  }`}
                />
              </div>

              {errors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  maxLength={255}
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                    errors.email
                      ? "border-red-500"
                      : "border-slate-200"
                  }`}
                />
              </div>

              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Section */}
            <div className="border-t border-slate-100 pt-6">

              <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-900">
                  Change Password
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Leave these fields empty if you don't
                  want to change your password.
                </p>
              </div>

              <div className="space-y-5">

                {/* Current Password */}
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Current Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="currentPassword"
                      type={
                        showCurrentPassword
                          ? "text"
                          : "password"
                      }
                      value={currentPassword}
                      onChange={(e) =>
                        setCurrentPassword(
                          e.target.value
                        )
                      }
                      autoComplete="current-password"
                      className={`w-full rounded-xl border py-3 pl-10 pr-12 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                        errors.currentPassword
                          ? "border-red-500"
                          : "border-slate-200"
                      }`}
                      placeholder="Enter current password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(
                          (prev) => !prev
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {errors.currentPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.currentPassword}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    New Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="newPassword"
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(
                          e.target.value
                        )
                      }
                      autoComplete="new-password"
                      maxLength={72}
                      className={`w-full rounded-xl border py-3 pl-10 pr-12 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                        errors.newPassword
                          ? "border-red-500"
                          : "border-slate-200"
                      }`}
                      placeholder="Enter new password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          (prev) => !prev
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {errors.newPassword ? (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.newPassword}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      8–72 characters, with at least one
                      uppercase letter, one lowercase
                      letter, and one number.
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Confirm New Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      autoComplete="new-password"
                      maxLength={72}
                      className={`w-full rounded-xl border py-3 pl-10 pr-12 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-slate-200"
                      }`}
                      placeholder="Confirm new password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) => !prev
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />

                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}