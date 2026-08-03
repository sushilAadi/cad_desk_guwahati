import type { Metadata } from "next"

import { AppSidebar } from "@/components/admin/app-sidebar"

export const metadata: Metadata = {
  title: "Admin | CAD Desk Guwahati",
  description: "Leads and enquiry analytics for the CAD Desk Guwahati WhatsApp AI agent.",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
