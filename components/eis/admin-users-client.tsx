"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Users, Plus, Edit, Trash2, Shield, Check, ChevronsUpDown, X, Plane } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/eis/page-header"
import { DataTable } from "@/components/eis/data-table"
import { ConfirmDialog } from "@/components/eis/confirm-dialog"
import { EmptyState } from "@/components/eis/empty-state"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface AirlineOption {
  id: string
  name: string
}

interface User {
  id: string
  username: string
  displayName: string
  email: string | null
  jobTitle: string | null
  role: string
  isActive: boolean
  createdAt: string
  managedAirlines: AirlineOption[]
}

interface AdminUsersClientProps {
  users: User[]
  airlines: AirlineOption[]
}

const roleStyles: Record<string, { label: string; className: string }> = {
  ADMIN: {
    label: "Admin",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  EDITOR: {
    label: "Editor",
    className: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  },
  VIEWER: {
    label: "Viewer",
    className: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  },
}

const emptyCreateForm = {
  username: "",
  displayName: "",
  email: "",
  password: "",
  role: "VIEWER",
  jobTitle: "",
  managedAirlineIds: [] as string[],
}

export function AdminUsersClient({ users, airlines }: AdminUsersClientProps) {
  const router = useRouter()

  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [createAirlinePopoverOpen, setCreateAirlinePopoverOpen] = useState(false)
  const [editAirlinePopoverOpen, setEditAirlinePopoverOpen] = useState(false)

  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    role: "VIEWER",
    isActive: true,
    jobTitle: "",
    managedAirlineIds: [] as string[],
  })

  const activeCount = users.filter((u) => u.isActive).length
  const adminCount = users.filter((u) => u.role === "ADMIN").length
  const editorCount = users.filter((u) => u.role === "EDITOR").length

  function openCreate() {
    setCreateForm(emptyCreateForm)
    setCreateOpen(true)
  }

  function openEdit(user: User) {
    setEditForm({
      displayName: user.displayName,
      email: user.email || "",
      role: user.role,
      isActive: user.isActive,
      jobTitle: user.jobTitle || "",
      managedAirlineIds: user.managedAirlines.map((a) => a.id),
    })
    setEditUser(user)
  }

  async function handleCreate() {
    if (
      !createForm.username.trim() ||
      !createForm.displayName.trim() ||
      createForm.password.length < 6
    ) {
      toast.error(
        "Username and display name are required. Password must be at least 6 characters."
      )
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create user")
      }
      toast.success("User created successfully")
      setCreateOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit() {
    if (!editUser) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update user")
      }
      toast.success("User updated successfully")
      setEditUser(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteUser) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to deactivate user")
      }
      toast.success("User deactivated successfully")
      setDeleteUser(null)
      router.refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to deactivate user"
      )
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  const columns = [
    {
      key: "displayName",
      header: "User",
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const u = row as unknown as User
        const initials = u.displayName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium border border-border">
              {initials}
            </div>
            <div>
              <p className="font-medium">{u.displayName}</p>
              <p className="text-xs text-muted-foreground">@{u.username}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: "email",
      header: "Email",
      render: (row: Record<string, unknown>) => {
        const u = row as unknown as User
        return (
          <span className="text-muted-foreground">{u.email || "—"}</span>
        )
      },
    },
    {
      key: "jobTitle",
      header: "Job Title",
      render: (row: Record<string, unknown>) => {
        const u = row as unknown as User
        return (
          <span className="text-muted-foreground">{u.jobTitle || "—"}</span>
        )
      },
    },
    {
      key: "managedAirlines",
      header: "Managed Airlines",
      render: (row: Record<string, unknown>) => {
        const u = row as unknown as User
        if (!u.managedAirlines || u.managedAirlines.length === 0) {
          return <span className="text-muted-foreground">—</span>
        }
        return (
          <div className="flex flex-wrap gap-1">
            {u.managedAirlines.slice(0, 2).map((a) => (
              <Badge key={a.id} variant="secondary" className="text-xs gap-1">
                <Plane className="h-3 w-3" />
                {a.name}
              </Badge>
            ))}
            {u.managedAirlines.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{u.managedAirlines.length - 2} more
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const u = row as unknown as User
        const style = roleStyles[u.role] || roleStyles.VIEWER
        return (
          <Badge variant="outline" className={cn("gap-1", style.className)}>
            <Shield className="h-3 w-3" />
            {style.label}
          </Badge>
        )
      },
    },
    {
      key: "isActive",
      header: "Status",
      render: (row: Record<string, unknown>) => {
        const u = row as unknown as User
        return u.isActive ? (
          <Badge
            variant="outline"
            className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          >
            Active
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-slate-500/15 text-slate-400 border-slate-500/30"
          >
            Inactive
          </Badge>
        )
      },
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const u = row as unknown as User
        return (
          <span className="text-sm text-muted-foreground">
            {formatDate(u.createdAt)}
          </span>
        )
      },
    },
    {
      key: "id",
      header: "Actions",
      className: "text-right",
      render: (row: Record<string, unknown>) => {
        const u = row as unknown as User
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                openEdit(u)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteUser(u)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="User Management"
        description="Manage system users and their roles"
      >
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[
          {
            label: "Total Users",
            value: users.length,
            icon: Users,
            color: "text-foreground",
          },
          {
            label: "Active",
            value: activeCount,
            icon: Users,
            color: "text-emerald-400",
          },
          {
            label: "Admins",
            value: adminCount,
            icon: Shield,
            color: "text-amber-400",
          },
          {
            label: "Editors",
            value: editorCount,
            icon: Edit,
            color: "text-teal-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <s.icon className={cn("h-5 w-5", s.color)} />
              </div>
              <div>
                <p className={cn("text-2xl font-semibold tabular-nums", s.color)}>
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No users yet"
          description="Create the first user to get started."
          action={{ label: "Create User", onClick: openCreate }}
        />
      ) : (
        <DataTable
          data={users as unknown as Record<string, unknown>[]}
          columns={columns}
          searchable
          searchPlaceholder="Search by name, username, or email..."
          searchKeys={["displayName", "username", "email"]}
          pageSize={15}
          emptyMessage="No users match your search."
        />
      )}

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-username">Username *</Label>
                <Input
                  id="create-username"
                  value={createForm.username}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, username: e.target.value }))
                  }
                  placeholder="jdoe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-displayName">Display Name *</Label>
                <Input
                  id="create-displayName"
                  value={createForm.displayName}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      displayName: e.target.value,
                    }))
                  }
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="j.doe@rolls-royce.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password * (min 6 characters)</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) =>
                  setCreateForm((f) => ({ ...f, role: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-jobTitle">Job Title</Label>
              <Input
                id="create-jobTitle"
                value={createForm.jobTitle}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, jobTitle: e.target.value }))
                }
                placeholder="e.g. EIS Programme Manager"
              />
            </div>
            <div className="space-y-2">
              <Label>Managed Airlines</Label>
              <Popover open={createAirlinePopoverOpen} onOpenChange={setCreateAirlinePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={createAirlinePopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {createForm.managedAirlineIds.length > 0
                      ? `${createForm.managedAirlineIds.length} airline${createForm.managedAirlineIds.length > 1 ? "s" : ""} selected`
                      : "Select airlines..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search airlines..." />
                    <CommandList>
                      <CommandEmpty>No airlines found.</CommandEmpty>
                      <CommandGroup>
                        {airlines.map((airline) => (
                          <CommandItem
                            key={airline.id}
                            value={airline.name}
                            onSelect={() => {
                              setCreateForm((f) => ({
                                ...f,
                                managedAirlineIds: f.managedAirlineIds.includes(airline.id)
                                  ? f.managedAirlineIds.filter((id) => id !== airline.id)
                                  : [...f.managedAirlineIds, airline.id],
                              }))
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                createForm.managedAirlineIds.includes(airline.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {airline.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {createForm.managedAirlineIds.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {createForm.managedAirlineIds.map((id) => {
                    const airline = airlines.find((a) => a.id === id)
                    if (!airline) return null
                    return (
                      <Badge key={id} variant="secondary" className="gap-1 pr-1">
                        <Plane className="h-3 w-3" />
                        {airline.name}
                        <button
                          type="button"
                          className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                          onClick={() =>
                            setCreateForm((f) => ({
                              ...f,
                              managedAirlineIds: f.managedAirlineIds.filter((i) => i !== id),
                            }))
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={!!editUser}
        onOpenChange={(open) => {
          if (!open) setEditUser(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User — {editUser?.displayName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-displayName">Display Name</Label>
              <Input
                id="edit-displayName"
                value={editForm.displayName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, displayName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, role: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-jobTitle">Job Title</Label>
              <Input
                id="edit-jobTitle"
                value={editForm.jobTitle}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, jobTitle: e.target.value }))
                }
                placeholder="e.g. EIS Programme Manager"
              />
            </div>
            <div className="space-y-2">
              <Label>Managed Airlines</Label>
              <Popover open={editAirlinePopoverOpen} onOpenChange={setEditAirlinePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={editAirlinePopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {editForm.managedAirlineIds.length > 0
                      ? `${editForm.managedAirlineIds.length} airline${editForm.managedAirlineIds.length > 1 ? "s" : ""} selected`
                      : "Select airlines..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search airlines..." />
                    <CommandList>
                      <CommandEmpty>No airlines found.</CommandEmpty>
                      <CommandGroup>
                        {airlines.map((airline) => (
                          <CommandItem
                            key={airline.id}
                            value={airline.name}
                            onSelect={() => {
                              setEditForm((f) => ({
                                ...f,
                                managedAirlineIds: f.managedAirlineIds.includes(airline.id)
                                  ? f.managedAirlineIds.filter((id) => id !== airline.id)
                                  : [...f.managedAirlineIds, airline.id],
                              }))
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                editForm.managedAirlineIds.includes(airline.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {airline.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {editForm.managedAirlineIds.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {editForm.managedAirlineIds.map((id) => {
                    const airline = airlines.find((a) => a.id === id)
                    if (!airline) return null
                    return (
                      <Badge key={id} variant="secondary" className="gap-1 pr-1">
                        <Plane className="h-3 w-3" />
                        {airline.name}
                        <button
                          type="button"
                          className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                          onClick={() =>
                            setEditForm((f) => ({
                              ...f,
                              managedAirlineIds: f.managedAirlineIds.filter((i) => i !== id),
                            }))
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active Status</p>
                <p className="text-xs text-muted-foreground">
                  Inactive users cannot sign in
                </p>
              </div>
              <Button
                type="button"
                variant={editForm.isActive ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setEditForm((f) => ({ ...f, isActive: !f.isActive }))
                }
              >
                {editForm.isActive ? "Active" : "Inactive"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditUser(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteUser}
        onOpenChange={(open) => {
          if (!open) setDeleteUser(null)
        }}
        title="Deactivate User"
        description={`Are you sure you want to deactivate "${deleteUser?.displayName}"? They will no longer be able to sign in.`}
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  )
}
