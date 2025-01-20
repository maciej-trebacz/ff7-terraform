import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  const handleResize = React.useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "0"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [])

  React.useEffect(() => {
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [handleResize])

  return (
    <textarea
      className={cn(
        "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm overflow-hidden resize-none",
        className
      )}
      ref={(element) => {
        textareaRef.current = element
        if (typeof ref === "function") ref(element)
        else if (ref) ref.current = element
      }}
      onInput={handleResize}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
