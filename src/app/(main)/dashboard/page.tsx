"use client"
// app/dashboard/page.tsx
// import PrivateLayout from "@/components/layout/PrivateLayout"
// import GeneralInfromation from "./components/GeneralInfromation"
// export default function DashboardPage() {
//   return <GeneralInfromation />
// }
import Link from "next/link"

export default function DashboardOverview() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      {/* --- TOP BAR: Search & User Actions --- */}
      <div className="flex justify-between items-center mb-8">
        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search courses, users, or settings..."
          />
        </div>

        {/* Notifications & Help */}
        <div className="flex items-center gap-3">
          <button className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-700 shadow-sm border">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
          <button className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-700 shadow-sm border">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* --- HEADER --- */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 mt-1">
            Good morning, Admin. Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* --- METRICS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Total Courses */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Courses</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">124</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>
          <p className="text-blue-600 text-sm font-medium flex items-center">
            <span className="mr-1">↗</span> 3 new this week
          </p>
        </div>

        {/* Card 2: Active Learners */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium">
                Active Learners
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">1,402</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-blue-600 text-sm font-medium flex items-center">
            <span className="mr-1">↗</span> +12% vs last month
          </p>
        </div>

        {/* Card 3: In Progress */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium">In Progress</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">38</h3>
            </div>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-gray-500 text-sm">Across 12 categories</p>
        </div>

        {/* Card 4: Completion Rate */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium">
                Completion Rate
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">84%</h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: "84%" }}
            ></div>
          </div>
        </div>
      </div>

      {/* --- NAVIGATION CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Nav 1: Course Management */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg h-fit">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                Course Management
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Create, edit & archive content
              </p>
            </div>
          </div>
          <Link
            href="/courses/manage"
            className="text-blue-600 font-semibold text-sm hover:underline flex items-center"
          >
            Go to Courses <span className="ml-1">→</span>
          </Link>
        </div>

        {/* Nav 2: User Management */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg h-fit">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                User Management
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Manage instructors & learners
              </p>
            </div>
          </div>
          <span className="text-purple-600 font-semibold text-sm cursor-pointer hover:underline flex items-center">
            View Users <span className="ml-1">→</span>
          </span>
        </div>

        {/* Nav 3: Enrollment & Progress (KEY ACTION) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 ring-1 ring-blue-100 flex flex-col justify-between h-48 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
            KEY ACTION
          </div>
          <div className="flex gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg h-fit">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                Enrollment & Progress
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Track detailed learner stats
              </p>
            </div>
          </div>
          <Link
            href="/courses/enrollments"
            className="text-blue-700 font-bold text-sm hover:underline flex items-center"
          >
            Open Tracker <span className="ml-1">→</span>
          </Link>
        </div>
      </div>

      {/* --- BOTTOM SECTION: CHART & LIST --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learner Activity Chart (Visual Mockup) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                Learner Activity
              </h3>
              <p className="text-gray-400 text-sm">
                Sessions over last 30 days
              </p>
            </div>
            <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2 focus:outline-none">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          {/* Mock Chart Area */}
          <div className="relative h-64 w-full flex items-end">
            {/* Chart Background Grid */}
            <div className="absolute inset-0 grid grid-rows-4 gap-0">
              <div className="border-b border-gray-50 border-dashed w-full h-full"></div>
              <div className="border-b border-gray-50 border-dashed w-full h-full"></div>
              <div className="border-b border-gray-50 border-dashed w-full h-full"></div>
              <div className="border-b border-gray-50 border-dashed w-full h-full"></div>
            </div>

            {/* Simple SVG Wave to mimic the chart */}
            <svg
              viewBox="0 0 100 40"
              className="w-full h-full z-10 drop-shadow-sm"
              preserveAspectRatio="none"
            >
              <path
                d="M0 35 Q 10 30, 20 32 T 40 25 T 60 15 T 80 20 T 100 10 V 40 H 0 Z"
                fill="rgba(37, 99, 235, 0.1)"
              />
              <path
                d="M0 35 Q 10 30, 20 32 T 40 25 T 60 15 T 80 20 T 100 10"
                fill="none"
                stroke="#2563eb"
                strokeWidth="0.5"
              />
            </svg>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </div>

        {/* Recent Enrollments List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-900">
              Recent Enrollments
            </h3>
            <span className="text-blue-600 text-sm font-semibold cursor-pointer">
              View All
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Header Row */}
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-2">
              <span>User</span>
              <span>Course</span>
              <span>Status</span>
            </div>

            {/* Item 1 */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <img
                  src="https://i.pravatar.cc/150?u=a"
                  alt="User"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-bold text-gray-900">Sarah M.</p>
                </div>
              </div>
              <div className="text-xs text-gray-600 font-medium w-20 truncate">
                UX Design 101
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                Active
              </span>
            </div>

            {/* Item 2 */}
            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <div className="flex items-center gap-3">
                <img
                  src="https://i.pravatar.cc/150?u=b"
                  alt="User"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-bold text-gray-900">James L.</p>
                </div>
              </div>
              <div className="text-xs text-gray-600 font-medium w-20 truncate">
                Python Adv.
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                Pending
              </span>
            </div>

            {/* Item 3 */}
            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <div className="flex items-center gap-3">
                <img
                  src="https://i.pravatar.cc/150?u=c"
                  alt="User"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-bold text-gray-900">Michael B.</p>
                </div>
              </div>
              <div className="text-xs text-gray-600 font-medium w-20 truncate">
                Data Sec
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                Active
              </span>
            </div>

            {/* Item 4 */}
            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <div className="flex items-center gap-3">
                <img
                  src="https://i.pravatar.cc/150?u=d"
                  alt="User"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-bold text-gray-900">Emily R.</p>
                </div>
              </div>
              <div className="text-xs text-gray-600 font-medium w-20 truncate">
                Marketing
              </div>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                Dropped
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
