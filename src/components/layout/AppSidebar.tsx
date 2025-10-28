import React from "react"
import { Layout, Menu, Typography } from "antd"
import type { MenuProps } from "antd"
import {
  DashboardOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ToolOutlined,
  VideoCameraOutlined,
  AreaChartOutlined,
  SettingOutlined,
} from "@ant-design/icons"

const { Sider } = Layout
const { Title } = Typography

type MenuItem = Required<MenuProps>["items"][number]

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem
}

const sidebarItems: MenuItem[] = [
  getItem("Dashboard", "1", <DashboardOutlined />),

  getItem("Quản lý Vận hành", "sub1", <ThunderboltOutlined />, [
    getItem("Công tác", "2", <SafetyCertificateOutlined />),
    getItem("An toàn lao động", "3"),
  ]),

  getItem("Quản lý người dùng", "sub2", <TeamOutlined />, [
    getItem("Nhân lực", "4"),
    getItem("PT - TB - CCDC", "5", <ToolOutlined />),
  ]),

  getItem("Giám sát", "sub3", <VideoCameraOutlined />, [
    getItem("Camera 247", "6"),
    getItem("Thông số vận hành", "7", <AreaChartOutlined />),
  ]),

  getItem("Cài đặt", "8", <SettingOutlined />),
]

interface SidebarProps {
  collapsed: boolean
}

const AppSidebar: React.FC<SidebarProps> = ({ collapsed }) => {
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
        items={sidebarItems}
      />
    </Sider>
  )
}

export default AppSidebar
