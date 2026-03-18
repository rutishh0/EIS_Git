"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RAGBadge } from "./rag-badge"

interface CommentPopoverProps {
  statusText: string | null
  comments: string | null
  serviceLineName: string
  ragStatus: string
  canEdit?: boolean
  onSave?: (statusText: string, comments: string) => void
  children: React.ReactNode
}

export function CommentPopover({
  statusText,
  comments,
  serviceLineName,
  ragStatus,
  canEdit,
  onSave,
  children,
}: CommentPopoverProps) {
  const [editStatusText, setEditStatusText] = useState(statusText ?? "")
  const [editComments, setEditComments] = useState(comments ?? "")
  const [isOpen, setIsOpen] = useState(false)

  const hasChanges =
    editStatusText !== (statusText ?? "") || editComments !== (comments ?? "")

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (open) {
      setEditStatusText(statusText ?? "")
      setEditComments(comments ?? "")
    }
  }

  function handleSave() {
    onSave?.(editStatusText, editComments)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{serviceLineName}</span>
            <RAGBadge status={ragStatus} showLabel size="sm" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Status
            </label>
            {canEdit ? (
              <Textarea
                className="mt-1 min-h-[60px]"
                value={editStatusText}
                onChange={(e) => setEditStatusText(e.target.value)}
                placeholder="Enter status..."
              />
            ) : (
              <p className="text-sm mt-1">
                {statusText || <span className="text-muted-foreground italic">No status</span>}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Comments
            </label>
            {canEdit ? (
              <Textarea
                className="mt-1 min-h-[60px]"
                value={editComments}
                onChange={(e) => setEditComments(e.target.value)}
                placeholder="Enter comments..."
              />
            ) : (
              <p className="text-sm mt-1">
                {comments || <span className="text-muted-foreground italic">No comments</span>}
              </p>
            )}
          </div>

          {canEdit && hasChanges && (
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
