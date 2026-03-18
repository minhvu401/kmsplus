/**
 * Dashboard Metrics Page
 * Displays role-specific metrics and analytics
 * Currently configured for Director and System Admin roles
 */

"use client"

import React, { useEffect, useState } from "react"
import { Row, Col, Spin, Empty, Alert, Divider } from "antd"
import { LineChartOutlined, TeamOutlined, BookOutlined, SmileOutlined } from "@ant-design/icons"
import useUserStore from "@/store/useUserStore"
import { Role } from "@/enum/role.enum"
import ActiveUsersChart from "./components/ActiveUsersChart"
import SystemAdoptionRateChart from "./components/SystemAdoptionRateChart"
import CourseCompletionRateCard from "./components/CourseCompletionRateCard"
import TopCategoriesChart from "./components/TopCategoriesChart"
import ContentRatingChart from "./components/ContentRatingChart"
import StatCard from "./components/StatCard"

export default function DashboardMetricsPage() {
  const { user, userRole } = useUserStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    )
  }

  // Check if user has permission to access Dashboard Metrics
  const allowedRoles = [Role.DIRECTOR, Role.ADMIN]
  const hasAccess = allowedRoles.includes(userRole as Role)
  
  if (!hasAccess) {
    return (
      <div className="p-6 bg-white m-6 rounded-lg">
        <Alert
          message="Access Denied"
          description="Dashboard Metrics is only available for Director and System Administrator roles."
          type="warning"
          showIcon
          closable
        />
      </div>
    )
  }

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Page Header - Enhanced */}
      <div className="mb-8 animate-fadeInDown">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
              Dashboard Metrics
            </h1>
            <p className="text-gray-600 mt-3 max-w-2xl leading-relaxed">
              Real-time performance analytics and insights for organizational effectiveness. Monitor adoption, engagement, and training impact across your organization.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <Divider style={{ borderColor: "rgba(24, 144, 255, 0.2)" }} />
        <Row gutter={[16, 16]} className="mt-6">
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={<TeamOutlined />}
              title="Active Users"
              value="847"
              unit="users"
              change="+12%"
              positive
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={<LineChartOutlined />}
              title="Adoption Rate"
              value="68"
              unit="%"
              change="+5%"
              positive
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={<BookOutlined />}
              title="Completion Rate"
              value="72"
              unit="%"
              change="+4%"
              positive
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={<SmileOutlined />}
              title="Avg Rating"
              value="4.5"
              unit="/ 5.0"
              change="+0.2"
              positive
            />
          </Col>
        </Row>
      </div>

      {/* Main Charts Grid */}
      <Row gutter={[20, 20]} className="w-full animate-fadeInUp">
        {/* Row 1: Active Users & Adoption Rate */}
        <Col xs={24} lg={12} className="transition-all duration-500">
          <ActiveUsersChart />
        </Col>
        <Col xs={24} lg={12} className="transition-all duration-500">
          <SystemAdoptionRateChart />
        </Col>
      </Row>

      {/* Row 2: Course Completion Rate & Top Categories */}
      <Row gutter={[20, 20]} className="mt-6 w-full animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
        <Col xs={24} lg={12} className="transition-all duration-500">
          <CourseCompletionRateCard />
        </Col>
        <Col xs={24} lg={12} className="transition-all duration-500">
          <TopCategoriesChart />
        </Col>
      </Row>

      {/* Row 3: Content Rating - Full Width */}
      <Row gutter={[20, 20]} className="mt-6 w-full animate-fadeInUp" style={{ animationDelay: "0.4s" }}>
        <Col xs={24} className="transition-all duration-500">
          <ContentRatingChart />
        </Col>
      </Row>
    </div>
  )
}
