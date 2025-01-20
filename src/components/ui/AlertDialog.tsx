import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AlertDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
}

export function AlertDialog({ open, onClose, title, description }: AlertDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="text-xs max-w-[400px] p-3 pt-2.5">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription className="text-slate-300">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="secondary" 
            onClick={onClose}
            className="w-full"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 