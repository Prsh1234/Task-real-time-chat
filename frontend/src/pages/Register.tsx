import { useState } from "react";
import type { SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (
    e: SubmitEvent
  ) => {
    e.preventDefault();

    try {
      await api.post("/auth/register", {
        name,
        email,
        password
      });

      alert("Registration successful");

      navigate("/");
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
        "Registration failed"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md rounded-xl bg-white p-8 shadow"
      >
        <h1 className="mb-6 text-2xl font-bold">
          Register
        </h1>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className="mb-4 w-full rounded-lg border p-3"
          required
        />

        <input
          type="email"
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
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="mb-4 w-full rounded-lg border p-3"
          required
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-green-600 p-3 text-white"
        >
          Register
        </button>
      </form>
    </div>
  );
}