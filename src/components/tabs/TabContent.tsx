import { TabsContent } from "@/components/ui/tabs"
import { MapTab } from "./MapTab"
import { MessagesTab } from "./MessagesTab"
import { EncountersTab } from "./EncountersTab"
import { ScriptsTab } from "./ScriptsTab"
import { TexturesTab } from "./TexturesTab"

export function TabContent() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-scroll">
      <TabsContent value="map" className="flex-1 data-[state=active]:flex">
        <MapTab />
      </TabsContent>
      <TabsContent value="messages" className="flex-1 data-[state=active]:flex">
        <MessagesTab />
      </TabsContent>
      <TabsContent value="encounters" className="flex-1 data-[state=active]:flex">
        <EncountersTab />
      </TabsContent>
      <TabsContent value="scripts" className="flex-1 data-[state=active]:flex">
        <ScriptsTab />
      </TabsContent>
      <TabsContent value="textures" className="flex-1 data-[state=active]:flex">
        <TexturesTab />
      </TabsContent>
    </div>
  )
} 