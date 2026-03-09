"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Users, Search, Plus, Shield, Eye, Edit3, Trash2, MoreHorizontal, Mail, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface User {
  id: string
  username: string
  displayName: string
  email: string | null
  role: string
  isActive: boolean
  createdAt: string
}

interface Props {
  users: User[]
}

const roleConfig: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Administrator", color: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
  EDITOR: { label: "EIS Lead", color: "bg-teal-500/20 text-teal-400 border border-teal-500/30" },
  VIEWER: { label: "Viewer", color: "bg-slate-500/20 text-slate-400 border border-slate-500/30" },
}

export function AdminUsersClient({ users }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filtered = users.filter(u => {
    const matchesSearch = u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <>
      <header className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">Administration</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#00d4aa] hover:bg-[#00d4aa]/90 text-[#08090a]"><Plus className="w-4 h-4" /> Add User</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription className="text-muted-foreground">Create a new user account with the specified role.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="displayName">Display Name</Label><Input id="displayName" placeholder="John Doe" className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" placeholder="jdoe" className="bg-secondary border-border" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="j.doe@rolls-royce.com" className="bg-secondary border-border" /></div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select><SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                      <SelectItem value="EDITOR">EIS Lead</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-border">Cancel</Button>
                <Button onClick={() => setIsAddDialogOpen(false)} className="bg-[#00d4aa] hover:bg-[#00d4aa]/90 text-[#08090a]">Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: users.length, icon: Users, color: "text-teal-400", bg: "bg-teal-500/10" },
          { label: "Active", value: users.filter(u => u.isActive).length, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Administrators", value: users.filter(u => u.role === "ADMIN").length, icon: Shield, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Inactive", value: users.filter(u => !u.isActive).length, icon: UserX, color: "text-slate-400", bg: "bg-slate-500/10" },
        ].map(stat => (
          <div key={stat.label} className="instrument-panel p-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <div className={cn("text-2xl font-mono font-semibold", stat.color)}>{stat.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="instrument-panel p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Role:</span>
            <div className="flex gap-1">
              {["all", "ADMIN", "EDITOR", "VIEWER"].map(role => (
                <button key={role} onClick={() => setRoleFilter(role)}
                  className={cn("px-3 py-1.5 text-xs rounded transition-colors",
                    roleFilter === role ? "bg-[#00d4aa] text-[#08090a]" : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}>
                  {role === "all" ? "All" : roleConfig[role]?.label || role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="instrument-panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
              <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => {
              const role = roleConfig[user.role] || roleConfig.VIEWER
              return (
                <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-card flex items-center justify-center text-sm font-medium border border-border">
                        {user.displayName.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-medium">{user.displayName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email || user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs", role.color)}>
                      <Shield className="w-3 h-3" /> {role.label}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", user.isActive ? "bg-emerald-500" : "bg-slate-600")} />
                      <span className="text-sm text-muted-foreground">{user.isActive ? "Active" : "Inactive"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"><Edit3 className="w-4 h-4" /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem className="cursor-pointer"><Shield className="w-4 h-4 mr-2" /> Change Role</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-red-400"><Trash2 className="w-4 h-4 mr-2" /> Remove User</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
