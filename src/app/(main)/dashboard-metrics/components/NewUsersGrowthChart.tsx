"use client"

import React, { useEffect, useState, useMemo } from "react"
import { Card, Spin, Segmented, Select } from "antd"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { UserAddOutlined } from "@ant-design/icons"
import { getNewUsersGrowthMetrics } from "@/action/metrics/metricsActions"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"
import type {
  NewUsersGrowthData,
  TimePeriodType,
} from "@/service/metrics.service"

export default function NewUsersGrowthChart() {
  const { language } = useLanguageStore()
  const [data, setData] = useState<NewUsersGrowthData[]>([])
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriodType>("week")

  // Selected values for each period type
  const [selectedDay, setSelectedDay] = useState<string>("")
  const [selectedWeek, setSelectedWeek] = useState<string>("1")
  const [selectedMonth, setSelectedMonth] = useState<string>("4")
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  )

  // Generate dropdown options based on timePeriod
  const dropdownOptions = useMemo(() => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1

    switch (timePeriod) {
      case "day": {
        // 7 days of current week
        const first = today.getDate() - today.getDay() + 1
        const dayNames = [
          t("dashboard.metrics.day_monday", language),
          t("dashboard.metrics.day_tuesday", language),
          t("dashboard.metrics.day_wednesday", language),
          t("dashboard.metrics.day_thursday", language),
          t("dashboard.metrics.day_friday", language),
          t("dashboard.metrics.day_saturday", language),
          t("dashboard.metrics.day_sunday", language),
        ]
        return dayNames.map((name, i) => {
          const day = new Date(today)
          day.setDate(first + i)
          const dateStr = day.toISOString().split("T")[0]
          return {
            label: `${name} (${day.getDate()}/${day.getMonth() + 1})`,
            value: dateStr,
          }
        })
      }
      case "week": {
        // Weeks in current month
        const weeks = []
        const firstDay = new Date(currentYear, currentMonth - 1, 1)
        const lastDay = new Date(currentYear, currentMonth, 0)
        let weekNum = 1

        for (
          let d = new Date(firstDay);
          d <= lastDay;
          d.setDate(d.getDate() + 7)
        ) {
          weeks.push({
            label: `${t("dashboard.metrics.week_label", language)} ${weekNum}`,
            value: weekNum.toString(),
          })
          weekNum++
        }
        return weeks
      }
      case "month": {
        // 12 months
        const monthNames = [
          t("dashboard.metrics.month_1", language),
          t("dashboard.metrics.month_2", language),
          t("dashboard.metrics.month_3", language),
          t("dashboard.metrics.month_4", language),
          t("dashboard.metrics.month_5", language),
          t("dashboard.metrics.month_6", language),
          t("dashboard.metrics.month_7", language),
          t("dashboard.metrics.month_8", language),
          t("dashboard.metrics.month_9", language),
          t("dashboard.metrics.month_10", language),
          t("dashboard.metrics.month_11", language),
          t("dashboard.metrics.month_12", language),
        ]
        return monthNames.map((name, i) => ({
          label: name,
          value: (i + 1).toString(),
        }))
      }
      case "year": {
        // 3 years: prev, last year, current
        const years = [currentYear - 2, currentYear - 1, currentYear]
        return years.map((year) => ({
          label: `${t("dashboard.metrics.year_label", language)} ${year}`,
          value: year.toString(),
        }))
      }
      default:
        return []
    }
  }, [timePeriod, language])

  // Initialize selected value when period changes
  useEffect(() => {
    if (dropdownOptions.length > 0) {
      const lastOption = dropdownOptions[dropdownOptions.length - 1]
      if (timePeriod === "day") {
        setSelectedDay(lastOption.value)
      } else if (timePeriod === "week") {
        setSelectedWeek(lastOption.value)
      } else if (timePeriod === "month") {
        setSelectedMonth(lastOption.value)
      } else if (timePeriod === "year") {
        setSelectedYear(lastOption.value)
      }
    }
  }, [timePeriod, dropdownOptions])

  const getSelectedValue = () => {
    switch (timePeriod) {
      case "day":
        return selectedDay
      case "week":
        return selectedWeek
      case "month":
        return selectedMonth
      case "year":
        return selectedYear
      default:
        return ""
    }
  }

  // Custom formatter for X-axis labels based on timePeriod
  const formatXAxisLabel = (value: string) => {
    if (timePeriod === "month") {
      // For month view, data is daily (format: "13/3", "14/3", etc)
      // Keep as-is or can be enhanced to show day name
      return value
    } else if (timePeriod === "day") {
      // Map Vietnamese day names to translation keys
      const dayMap: { [key: string]: string } = {
        "Thứ 2": "dashboard.metrics.day_monday",
        "Thứ 3": "dashboard.metrics.day_tuesday",
        "Thứ 4": "dashboard.metrics.day_wednesday",
        "Thứ 5": "dashboard.metrics.day_thursday",
        "Thứ 6": "dashboard.metrics.day_friday",
        "Thứ 7": "dashboard.metrics.day_saturday",
        CN: "dashboard.metrics.day_sunday",
      }

      // Extract day name from format like "Thứ 2 (20/4)"
      for (const [viDay, key] of Object.entries(dayMap)) {
        if (value.includes(viDay)) {
          const dayName = t(key, language)
          const dateMatch = value.match(/\(\d+\/\d+\)/)
          return dateMatch ? `${dayName} ${dateMatch[0]}` : dayName
        }
      }
    } else if (timePeriod === "week") {
      // Extract week number from format like "Tuần 1" or "Week 1"
      const match = value.match(/\d+/)
      if (match) {
        const weekNum = parseInt(match[0])
        return `${t("dashboard.metrics.week_label", language)} ${weekNum}`
      }
    } else if (timePeriod === "year") {
      // Map Vietnamese month names to month numbers
      const monthMap: { [key: string]: number } = {
        "Tháng 1": 1,
        "Tháng 2": 2,
        "Tháng 3": 3,
        "Tháng 4": 4,
        "Tháng 5": 5,
        "Tháng 6": 6,
        "Tháng 7": 7,
        "Tháng 8": 8,
        "Tháng 9": 9,
        "Tháng 10": 10,
        "Tháng 11": 11,
        "Tháng 12": 12,
      }

      // Find the month number and translate
      for (const [viMonth, monthNum] of Object.entries(monthMap)) {
        if (value.includes(viMonth)) {
          return t(`dashboard.metrics.month_${monthNum}`, language)
        }
      }
    }

    return value
  }

  // Custom Tooltip Component
  const CustomTooltip = (props: any) => {
    const { active, payload } = props
    if (active && payload && payload.length > 0) {
      const data = payload[0]
      const translatedPeriod = formatXAxisLabel(data.payload.period)
      return (
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: "0 0 4px 0", color: "#333" }}>
            {translatedPeriod}
          </p>
          <p style={{ margin: 0, color: "#52c41a" }}>
            {t("dashboard.metrics.new_users", language)}: {data.value}
          </p>
        </div>
      )
    }
    return null
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const selectedValue = getSelectedValue()
        const result = await getNewUsersGrowthMetrics(timePeriod, selectedValue)
        setData(result)
      } catch (error) {
        console.error("Error loading new users growth:", error)
      } finally {
        setLoading(false)
      }
    }

    if (getSelectedValue()) {
      loadData()
    }
  }, [timePeriod, selectedDay, selectedWeek, selectedMonth, selectedYear])

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <UserAddOutlined className="text-green-600 text-lg" />
          <span>{t("dashboard.metrics.new_users_growth", language)}</span>
        </div>
      }
      extra={
        <Segmented
          value={timePeriod}
          onChange={(value) => setTimePeriod(value as TimePeriodType)}
          options={[
            { label: t("dashboard.filter_day", language), value: "day" },
            { label: t("dashboard.filter_week", language), value: "week" },
            { label: t("dashboard.filter_month", language), value: "month" },
            { label: t("dashboard.filter_year", language), value: "year" },
          ]}
        />
      }
      className="h-full shadow-md border-0"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          {t("dashboard.metrics.no_data", language)}
        </div>
      ) : (
        <div>
          {dropdownOptions.length > 0 && (
            <div className="mb-4 flex justify-end">
              <Select
                style={{ width: 135 }}
                value={getSelectedValue()}
                onChange={(value) => {
                  if (timePeriod === "day") setSelectedDay(value)
                  else if (timePeriod === "week") setSelectedWeek(value)
                  else if (timePeriod === "month") setSelectedMonth(value)
                  else if (timePeriod === "year") setSelectedYear(value)
                }}
                options={dropdownOptions}
              />
            </div>
          )}
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tickFormatter={formatXAxisLabel} />
              <YAxis
                label={{
                  value: t("dashboard.metrics.new_users", language),
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="newUsers"
                fill="#52c41a"
                name={t("dashboard.metrics.new_users", language)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
