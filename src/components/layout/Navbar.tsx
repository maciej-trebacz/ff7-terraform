import { Button } from "@/components/ui/button"
import { FolderOpen, Save } from "lucide-react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStatusBar } from "@/hooks/useStatusBar"

export function Navbar() {
  const { setMessage } = useStatusBar()

  return (
    <nav className="flex items-center gap-2 p-1 bg-slate-900 border-b border-slate-800">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="px-2"
          onClick={() => setMessage("Opening file...")}
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="px-2"
          onClick={() => setMessage("Saving file...")}
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>
      <div className="w-px h-6 bg-slate-800" />
      <TabsList className="bg-transparent border-0">
        <TabsTrigger value="map">Map</TabsTrigger>
        <TabsTrigger value="messages">Messages</TabsTrigger>
        <TabsTrigger value="encounters">Encounters</TabsTrigger>
        <TabsTrigger value="scripts">Scripts</TabsTrigger>
      </TabsList>
    </nav>
  )
} 