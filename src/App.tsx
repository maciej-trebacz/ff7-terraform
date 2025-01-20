import { Navbar } from "./components/layout/Navbar"
import { StatusBar } from "./components/layout/StatusBar"
import { TabContent } from "./components/tabs/TabContent"
import { Tabs } from "@/components/ui/tabs"
import { StatusBarProvider } from "./hooks/useStatusBar"
import "./App.css"

function App() {
  return (
    <StatusBarProvider>
      <div className="h-full flex flex-col bg-slate-950 text-slate-50">
        <Tabs defaultValue="messages" className="flex-1 flex flex-col h-full">
          <Navbar />
          <TabContent />
          <StatusBar />
        </Tabs>
      </div>
    </StatusBarProvider>
  )
}

export default App
