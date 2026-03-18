"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Globe,
  FileText,
  Wrench,
  HeadphonesIcon,
  Package,
  Clock,
  Archive,
  Bell,
  BarChart3,
  Users,
  Upload,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Plane,
  LogOut,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  label: string
  items: NavItem[]
  adminOnly?: boolean
}

const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { href: "/", label: "Command Center", icon: LayoutDashboard },
      { href: "/regional-summary", label: "Regional Summary", icon: Globe },
    ],
  },
  {
    label: "Service Lines",
    items: [
      { href: "/contracts", label: "Contracts", icon: FileText },
      { href: "/technical-availability", label: "Technical Availability", icon: Wrench },
      { href: "/maintenance", label: "Maintenance", icon: Settings },
      { href: "/customer-support", label: "Customer Support", icon: HeadphonesIcon },
      { href: "/asset-availability", label: "Asset Availability", icon: Package },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/timeline", label: "Timeline", icon: Clock },
      { href: "/past-eis", label: "Past EIS", icon: Archive },
      { href: "/alerts", label: "Alerts", icon: Bell },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Admin",
    adminOnly: true,
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/import", label: "Import", icon: Upload },
      { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
    ],
  },
]

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 z-40",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center h-14 border-b border-sidebar-border shrink-0",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2ed573] to-[#00d4aa] flex items-center justify-center shrink-0">
              <Plane className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-mono tracking-[0.2em] text-sidebar-foreground/60 uppercase">
                  Rolls-Royce
                </span>
                <span className="text-sm font-semibold tracking-tight text-sidebar-accent-foreground">
                  EIS Control
                </span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCollapsed(true)}
              className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center py-2 border-b border-sidebar-border">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCollapsed(false)}
              className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map((group) => {
            if (group.adminOnly && !isAdmin) return null

            return (
              <div key={group.label}>
                {!collapsed && (
                  <div className="px-2 mb-1.5">
                    <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-sidebar-foreground/50">
                      {group.label}
                    </span>
                  </div>
                )}

                {collapsed && group.label !== "Main" && (
                  <div className="mx-2 mb-2 border-t border-sidebar-border" />
                )}

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href)
                    const Icon = item.icon

                    const linkContent = (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md text-sm font-medium transition-colors",
                          collapsed
                            ? "justify-center w-10 h-10 mx-auto"
                            : "px-2.5 py-2",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60"
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                        {active && !collapsed && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                        )}
                      </Link>
                    )

                    if (collapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>
                            {linkContent}
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8}>
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return (
                      <div key={item.href}>{linkContent}</div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Footer - User */}
        <div className="shrink-0 border-t border-sidebar-border p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center justify-center w-10 h-10 mx-auto rounded-md hover:bg-sidebar-accent transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[11px] font-bold text-white">
                    {userInitials}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <div className="text-xs">
                  <p className="font-medium">{session?.user?.name || "User"}</p>
                  <p className="opacity-70">Click to sign out</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-[10px] font-mono text-sidebar-foreground/60 uppercase">
                  {session?.user?.role || "User"}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Sign out
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
