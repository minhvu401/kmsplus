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
      setUser: (user) => set({ user }),
      setUserRole: (role) => set({ userRole: role }),
      fetchUser: async () => {
        // Nếu đã có user trong store (localStorage), không cần fetch lại
        if (!get().user) {
          try {
            const user = await getCurrentUserInfor() // API gọi khi không có user
            set({ user })
          } catch (error) {
            console.error("Error fetching user:", error)
          }
        }
      },
      clearUser: () => set({ user: null, userRole: undefined }),
    }),
    {
      name: "user-storage", // Lưu trong localStorage
      partialize: (state) => ({ user: state.user, userRole: state.userRole }), // Lưu user và userRole trong localStorage
    }
  )
)

export default useUserStore
