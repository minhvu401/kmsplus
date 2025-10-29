import type { MenuProps } from "antd"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import {
  DashboardOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons"
import { PageRoute } from "@/enum/page-route.enum"

// 1. Khai báo kiểu MenuItem
export type MenuItem = Required<MenuProps>["items"][number] & {
  route?: string
  children?: MenuItem[]
}

// 2. Custom Hook để quản lý Navigation (sử dụng useRouter)
const useNavigation = () => {
  const router = useRouter()
  const navigate = (route: string) => {
    router.push(route)
  }
  return { navigate }
}

// 3. Hàm tạo onClick handler (nhận navigate từ Hook)
const createClickHandler = (navigate: (route: string) => void) => {
  const handleClick = (route?: string) => {
    if (route) {
      return () => navigate(route)
    }
    return undefined
  }
  return handleClick
}

// 4. Hàm tạo danh sách menu items (Dữ liệu thô, KHÔNG DÙNG HOOKS)
const createMenuItems = (navigate: (route: string) => void): MenuItem[] => {
  const handleClick = createClickHandler(navigate)

  return [
    {
      // KHÔNG SET CỨNG KEY: Sử dụng route làm key
      key: PageRoute.DASHBOARD,
      icon: <DashboardOutlined />,
      label: "Dashboard",
      route: PageRoute.DASHBOARD,
      onClick: handleClick(PageRoute.DASHBOARD),
    },
    {
      // KHÔNG SET CỨNG KEY: Key cho SubMenu cần là một chuỗi duy nhất
      key: "operations_management",
      icon: <ThunderboltOutlined />,
      label: "Quản lý Vận hành",
      children: [
        {
          // KHÔNG SET CỨNG KEY: Sử dụng route làm key
          key: PageRoute.QUIZZES,
          icon: <SafetyCertificateOutlined />,
          label: "Công tác",
          route: PageRoute.QUIZZES,
          onClick: handleClick(PageRoute.QUIZZES),
        },
      ] as MenuItem[],
    },
    {
      key: PageRoute.ARTICLES,
      icon: <SettingOutlined />,
      label: "ARTICLES",
      route: PageRoute.ARTICLES,
      onClick: handleClick(PageRoute.ARTICLES),
    },
    {
      key: PageRoute.COURSES,
      icon: <SettingOutlined />,
      label: "COURSES",
      route: PageRoute.COURSES,
      onClick: handleClick(PageRoute.COURSES),
    },
    {
      key: PageRoute.QUESTIONS,
      icon: <SettingOutlined />,
      label: "QUESTIONS",
      route: PageRoute.QUESTIONS,
      onClick: handleClick(PageRoute.QUESTIONS),
    },
    {
      key: PageRoute.QUESTION_BANK,
      icon: <SettingOutlined />,
      label: "QUESTION_BANK",
      route: PageRoute.QUESTION_BANK,
      onClick: handleClick(PageRoute.QUESTION_BANK),
    },
    // Chú ý: Cần thêm các item thiếu trong bản sửa này (TeamOutlined, ToolOutlined, v.v.)
  ] as MenuItem[]
}

// 5. Export Hook để component Sidebar sử dụng (khuyên dùng)
export const useSidebarItems = () => {
  const { navigate } = useNavigation()
  // Sử dụng useMemo để đảm bảo items chỉ được tính toán lại khi navigate thay đổi
  const items = useMemo(() => createMenuItems(navigate), [navigate])
  return items
}

// 6. Export hàm thô (nếu cần)
export const getSidebarItems = (): MenuItem[] => {
  return createMenuItems(() => {})
}
