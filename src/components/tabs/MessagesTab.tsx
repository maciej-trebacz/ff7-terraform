import { useEffect } from "react"
import { useMessagesState } from "@/hooks/useMessagesState"
import { useLgpState } from "@/hooks/useLgpState"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageRow } from "./MessageRow"
import { useStatusBar } from "@/hooks/useStatusBar"

export function MessagesTab() {
  const { messages, loadMessages, updateMessage } = useMessagesState()
  const { opened, openedTime } = useLgpState()
  const { setMessage } = useStatusBar()

  useEffect(() => {
    async function load() {
      if (!opened) return
      try {
        await loadMessages()
      } catch (error) {
        setMessage(error as string, true)
      }
    }

    load()
  }, [opened, openedTime])

  return (
    <ScrollArea className="h-full w-full p-3">
      <div className="space-y-2">
        {messages.map((message, index) => (
          <MessageRow
            key={index}
            index={index}
            message={message}
            onChange={(value) => updateMessage(index, value)}
          />
        ))}
      </div>
    </ScrollArea>
  )
} 