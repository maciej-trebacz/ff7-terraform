import { cn } from "@/lib/utils"
import { useScriptsState } from "@/hooks/useScriptState"
import { Button } from "@/components/ui/button"
import { FF7Function } from "@/ff7/evfile"

interface ScriptListProps {
  className?: string
}

function getScriptLabel(script: FF7Function): string {
  switch (script.type) {
    case 0: // System
      return `System ${script.id}`
    case 1: // Model
      return `Model ${script.modelId} (${script.id})`
    case 2: // Mesh
      return `Mesh ${script.x},${script.y} (${script.id})`
  }
}

function getScriptKey(script: FF7Function): string {
  switch (script.type) {
    case 0: // System
      return `sys-${script.id}`
    case 1: // Model
      return `mdl-${script.modelId}-${script.id}`
    case 2: // Mesh
      return `mesh-${script.x}-${script.y}-${script.id}`
  }
}

export function ScriptList({ className }: ScriptListProps) {
  const { functions, scriptType, selectScript, isScriptSelected } = useScriptsState()
  const filteredScripts = functions.filter(f => f.type === scriptType)

  return (
    <div className={cn("bg-background p-2", className)}>
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Available Scripts ({filteredScripts.length})
      </div>
      <div className="space-y-1">
        {filteredScripts.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            No scripts loaded
          </div>
        ) : (
          filteredScripts.map((script) => (
            <Button
              key={getScriptKey(script)}
              variant={isScriptSelected(script) ? "secondary" : "ghost"}
              className="w-full justify-start h-7 text-xs px-2"
              onClick={() => selectScript(script)}
            >
              {getScriptLabel(script)}
              {script.aliasId !== undefined && (
                <span className="text-xs text-muted-foreground">
                  (&rArr; System {script.aliasId})
                </span>
              )}
            </Button>
          ))
        )}
      </div>
    </div>
  )
} 