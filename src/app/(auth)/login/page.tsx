"use client";

import { useActionState } from "react";
import { loginAction } from "@/action/auth/authActions";

const initialState = {
  success: false,
  message: "",
  errors: {},
};

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 border rounded shadow space-y-4">
      <h1 className="text-2xl font-bold text-center mb-4">Login</h1>

      {state.message && (
        <div
          className={`p-3 rounded ${
            state.success
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-3">
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="border p-2 w-full rounded"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="border p-2 w-full rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white w-full p-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
