"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  LayoutDashboard,
  MessageCircle,
  PhoneCall,
  Settings,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/conversations", label: "Conversations", icon: MessageCircle },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/callbacks", label: "Callback requests", icon: PhoneCall },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-64 shrink-0 flex-col border-r px-3 py-4 md:flex">
      <div className="flex items-center gap-2 px-2 pb-6">
        <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold">
          CD
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">CAD Desk Guwahati</span>
          <span className="text-muted-foreground text-xs">Admin panel</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="text-muted-foreground px-2 pt-4 text-xs">
        Noonmati Centre &middot; WhatsApp AI Agent
      </div>
    </aside>
  )
}
