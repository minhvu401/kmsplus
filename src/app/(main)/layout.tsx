// src/app/(main)/layout.tsx
// Force all pages in the (main) route group to be dynamic
// because they all require authentication which uses cookies
export const dynamic = 'force-dynamic'

import PrivateLayout from "@/components/layout/PrivateLayout"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PrivateLayout>{children}</PrivateLayout>
}
