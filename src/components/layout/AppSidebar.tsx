import React, { useEffect, useState } from "react"
import { Layout, Menu, Typography, Tooltip } from "antd"
import { useRouter, usePathname } from "next/navigation"
import { useSidebarItems } from "@/config/SidebarConfig"
import type { MenuProps } from "antd"
import { PageRoute } from "@/enum/page-route.enum"
import { Role } from "@/enum/role.enum"
import { LeftOutlined, RightOutlined } from "@ant-design/icons"

const { Sider } = Layout
const { Title, Text } = Typography

// Sidebar width constants - exported for use in layout
export const SIDEBAR_WIDTH = 260
export const SIDEBAR_COLLAPSED_WIDTH = 80

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const AppSidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const [userRole, setUserRole] = useState<Role | undefined>(undefined)
  const [isHeadOfDepartment, setIsHeadOfDepartment] = useState<boolean>(false)


  // Get user role from JWT token on component mount
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          // Try both data.role and data.user.role
          const roleFromAPI = data.role || data.user?.role
          if (roleFromAPI) {
            const roleValue = Object.values(Role).find(
              (r) => r === roleFromAPI
            ) as Role | undefined
            setUserRole(roleValue)

           // Lấy id của user hiện tại
            const currentUserId = data.id || data.user?.id
            // Lấy head_of_department_id từ object department (nếu API có trả về)
            const hodId =
              data.department?.head_of_department_id ||
              data.user?.department?.head_of_department_id

            // User là HOD nếu API trả cờ boolean có sẵn HOẶC currentUserId trùng với hodId
            const isHead =
              data.is_head_of_department ||
              data.user?.is_head_of_department ||
              (currentUserId && hodId && Number(currentUserId) === Number(hodId)) ||
              false
            // THÊM CONSOLE LOG VÀO ĐÂY ĐỂ DEBUG
            console.log("DEBUG HoD:", {
              currentUserId,
              hodId,
              isHead,
              apiData: data 
            });
            setIsHeadOfDepartment(Boolean(isHead))
          }
        }
      } catch (error) {
        console.error("Error loading user role:", error)
      }
    }
    loadUserRole()
  }, [])

  const sidebarItems = useSidebarItems(userRole, isHeadOfDepartment)
  const router = useRouter()
  const pathname = usePathname()

  const handleBackToHomePage = () => {
    router.push(PageRoute.DASHBOARD_METRICS)
  }

  // Determine active menu key based on current pathname
  const getSelectedKeys = (): string[] => {
    const path = pathname || ""
    // Find exact match or parent path, sorted by length (longest first) for specificity
    const keys = Object.values(PageRoute)
      .filter((route) => path === route || path.startsWith(route + "/"))
      .sort((a, b) => b.length - a.length) // Sort by length descending (more specific routes first)
    return keys.length > 0 ? [keys[0]] : [PageRoute.DASHBOARD_METRICS]
  }

  return (
    <>
      {/* Toggle Button - Outside Sider to avoid overflow:hidden clipping */}
      <Tooltip title={collapsed ? "Mở rộng" : "Thu gọn"} placement="right">
        <button
          onClick={onToggle}
          style={{
            position: "fixed",
            top: 76,
            left: collapsed ? SIDEBAR_COLLAPSED_WIDTH - 12 : SIDEBAR_WIDTH - 12,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "white",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 1001,
            transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          className="hover:bg-blue-50 hover:border-blue-300 hover:shadow-md"
        >
          {collapsed ? (
            <RightOutlined style={{ fontSize: 10, color: "#64748b" }} />
          ) : (
            <LeftOutlined style={{ fontSize: 10, color: "#64748b" }} />
          )}
        </button>
      </Tooltip>

      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={SIDEBAR_WIDTH}
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          borderRight: "1px solid #e2e8f0",
          boxShadow: "2px 0 12px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Scrollable content wrapper */}
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Logo Section */}
          <div
            style={{
              height: 64,
              minHeight: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "0" : "0 20px",
              borderBottom: "1px solid #e2e8f0",
              background: "white",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onClick={handleBackToHomePage}
          >
            <Tooltip
              title={collapsed ? "KMSPlus - Knowledge Management" : ""}
              placement="right"
            >
              <img
                src="/logo.png"
                alt="KMSPlus Logo"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  objectFit: "contain",
                  flexShrink: 0,
                  transition: "transform 0.2s ease",
                }}
                className="hover:scale-105"
              />
            </Tooltip>
            {!collapsed && (
              <div style={{ marginLeft: 12, overflow: "hidden" }}>
                <Title
                  level={5}
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#1e293b",
                    whiteSpace: "nowrap",
                  }}
                >
                  KMSPlus
                </Title>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    whiteSpace: "nowrap",
                  }}
                >
                  Knowledge Management
                </Text>
              </div>
            )}
          </div>

          {/* Menu Section - Scrollable */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              paddingBottom: collapsed ? 16 : 60,
            }}
            className="custom-scrollbar"
          >
            <Menu
              theme="light"
              mode="inline"
              inlineCollapsed={collapsed}
              selectedKeys={getSelectedKeys()}
              items={sidebarItems}
              style={{
                borderRight: "none",
                padding: collapsed ? "12px 4px" : "12px 8px",
                background: "transparent",
                fontWeight: 500,
              }}
              className={`custom-sidebar-menu ${collapsed ? "collapsed-menu" : ""}`}
            />
          </div>

          {/* Footer Section */}
          {!collapsed && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "12px 20px",
                borderTop: "1px solid #e2e8f0",
                background: "white",
              }}
            >
              <Text style={{ fontSize: 11, color: "#94a3b8" }}>
                © 2026 KMSPlus v1.0
              </Text>
            </div>
          )}
        </div>
      </Sider>
    </>
  )
}

export default AppSidebar
