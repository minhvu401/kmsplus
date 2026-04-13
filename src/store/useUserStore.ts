import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getCurrentUserInfor } from "@/action/user/userActions" // Hàm lấy thông tin user hiện tại

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url?: string
  created_at?: Date
}

interface UserStore {
  user: User | null
  userRole?: string
  setUser: (user: User | null) => void
  setUserRole: (role: string | undefined) => void
  fetchUser: () => Promise<void>
  clearUser: () => void
}

const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      userRole: undefined,
      setUser: (user) => {
        set({ user })
        // Also update localStorage immediately
        if (typeof window !== 'undefined') {
          if (user) {
            localStorage.setItem('user-storage', JSON.stringify({ state: { user, userRole: get().userRole }, version: 0 }))
          } else {
            localStorage.removeItem('user-storage')
          }
        }
      },
      setUserRole: (role) => set({ userRole: role }),
      fetchUser: async () => {
        // Nếu đã có user trong store (localStorage), không cần fetch lại
        if (!get().user) {
          try {
            const user = await getCurrentUserInfor() // API gọi khi không có user
            // Only set user if it's not null
            if (user) {
              set({ user })
            }
            // If user is null, it means fetch either failed or user not logged in
            // Don't throw error - let app continue
          } catch (error) {
            console.error("Error fetching user:", error)
            // Don't throw error, just log it
            // This allows the app to continue even if user fetch fails
          }
        }
      },
      clearUser: () => {
        set({ user: null, userRole: undefined })
        // Also clear localStorage immediately
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-storage')
        }
      },
    }),
    {
      name: "user-storage", // Lưu trong localStorage
      partialize: (state) => ({ user: state.user, userRole: state.userRole }), // Lưu user và userRole trong localStorage
    }
  )
)

export default useUserStore
