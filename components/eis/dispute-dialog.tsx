"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface DisputeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceLineName: string
  airlineName: string
  currentStatus: string
  onSubmit: (note: string) => Promise<void>
  loading?: boolean
}

export function DisputeDialog({
  open,
  onOpenChange,
  serviceLineName,
  airlineName,
  currentStatus,
  onSubmit,
  loading,
}: DisputeDialogProps) {
  const [note, setNote] = useState("")

  const isValid = note.trim().length >= 10

  function handleOpenChange(value: boolean) {
    onOpenChange(value)
    if (!value) setNote("")
  }

  async function handleSubmit() {
    if (!isValid) return
    await onSubmit(note.trim())
    setNote("")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispute Status: {serviceLineName}</DialogTitle>
          <DialogDescription>
            This service line for {airlineName} is currently marked as{" "}
            <span className="font-semibold uppercase">{currentStatus}</span>.
            Submit a dispute note explaining why you believe this status should be
            reviewed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">Dispute Note</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain your reasoning for disputing this status (minimum 10 characters)..."
            className="min-h-[100px]"
          />
          {note.length > 0 && note.trim().length < 10 && (
            <p className="text-xs text-[#ff4757]">
              Please provide at least 10 characters.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading}
          >
            {loading && <Loader2 className="animate-spin" />}
            Submit Dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
