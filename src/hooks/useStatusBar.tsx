import { createContext, useContext, useState, ReactNode } from "react"

interface StatusBarContextType {
  message: string
  setMessage: (message: string) => void
}

const StatusBarContext = createContext<StatusBarContextType | undefined>(undefined)

export function StatusBarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("Ready")

  return (
    <StatusBarContext.Provider value={{ message, setMessage }}>
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