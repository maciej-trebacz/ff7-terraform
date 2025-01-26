import { Button } from "@/components/ui/button"
import { FolderOpen, Save } from "lucide-react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStatusBar } from "@/hooks/useStatusBar"
import { useAppState } from "@/hooks/useAppState"
import { useMessagesState } from "@/hooks/useMessagesState"
import { open } from "@tauri-apps/plugin-dialog"
import { validateFF7Directory } from "@/lib/ff7-data"
import { AlertDialog } from "@/components/ui/AlertDialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useLgpState } from "@/hooks/useLgpState"

export function Navbar() {
  const { setMessage } = useStatusBar()
  const { alert, showAlert, hideAlert, setDataPath } = useAppState()
  const { saveMessages } = useMessagesState()
  const { loadLgp, opened } = useLgpState() 

  const clearFocus = () => {
    document.activeElement instanceof HTMLElement && document.activeElement.blur()
  }

  const handleOpenDirectory = async () => {
    try {
      clearFocus()

      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select FF7 Game Directory"
      })
      
      if (selected) {
        const validation = await validateFF7Directory(selected as string)
        console.debug("[Navbar] Validating FF7 directory:", validation)
        if (validation.valid) {
          setDataPath(selected as string)
          await loadLgp(selected as string)
          setMessage("world.lgp file loaded successfully")
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
    try {
      clearFocus()
      await saveMessages()
    } catch (error) {
      showAlert("Error", (error as Error).message)
    }
  }

  const ComingSoonTab = ({ value, children }: { value: string, children: React.ReactNode }) => (
    <TooltipProvider delayDuration={100} >
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
        <TooltipContent>
          <p>Coming soon</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <>
      <nav className="flex items-center gap-2 p-1 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="px-2"
                  onClick={handleOpenDirectory}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open FF7 game directory</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={100} disableHoverableContent={true}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="px-2 disabled:opacity-50"
                  onClick={handleSave}
                  disabled={!opened}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save changes</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="w-px h-6 bg-zinc-800" />
        <TabsList className="bg-transparent border-0">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
          <TabsTrigger value="textures">Textures</TabsTrigger>
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