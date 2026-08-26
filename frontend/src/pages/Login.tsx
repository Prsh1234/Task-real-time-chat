import { useState } from "react";
import type { SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const handleLogin = async (
    e: SubmitEvent) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "/auth/login",
        {
          email,
          password
        }
      );

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      navigate("/chat");
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
        "Login failed"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-xl bg-white p-8 shadow"
      >
        <h1 className="mb-6 text-2xl font-bold">
          Login
        </h1>

        <input
          type="email"
          id="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="mb-4 w-full rounded-lg border p-3"
          required
        />

        <input
          type="password"
          placeholder="Password"
          id="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="mb-4 w-full rounded-lg border p-3"
          required
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 p-3 text-white"
        >
          Login
        </button>
      </form>
    </div>
  );
}