import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ChangeEvent } from "react"

interface MessageRowProps {
  index: number
  message: string
  onChange: (value: string) => void
}

export function MessageRow({ index, message, onChange }: MessageRowProps) {
  return (
    <div className="flex items-start gap-2 w-full">
      <Badge variant="secondary" textAlign="center" className="shrink-0 font-bold mt-2 w-[89px]">
        Message {index}
      </Badge>
      <Textarea
        value={message}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        className="flex-1 text-sm text-slate-200"
      />
    </div>
  )
} 