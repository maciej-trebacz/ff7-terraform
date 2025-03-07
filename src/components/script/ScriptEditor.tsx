import { cn } from "@/lib/utils"
import { useScriptsState } from "@/hooks/useScriptState"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FunctionType } from "@/ff7/evfile"
import { ArrowRight, Code } from "lucide-react"
import { ScriptCodeEditor } from "@/components/script/ScriptCodeEditor"

interface ScriptEditorProps {
  className?: string
}

export function ScriptEditor({ className }: ScriptEditorProps) {
  const { functions, getSelectedScript, updateSelectedScript, selectScript, setScriptType, ev } = useScriptsState()

  const scriptToEdit = getSelectedScript()
  const systemFunctions = functions.filter(f => f.type === FunctionType.System)

  const handleAliasChange = (checked: boolean) => {
    if (!scriptToEdit) return
    
    if (!checked) {
      // Remove alias
      updateSelectedScript({ aliasId: undefined })
    } else {
      // When checking the box, set it as an alias to the first available system function
      const firstSystemFunction = systemFunctions[0]
      if (firstSystemFunction) {
        updateSelectedScript({ aliasId: firstSystemFunction.id })
      }
    }
  }

  const handleAliasSelect = (aliasId: string) => {
    if (!scriptToEdit) return
    
    updateSelectedScript({ aliasId: parseInt(aliasId) })
  }

  const handleGoToScript = () => {
    if (scriptToEdit?.aliasId === undefined) return

    const targetScript = functions.find(f => 
      f.type === FunctionType.System && 
      f.id === scriptToEdit.aliasId
    )
    
    if (targetScript) {
      setScriptType(FunctionType.System)
      selectScript(targetScript)
    }
  }

  const handleTestScript = () => {
    if (!ev || !scriptToEdit) return;
    try {
      const bytes = ev.encodeOpcodes(scriptToEdit.script);
      console.log("Encoded opcodes:", Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
    } catch (error) {
      console.error("Failed to encode script:", error);
    }
  }

  const getScriptName = () => {
    if (!scriptToEdit) return null;
    
    switch (scriptToEdit.type) {
      case FunctionType.System:
        return `System ${scriptToEdit.id}`;
      case FunctionType.Model:
        return `Model ${scriptToEdit.modelId}:${scriptToEdit.id}`;
      case FunctionType.Mesh:
        return `Mesh ${scriptToEdit.x},${scriptToEdit.y}:${scriptToEdit.id}`;
    }
  }

  return (
    <div className={cn("bg-background flex flex-col h-full", className)}>
      <div className="flex items-center justify-between border-b px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Script Editor</div>
          {scriptToEdit && (
            <div className="text-xs text-muted-foreground">
              {getScriptName()}
            </div>
          )}
        </div>

        {scriptToEdit && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="is-alias"
                checked={scriptToEdit.aliasId !== undefined}
                onCheckedChange={handleAliasChange}
                disabled={!scriptToEdit || systemFunctions.length === 0}
              />
              <Label htmlFor="is-alias" className="text-xs">Script is an alias to:</Label>
            </div>
            <Select
              value={scriptToEdit?.aliasId?.toString()}
              onValueChange={handleAliasSelect}
              disabled={!scriptToEdit || scriptToEdit.aliasId === undefined}
            >
              <SelectTrigger className="h-7 text-xs w-[180px]">
                <SelectValue placeholder="Select system function" />
              </SelectTrigger>
              <SelectContent>
                {systemFunctions.map(fn => (
                  <SelectItem key={fn.id} value={fn.id.toString()} className="text-xs">
                    System {fn.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {scriptToEdit ? (
          scriptToEdit.aliasId !== undefined ? (
            <div className="flex items-center justify-center h-full">
              <Button 
                variant="outline" 
                className="text-xs gap-2"
                onClick={handleGoToScript}
              >
                Go to script System {scriptToEdit.aliasId}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="relative h-full">
              <ScriptCodeEditor
                value={scriptToEdit.script}
                onChange={(value) => updateSelectedScript({ script: value })}
                className="h-full"
              />
              <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={handleTestScript}
                >
                  <Code className="h-3.5 w-3.5 mr-1" />
                  Test
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            Select a script to edit
          </div>
        )}
      </div>
    </div>
  )
}
