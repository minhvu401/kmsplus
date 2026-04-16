import { Geist, Geist_Mono, Lato } from "next/font/google"
import { Metadata } from "next"
import { AntdRegistry } from "@ant-design/nextjs-registry"
import "./globals.css"
import { RootProvider } from "./RootProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const lato = Lato({
  weight: ["100", "300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-lato",
})

export const metadata: Metadata = {
  title: "KMS Plus",
  description: "Knowledge Management System",
  icons: {
    icon: "/favico.png",
    apple: "/favico.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lato.variable} font-sans antialiased`}
        style={{ fontFamily: "var(--font-lato), sans-serif" }}
        suppressHydrationWarning
      >
        <AntdRegistry>
          <RootProvider>{children}</RootProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
