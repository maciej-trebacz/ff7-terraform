import { useEffect } from "react"
import { useLgpState } from "@/hooks/useLgpState"
import { useStatusBar } from "@/hooks/useStatusBar"
import { useScriptsState } from "@/hooks/useScriptState"
import { ScriptControls } from "@/components/script/ScriptControls"
import { ScriptList } from "@/components/script/ScriptList"
import { ScriptEditor } from "@/components/script/ScriptEditor"
import { ScriptSidebar } from "@/components/script/ScriptSidebar"

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

  return (
    <div className="flex flex-col w-full min-h-0">
      <ScriptControls />
      <div className="flex-1 flex min-h-0">
        <ScriptList className="w-[240px] border-r overflow-y-auto" />
        <ScriptEditor className="flex-1 overflow-y-auto" />
        <ScriptSidebar className="w-[300px] border-l overflow-y-auto" />
      </div>
    </div>
  )
} 