import { useStatusBar } from "@/hooks/useStatusBar"

export function StatusBar() {
  const { message } = useStatusBar()
  
  return (
    <div className="h-6 px-2 flex items-center text-sm bg-slate-900 border-t border-slate-800 text-slate-400">
      {message}
    </div>
  )
} 