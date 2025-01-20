import { Button } from "@/components/ui/button"
import { FolderOpen, Save } from "lucide-react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStatusBar } from "@/hooks/useStatusBar"
import { useAppState } from "@/hooks/useAppState"
import { useMessagesState } from "@/hooks/useMessagesState"
import { open } from "@tauri-apps/plugin-dialog"
import { validateFF7Directory, saveMessages } from "@/lib/ff7-data"
import { AlertDialog } from "@/components/ui/AlertDialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function Navbar() {
  const { setMessage } = useStatusBar()
  const { setDataPath, alert, showAlert, hideAlert, opened, dataPath } = useAppState()
  const { messages } = useMessagesState()

  const handleOpenDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select FF7 Game Directory"
      })
      
      if (selected) {
        const validation = await validateFF7Directory(selected as string)
        
        if (validation.valid) {
          setDataPath(selected as string)
          setMessage("Game directory loaded successfully")
        } else {
          showAlert("Invalid Directory", validation.error || "Unknown error occurred")
        }
      }
    } catch (error) {
      showAlert("Error", "Failed to open directory: " + (error as Error).message)
      console.error(error)
    }
  }

  const handleSave = async () => {
    if (!dataPath) return

    try {
      setMessage("Saving changes...")
      await saveMessages(dataPath, messages)
      setMessage("Changes saved successfully")
    } catch (error) {
      showAlert("Error", (error as Error).message)
    }
  }

  const ComingSoonTab = ({ value, children }: { value: string, children: React.ReactNode }) => (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-not-allowed">
            <TabsTrigger 
              value={value} 
              disabled 
              className="data-[state=active]:bg-transparent pointer-events-none"
            >
              {children}
            </TabsTrigger>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-800 text-slate-100 border-slate-700">
          <p>Coming soon</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <>
      <nav className="flex items-center gap-2 p-1 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-2"
            onClick={handleOpenDirectory}
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-2 disabled:opacity-50"
            onClick={handleSave}
            disabled={!opened}
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
        <div className="w-px h-6 bg-slate-800" />
        <TabsList className="bg-transparent border-0">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <ComingSoonTab value="map">Map</ComingSoonTab>
          <ComingSoonTab value="encounters">Encounters</ComingSoonTab>
          <ComingSoonTab value="scripts">Scripts</ComingSoonTab>
        </TabsList>
      </nav>

      <AlertDialog
        open={alert.show}
        onClose={hideAlert}
        title={alert.title}
        description={alert.message}
      />
    </>
  )
} 