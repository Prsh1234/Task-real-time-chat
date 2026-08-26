import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { SubmitEvent } from "react";
import { z } from "zod";
import api from "../services/api";

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(255),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

const signUpSchema = signInSchema.extend({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80),
});

export default function Auth() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrors({});
    setMessage("");
    setMessageType("");

    const schema =
      tab === "signin"
        ? signInSchema
        : signUpSchema;

    const parsed = schema.safeParse(form);

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

    setLoading(true);

    try {
      if (tab === "signin") {
        const response = await api.post("/auth/login", {
          email: form.email,
          password: form.password,
        });

        localStorage.setItem(
          "token",
          response.data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        setMessage("Login successful!");
        setMessageType("success");
    if (response.data.user.role === "admin") {
      navigate("/admin");
      return;
    }

    navigate("/chat");
        navigate("/chat");
      } else {
        await api.post("/auth/register", {
          name: form.name,
          email: form.email,
          password: form.password,
        });

        setMessage(
          "Registration successful! Please sign in."
        );
        setMessageType("success");

        setForm({
          name: "",
          email: "",
          password: "",
        });

        setTab("signin");
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Something went wrong"
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (
    value: "signin" | "signup"
  ) => {
    setTab(value);
    setErrors({});
    setMessage("");
    setMessageType("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md">

        <Link
          to="/"
          className="mb-8 flex items-center justify-center"
        >
          <span className="text-2xl font-bold text-gray-900">
            Real-Time{" "}
            <span className="text-blue-600">
              Chat
            </span>
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-xl bg-white p-8 shadow-lg">

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {tab === "signin"
                ? "Welcome back"
                : "Create your account"}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {tab === "signin"
                ? "Sign in to continue chatting with your friends."
                : "Create an account and start chatting in real time."}
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => switchTab("signin")}
              className={`rounded-md py-2 text-sm font-medium transition ${
                tab === "signin"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => switchTab("signup")}
              className={`rounded-md py-2 text-sm font-medium transition ${
                tab === "signup"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-4 rounded-lg border p-3 text-sm ${
                messageType === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Name - Signup only */}
            {tab === "signup" && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  maxLength={80}
                  autoComplete="name"
                  className={`w-full rounded-lg border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                    errors.name
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />

                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                maxLength={255}
                autoComplete="email"
                className={`w-full rounded-lg border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                  errors.email
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />

              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                maxLength={72}
                autoComplete={
                  tab === "signin"
                    ? "current-password"
                    : "new-password"
                }
                className={`w-full rounded-lg border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                  errors.password
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />

              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 p-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : tab === "signin"
                ? "Sign In"
                : "Create Account"}
            </button>

          </form>


        </div>
      </div>
    </div>
  );
}