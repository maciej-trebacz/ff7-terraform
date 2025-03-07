import { cn } from "@/lib/utils"

interface ScriptSidebarProps {
  className?: string
}

export function ScriptSidebar({ className }: ScriptSidebarProps) {
  return (
    <div className={cn("bg-background p-2", className)}>
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Script Properties
      </div>
      <div className="space-y-4">
        {/* Properties and settings will go here */}
        <div className="text-xs text-muted-foreground">
          No script selected
        </div>
      </div>
    </div>
  )
} 