/**
 * Dashboard Metrics Page
 * Displays role-specific metrics and analytics
 * Configured for all roles: Director, Training Manager, System Admin, Employee
 */

"use client"

import React, { useEffect, useState } from "react"
import { Row, Col, Spin, Alert, Divider, Tabs } from "antd"
import {
  LineChartOutlined,
  TeamOutlined,
  BookOutlined,
  SmileOutlined,
  FileTextOutlined,
  UsergroupAddOutlined,
  UserOutlined,
} from "@ant-design/icons"
import useUserStore from "@/store/useUserStore"
import useLanguageStore from "@/store/useLanguageStore"
import { Role } from "@/enum/role.enum"
import { t } from "@/lib/i18n"

// Director Components
import ActiveUsersChart from "./components/ActiveUsersChart"
import SystemAdoptionRateChart from "./components/SystemAdoptionRateChart"
import CourseCompletionRateCard from "./components/CourseCompletionRateCard"
import TopCategoriesChart from "./components/TopCategoriesChart"
import ContentRatingChart from "./components/ContentRatingChart"
import StatCard from "./components/StatCard"
import AISuggestionPanel from "@/components/AISuggestionPanel"

// Training Manager Components
import KnowledgeGapTable from "./components/KnowledgeGapTable"
import TrendingKeywordsCloud from "./components/TrendingKeywordsCloud"
import CourseDropoffRateChart from "./components/CourseDropoffRateChart"
import UnansweredQuestionsChart from "./components/UnansweredQuestionsChart"
import TopContributorsTable from "./components/TopContributorsTable"

// System Admin Components
import PendingItemsOverview from "./components/PendingItemsOverview"
import NewUsersGrowthChart from "./components/NewUsersGrowthChart"

// Employee Components
import MandatoryCoursesPanel from "./components/MandatoryCoursesPanel"
import PersonalLearningProgressPanel from "./components/PersonalLearningProgressPanel"
import ContributionStatsPanel from "./components/ContributionStatsPanel"

import { useAutoAISuggestion } from "@/components/hooks/useAutoAISuggestion"
import {
  getActiveUsersMetrics,
  getAdoptionRateMetrics,
  getCourseCompletionRateMetrics,
  getContentRatingMetrics,
  getCurrentAverageRatingAction,
} from "@/action/metrics/metricsActions"
import type {
  ActiveUsersData,
  AdoptionRateData,
  CourseCompletionRateData,
  ContentRatingData,
} from "@/service/metrics.service"

export default function DashboardMetricsPage() {
  const { user, userRole } = useUserStore()
  const { language } = useLanguageStore()
  const [loading, setLoading] = useState(true)
  const [activeUsers, setActiveUsers] = useState<ActiveUsersData[]>([])
  const [adoptionRate, setAdoptionRate] = useState<AdoptionRateData | null>(
    null
  )
  const [completionRate, setCompletionRate] =
    useState<CourseCompletionRateData | null>(null)
  const [avgRating, setAvgRating] = useState<number>(0)
  const [contentRating, setContentRating] = useState<ContentRatingData[]>([])

  // Auto-check and create suggestion when admin/director accesses dashboard
  const isAdmin = userRole === Role.ADMIN || userRole === Role.DIRECTOR
  useAutoAISuggestion(30, isAdmin)

  useEffect(() => {
    const fetchDirectorMetrics = async () => {
      try {
        setLoading(true)
        // Fetch all director metrics in parallel
        const [
          activeUsersData,
          adoptionRateData,
          completionRateData,
          contentRatingData,
        ] = await Promise.all([
          getActiveUsersMetrics(),
          getAdoptionRateMetrics(),
          getCourseCompletionRateMetrics(),
          getContentRatingMetrics(),
        ])

        setActiveUsers(activeUsersData)
        setAdoptionRate(adoptionRateData)
        setCompletionRate(completionRateData)
        setContentRating(contentRatingData)

        // Calculate average rating
        if (contentRatingData.length > 0) {
          const avg = await getCurrentAverageRatingAction(contentRatingData)
          setAvgRating(avg)
        }
      } catch (error) {
        console.error("Error fetching director metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch for director role
    if (isAdmin) {
      fetchDirectorMetrics()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    )
  }

  // Check if user has permission to access Dashboard Metrics
  const allowedRoles = [
    Role.DIRECTOR,
    Role.ADMIN,
    Role.TRAINING_MANAGER,
    Role.EMPLOYEE,
  ]
  const hasAccess = allowedRoles.includes(userRole as Role)
  if (!hasAccess) {
    return (
      <div className="p-6 bg-white m-6 rounded-lg">
        <Alert
          message={t("dashboard.metrics.access_denied", language)}
          description={t("dashboard.metrics.access_denied_desc", language)}
          type="warning"
          showIcon
          closable
        />
      </div>
    )
  }

  // Determine which dashboard to show based on role
  const isDirector = userRole === Role.DIRECTOR
  const isTrainingManager = userRole === Role.TRAINING_MANAGER
  const isSystemAdmin = userRole === Role.ADMIN
  const isEmployee = userRole === Role.EMPLOYEE

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* ==================== DIRECTOR DASHBOARD ==================== */}
      {isDirector && (
        <>
          {/* Page Header - Enhanced */}
          <div className="mb-8 animate-fadeInDown">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
                  {t("dashboard.director.title", language)}
                </h1>
                <p className="text-gray-600 mt-3 max-w-2xl leading-relaxed">
                  {t("dashboard.director.subtitle", language)}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <Divider style={{ borderColor: "rgba(24, 144, 255, 0.2)" }} />
            <Row gutter={[16, 16]} className="mt-6">
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  icon={<TeamOutlined />}
                  title={t("dashboard.metrics.active_users", language)}
                  value={String(adoptionRate?.activeUsers || 0)}
                  unit="users"
                  change={`${(completionRate?.change ?? 0) > 0 ? "+" : ""}${completionRate?.change ?? 0}%`}
                  positive={(completionRate?.change ?? 0) >= 0}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  icon={<LineChartOutlined />}
                  title={t("dashboard.metrics.adoption_rate", language)}
                  value={String(adoptionRate?.adoptionRate || 0)}
                  unit="%"
                  change={`${(adoptionRate?.adoptionRate ?? 0) > 50 ? "+" : ""}5%`}
                  positive={(adoptionRate?.adoptionRate ?? 0) > 50}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  icon={<BookOutlined />}
                  title={t("dashboard.metrics.completion_rate", language)}
                  value={String(completionRate?.completionRate || 0)}
                  unit="%"
                  change={`${(completionRate?.change ?? 0) > 0 ? "+" : ""}${completionRate?.change ?? 0}%`}
                  positive={(completionRate?.change ?? 0) >= 0}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  icon={<SmileOutlined />}
                  title={t("dashboard.metrics.avg_rating", language)}
                  value={String(avgRating.toFixed(1) || 0)}
                  unit="/ 5.0"
                  change="+0.2"
                  positive
                />
              </Col>
            </Row>
          </div>

          {/* AI Suggestion Panel */}
          <div className="mb-8 animate-fadeInDown">
            <AISuggestionPanel />
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
          <Row
            gutter={[20, 20]}
            className="mt-6 w-full animate-fadeInUp"
            style={{ animationDelay: "0.2s" }}
          >
            <Col xs={24} lg={12} className="transition-all duration-500">
              <CourseCompletionRateCard />
            </Col>
            <Col xs={24} lg={12} className="transition-all duration-500">
              <TopCategoriesChart />
            </Col>
          </Row>

          {/* Row 3: Content Rating - Full Width */}
          <Row
            gutter={[20, 20]}
            className="mt-6 w-full animate-fadeInUp"
            style={{ animationDelay: "0.4s" }}
          >
            <Col xs={24} className="transition-all duration-500">
              <ContentRatingChart />
            </Col>
          </Row>
        </>
      )}

      {/* ==================== TRAINING MANAGER DASHBOARD ==================== */}
      {isTrainingManager && (
        <>
          <div className="mb-8 animate-fadeInDown">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-900 bg-clip-text text-transparent">
                {t("dashboard.training_manager.title", language)}
              </h1>
              <p className="text-gray-600 mt-3 max-w-2xl leading-relaxed">
                {t("dashboard.training_manager.subtitle", language)}
              </p>
            </div>
          </div>

          {/* AI Suggestion Panel */}
          <div className="mb-8 animate-fadeInDown">
            <AISuggestionPanel />
          </div>

          {/* Row 1: Knowledge Gap & Trending Keywords */}
          <Row gutter={[20, 20]} className="w-full animate-fadeInUp">
            <Col xs={24} lg={12} className="transition-all duration-500">
              <KnowledgeGapTable />
            </Col>
            <Col xs={24} lg={12} className="transition-all duration-500">
              <TrendingKeywordsCloud />
            </Col>
          </Row>

          {/* Row 2: Course Dropoff & Unanswered Questions */}
          <Row gutter={[20, 20]} className="mt-6 w-full animate-fadeInUp">
            <Col xs={24} lg={12} className="transition-all duration-500">
              <CourseDropoffRateChart />
            </Col>
            <Col xs={24} lg={12} className="transition-all duration-500">
              <UnansweredQuestionsChart />
            </Col>
          </Row>

          {/* Row 3: Top Contributors & Learners */}
          <Row gutter={[20, 20]} className="mt-6 w-full animate-fadeInUp">
            <Col xs={24} className="transition-all duration-500">
              <TopContributorsTable />
            </Col>
          </Row>
        </>
      )}

      {/* ==================== SYSTEM ADMIN DASHBOARD ==================== */}
      {isSystemAdmin && (
        <>
          <div className="mb-8 animate-fadeInDown">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-900 bg-clip-text text-transparent">
                {t("dashboard.admin.title", language)}
              </h1>
              <p className="text-gray-600 mt-3 max-w-2xl leading-relaxed">
                {t("dashboard.admin.subtitle", language)}
              </p>
            </div>
          </div>

          {/* AI Suggestion Panel */}
          <div className="mb-8 animate-fadeInDown">
            <AISuggestionPanel />
          </div>

          {/* Row 1: Pending Items */}
          <Row gutter={[20, 20]} className="w-full animate-fadeInUp">
            <Col xs={24} className="transition-all duration-500">
              <PendingItemsOverview />
            </Col>
          </Row>

          {/* Row 2: New Users Growth */}
          <Row gutter={[20, 20]} className="mt-6 w-full animate-fadeInUp">
            <Col xs={24} className="transition-all duration-500">
              <NewUsersGrowthChart />
            </Col>
          </Row>
        </>
      )}

      {/* ==================== EMPLOYEE PERSONAL DASHBOARD ==================== */}
      {isEmployee && (
        <>
          <div className="mb-8 animate-fadeInDown">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-900 bg-clip-text text-transparent">
                {t("dashboard.employee.title", language)}
              </h1>
              <p className="text-gray-600 mt-3 max-w-2xl leading-relaxed">
                {t("dashboard.employee.subtitle", language)}
              </p>
            </div>
          </div>

          {/* Row 1: Mandatory Courses */}
          <Row gutter={[20, 20]} className="w-full animate-fadeInUp">
            <Col xs={24} className="transition-all duration-500">
              <MandatoryCoursesPanel />
            </Col>
          </Row>

          {/* Row 2: Personal Learning Progress */}
          <Row gutter={[20, 20]} className="mt-6 w-full animate-fadeInUp">
            <Col xs={24} className="transition-all duration-500">
              <PersonalLearningProgressPanel />
            </Col>
          </Row>

          {/* Row 3: Contribution Stats */}
          <Row gutter={[20, 20]} className="mt-6 w-full animate-fadeInUp">
            <Col xs={24} className="transition-all duration-500">
              <ContributionStatsPanel />
            </Col>
          </Row>
        </>
      )}
    </div>
  )
}
