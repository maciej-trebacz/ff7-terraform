import { useEffect } from "react"
import { useLgpState } from "@/hooks/useLgpState"
import { useStatusBar } from "@/hooks/useStatusBar"
import { useScriptsState } from "@/hooks/useScriptState"
import { ScriptControls } from "@/components/script/ScriptControls"
import { ScriptList } from "@/components/script/ScriptList"
import { ScriptEditor } from "@/components/script/ScriptEditor"
import { ScriptSidebar } from "@/components/script/ScriptSidebar"
import { useRef, useState } from "react"
import type { CallContext, WorldscriptEditorHandle } from "@/components/script/WorldscriptEditor"

export function ScriptsTab() {
  const { loadScripts } = useScriptsState()
  const { opened, openedTime } = useLgpState()
  const { setMessage } = useStatusBar()

  useEffect(() => {
    async function load() {
      if (!opened) return
      try {
        await loadScripts()
      } catch (error) {
        setMessage(error as string, true)
      }
    }

    load()
  }, [opened, openedTime])

  const [context, setContext] = useState<CallContext | null>(null)
  const editorRef = useRef<WorldscriptEditorHandle | null>(null)

  return (
    <div className="flex flex-col w-full min-h-0">
      <ScriptControls />
      <div className="flex-1 flex min-h-0">
        <ScriptList className="w-[240px] border-r overflow-y-auto" />
        <div className="flex-1 overflow-y-auto">
          <ScriptEditor className="h-full" editorHandleRef={editorRef as any} onWorldscriptContextChange={setContext} />
        </div>
        <ScriptSidebar 
          className="w-[320px] box-content border-l overflow-y-auto"
          context={context}
          editor={editorRef.current}
          onParamChange={(index, newText) => editorRef.current?.replaceCurrentCallArg(index, newText)}
          onBatchParamsChange={(updates) => editorRef.current?.replaceCurrentCallArgs(updates)}
        />
      </div>
    </div>
  )
} 