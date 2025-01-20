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
      <DialogContent className="sm:max-w-[425px] p-3 bg-slate-900 border border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-100 text-center mt-1 mb-2">{title}</DialogTitle>
          <DialogDescription className="text-slate-300">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="secondary" 
            onClick={onClose}
            className="bg-slate-800 text-slate-100 hover:bg-slate-700"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 