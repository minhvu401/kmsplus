/**
 * Lazy-loaded Quill Editor component
 * Only loads when needed to reduce initial bundle size
 */

import dynamic from "next/dynamic"
import { Spin } from "antd"

// Dynamic import with loading state
const QuillEditor = dynamic(() => import("./QuillEditor"), {
  loading: () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "400px",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
      }}
    >
      <Spin tip="Loading editor..." />
    </div>
  ),
  ssr: false, // Don't render on server side
})

export default QuillEditor
