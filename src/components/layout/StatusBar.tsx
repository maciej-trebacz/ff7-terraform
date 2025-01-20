import { useStatusBar } from "@/hooks/useStatusBar"
import { cn } from "@/lib/utils"

export function StatusBar() {
  const { message, isError } = useStatusBar()
  
  return (
    <div className={cn(
      "h-6 px-2 flex items-center text-sm bg-slate-900 border-t border-slate-800",
      isError ? "text-red-400" : "text-slate-400"
    )}>
      {message}
    </div>
  )
} 