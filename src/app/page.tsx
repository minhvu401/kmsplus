"use client"

import { redirect } from "next/navigation"

// Đường dẫn này ĐÚNG với tên file "button.tsx"
// import Button from "@/components/ui/button"

export default function Home() {
  // Redirect to login page
  redirect("/login")
  //test thử button khi click
  // const handleButtonClick = () => {
  //   alert("Button đã hoạt động!")
  // }

  // return (
  //   // THAY THẾ LAYOUT PHỨC TẠP BẰNG LAYOUT FLEXBOX ĐƠN GIẢN NÀY
  //   // Mục đích là chỉ để căn giữa button ra màn hình cho dễ thấy
  //   <div className="flex justify-center items-center min-h-screen">
  //     {/* <Button onClick={handleButtonClick}>
  //       Save Changes
  //     </Button> */}
  //   </div>
  // )
}
