// src/app/(main)/layout.tsx
import PrivateLayout from "@/components/layout/PrivateLayout"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PrivateLayout>{children}</PrivateLayout>
}
