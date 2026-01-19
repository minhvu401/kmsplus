import { Suspense } from "react"
import { Spin } from "antd"
import UserManagementPageContent from "./page-content"

export default function UserManagementPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin />
        </div>
      }
    >
      <UserManagementPageContent />
    </Suspense>
  )
}
