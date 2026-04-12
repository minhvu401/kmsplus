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
          "Thứ 2",
          "Thứ 3",
          "Thứ 4",
          "Thứ 5",
          "Thứ 6",
          "Thứ 7",
          "CN",
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
            label: `Tuần ${weekNum}`,
            value: weekNum.toString(),
          })
          weekNum++
        }
        return weeks
      }
      case "month": {
        // 12 months
        const monthNames = [
          "Tháng 1",
          "Tháng 2",
          "Tháng 3",
          "Tháng 4",
          "Tháng 5",
          "Tháng 6",
          "Tháng 7",
          "Tháng 8",
          "Tháng 9",
          "Tháng 10",
          "Tháng 11",
          "Tháng 12",
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
          label: `Năm ${year}`,
          value: year.toString(),
        }))
      }
      default:
        return []
    }
  }, [timePeriod])

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
          <span>Tốc độ tăng trưởng người dùng mới</span>
        </div>
      }
      extra={
        <Segmented
          value={timePeriod}
          onChange={(value) => setTimePeriod(value as TimePeriodType)}
          options={[
            { label: "Ngày", value: "day" },
            { label: "Tuần", value: "week" },
            { label: "Tháng", value: "month" },
            { label: "Năm", value: "year" },
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
              <XAxis dataKey="period" />
              <YAxis
                label={{
                  value: "Người dùng mới",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                }}
                formatter={(value) => [value, "Người dùng mới"]}
              />
              <Legend />
              <Bar dataKey="newUsers" fill="#52c41a" name="Người dùng mới" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
