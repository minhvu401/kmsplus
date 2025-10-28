import { ReactNode } from 'react';
import PublicLayout from "@/components/layout/PublicLayout"

export default function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  return <PublicLayout>{children}</PublicLayout>
}
