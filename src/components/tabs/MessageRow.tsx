import { Textarea } from "@/components/ui/textarea"
import { ChangeEvent } from "react"

interface MessageRowProps {
  index: number
  message: string
  onChange: (value: string) => void
}

export function MessageRow({ index, message, onChange }: MessageRowProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="shrink-0 font-bold w-[85px] text-zinc-300 text-sm">
        Message {index}:
      </div>
      <Textarea
        value={message}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        className="flex-1 text-sm text-zinc-300"
      />
    </div>
  )
} 