"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutGrid,
  Plane,
  Calendar,
  Bell,
  FileText,
  Settings,
  Users,
  Upload,
  ClipboardList,
  Search,
  ChevronDown,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

const mainNavItems = [
  { href: "/", label: "Command", icon: LayoutGrid },
  { href: "/airlines", label: "Fleet", icon: Plane },
  { href: "/timeline", label: "Timeline", icon: Calendar },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/reports", label: "Reports", icon: FileText },
]

const adminNavItems = [
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/import", label: "Data Import", icon: Upload },
  { href: "/admin/audit-log", label: "Audit Log", icon: ClipboardList },
]

export function MainNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [adminOpen, setAdminOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const adminRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const isAdmin = session?.user?.role === "ADMIN"
  const isAdminPage = pathname.startsWith("/admin")

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (adminRef.current && !adminRef.current.contains(event.target as Node)) {
        setAdminOpen(false)
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U"

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mr-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2ed573] to-[#00d4aa] flex items-center justify-center">
            <Plane className="w-4 h-4 text-background" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase">
              Rolls-Royce
            </span>
            <span className="text-sm font-semibold tracking-tight">
              EIS Control
            </span>
          </div>
        </Link>

        {/* Main Navigation */}
        <nav className="flex items-center gap-1">
          {mainNavItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-secondary-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search placeholder */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary border border-border text-muted-foreground text-sm">
          <Search className="w-4 h-4" />
          <span>Search...</span>
          <kbd className="ml-4 px-1.5 py-0.5 rounded bg-background text-[10px] font-mono border border-border">
            /
          </kbd>
        </div>

        {/* Admin Dropdown (only for ADMIN role) */}
        {isAdmin && (
          <div className="relative" ref={adminRef}>
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className={cn(
                "flex items-center gap-1 p-2 rounded-md transition-colors",
                isAdminPage || adminOpen
                  ? "bg-primary/20 text-primary"
                  : "text-secondary-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Settings className="w-4 h-4" />
              <ChevronDown className={cn("w-3 h-3 transition-transform", adminOpen && "rotate-180")} />
            </button>

            {adminOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-secondary border border-border shadow-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-border">
                  <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
                    Administration
                  </span>
                </div>
                <div className="p-1">
                  {adminNavItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setAdminOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                          isActive
                            ? "bg-primary/20 text-primary"
                            : "text-secondary-foreground hover:text-foreground hover:bg-background"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 pl-2 border-l border-border"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
              {userInitials}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm">{session?.user?.name || "User"}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </div>
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-secondary border border-border shadow-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">{session?.user?.role}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-secondary-foreground hover:text-foreground hover:bg-background w-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
