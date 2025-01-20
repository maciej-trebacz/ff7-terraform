import { useEffect } from "react"
import { useMessagesState } from "@/hooks/useMessagesState"
import { useAppState } from "@/hooks/useAppState"
import { loadMessages } from "@/lib/ff7-data"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageRow } from "./MessageRow"

export function MessagesTab() {
  const { messages, loadMessages: setMessages, updateMessage } = useMessagesState()
  const { dataPath, openedTime } = useAppState()

  useEffect(() => {
    async function loadMesFile() {
      if (!dataPath) return

      try {
        const loadedMessages = await loadMessages(dataPath)
        setMessages(loadedMessages)
      } catch (error) {
        console.error("Error loading messages:", error)
      }
    }

    loadMesFile()
  }, [dataPath, openedTime])

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