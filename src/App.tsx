import { Navbar } from "./components/layout/Navbar"
import { StatusBar } from "./components/layout/StatusBar"
import { TabContent } from "./components/tabs/TabContent"
import { Tabs } from "@/components/ui/tabs"
import { StatusBarProvider } from "./hooks/useStatusBar"
import "./App.css"

function App() {
  return (
    <StatusBarProvider>
      <div className="h-screen flex flex-col bg-slate-950 text-slate-50">
        <Tabs defaultValue="map" className="flex-1 flex flex-col">
          <Navbar />
          <TabContent />
        </Tabs>
        <StatusBar />
      </div>
    </StatusBarProvider>
  )
}

export default App
