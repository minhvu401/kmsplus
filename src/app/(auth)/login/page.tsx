"use client"

import { useActionState, useState } from "react"
import { loginAction } from "@/action/auth/authActions"
import { getAllUsers } from "@/action/user/userActions"
import { type User } from "@/service/user.service"

const initialState = {
  success: false,
  message: "",
  errors: {},
}

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState)
  const [users, setUsers] = useState<User[]>([])
  const [showUsers, setShowUsers] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetAllUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const allUsers = await getAllUsers()
      setUsers(allUsers)
      setShowUsers(true)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch users"

      console.error("Failed to fetch users:", error)
      setError(errorMessage)

      // Nếu lỗi authentication, có thể redirect về login
      if (errorMessage.includes("Authentication required")) {
        setTimeout(() => {
          alert("⚠️ Please login first!")
        }, 100)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6 border rounded shadow space-y-4">
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

      {error && (
        <div className="p-3 rounded bg-red-100 text-red-700 border border-red-300">
          <strong>⚠️ Error:</strong> {error}
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

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Dev Tools</span>
        </div>
      </div>

      {/* Get All Users Button */}
      <button
        type="button"
        onClick={handleGetAllUsers}
        disabled={loading}
        className="bg-gray-600 text-white w-full p-2 rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "Loading..." : "🔍 Show All Users (Dev)"}
      </button>

      {/* Users List */}
      {showUsers && (
        <div className="mt-4 p-4 bg-gray-50 rounded border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">All Users ({users.length})</h3>
            <button
              onClick={() => setShowUsers(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ✕ Close
            </button>
          </div>

          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No users found</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-3 bg-white rounded border hover:border-blue-400 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{user.email}</p>
                      {user.full_name && (
                        <p className="text-xs text-gray-600">
                          {user.full_name}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 ml-2">
                      ID: {user.id.substring(0, 8)}
                    </span>
                  </div>
                  {user.created_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
