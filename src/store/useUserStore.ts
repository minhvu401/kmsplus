import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getCurrentUserInfor } from "@/action/user/userActions" // Hàm lấy thông tin user hiện tại

interface User {
  id: string
  email: string
  full_name: string | null
  // role?: string
  department?: string
  avatar_url?: string
  created_at?: Date
}

interface UserStore {
  user: User | null
  setUser: (user: User | null) => void
  fetchUser: () => Promise<void>
  clearUser: () => void
}

const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }), // Cập nhật thông tin user trong store
      fetchUser: async () => {
        try {
          const user = await getCurrentUserInfor() // Lấy thông tin người dùng từ API
          set({ user })
        } catch (error) {
          console.error("Error fetching user:", error)
        }
      },
      clearUser: () => set({ user: null }), // Xóa thông tin user khỏi store
    }),
    {
      name: "user-storage", // key để lưu trong localStorage
      partialize: (state) => ({ user: state.user }), // Chỉ lưu field 'user'
    }
  )
)

export default useUserStore
