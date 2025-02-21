import { createContext, useContext, useState, ReactNode } from "react"

interface StatusBarContextType {
  message: string
  isError: boolean
  setMessage: (message: string | Error, isError?: boolean) => void
  setMapInfo: (mapType: string, sections: { length: number, width: number } | null) => void
}

const StatusBarContext = createContext<StatusBarContextType | undefined>(undefined)

export function StatusBarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("Ready")
  const [isError, setIsError] = useState(false)

  const setMessageWithError = (message: string | Error, isError: boolean = false) => {
    const messageStr = message instanceof Error ? message.message : String(message)

    // Ignore the FF7 is not running message
    if (messageStr === "FF7 is not running") return;

    setMessage(messageStr)
    setIsError(isError)
  }

  const setMapInfo = (mapType: string, sections: { length: number, width: number } | null) => {
    if (!sections) {
      setMessage("Loading map...")
      return
    }
    setMessage(`Loaded the ${mapType} map with ${sections.length}x${sections.width} sections`)
  }

  return (
    <StatusBarContext.Provider value={{ message, isError, setMessage: setMessageWithError, setMapInfo }}>
      {children}
    </StatusBarContext.Provider>
  )
}

export function useStatusBar() {
  const context = useContext(StatusBarContext)
  if (context === undefined) {
    throw new Error("useStatusBar must be used within a StatusBarProvider")
  }
  return context
} 