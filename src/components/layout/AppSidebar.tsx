import React from "react"
import { Layout, Menu, Typography } from "antd"
import { useRouter } from "next/navigation"
import { useSidebarItems } from "@/config/SidebarConfig" // Đảm bảo đúng đường dẫn
import type { MenuProps } from "antd"
import { PageRoute } from "@/enum/page-route.enum"

const { Sider } = Layout
const { Title } = Typography

interface SidebarProps {
  collapsed: boolean
}

const AppSidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const sidebarItems = useSidebarItems()

  const router = useRouter()

  const handleBackToHomePage = () => {
    router.push(PageRoute.DASHBOARD)
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={250}
      style={{
        borderRight: "1px solid #f0f0f0",
        backgroundColor: "white",
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 10px",
        }}
      >
        <Title
          level={5}
          style={{
            color: "rgba(0, 0, 0, 0.88)",
            margin: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            cursor: "pointer",
          }}
          onClick={() => {
            handleBackToHomePage()
          }}
        >
          {collapsed ? "KMS" : "KMSPlus"}
        </Title>
      </div>
      <Menu
        theme="light"
        mode="inline"
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={["sub1"]}
        items={sidebarItems} // Sử dụng sidebarItems từ hook
        style={{
          borderRight: "none",
        }}
      />
    </Sider>
  )
}

export default AppSidebar
