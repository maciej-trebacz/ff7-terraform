import { Triangle } from "@/ff7/mapfile";
import { useAppState } from "@/hooks/useAppState";
import { MapType, useMapState } from "@/hooks/useMapState";
import { useStatusBar } from "@/hooks/useStatusBar";
import { useEffect, useState } from "react";
import MapViewer from "../map/MapViewer";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectedTriangle } from "@/components/map/components/SelectedTriangle";
import { ExportImport } from "@/components/map/components/ExportImport";
import { GridSelectionProvider } from '@/contexts/GridSelectionContext';

type MapId = "WM0" | "WM2" | "WM3";
type RenderingMode = "terrain" | "textured" | "region" | "scripts";

const ALTERNATIVE_SECTIONS = [
  { id: 50, name: "Temple of Ancients gone" },
  { id: 41, name: "Junon Area crater (left)" },
  { id: 42, name: "Junon Area crater (right)" },
  { id: 60, name: "Mideel after Lifestream" },
  { id: 47, name: "Cosmo Canyon crater (left)" },
  { id: 48, name: "Cosmo Canyon crater (right)" },
] as const;

const MAP_ID_BY_TYPE: Record<MapType, MapId> = {
  overworld: "WM0",
  underwater: "WM2",
  glacier: "WM3"
};

export function MapTab() {
  const { loadMap, loadTextures, textures, worldmap, mapType: currentMapType, enabledAlternatives, setEnabledAlternatives } = useMapState();
  const { opened, openedTime } = useAppState();
  const { setMessage } = useStatusBar();

  const [selectedTriangle, setSelectedTriangle] = useState<Triangle | null>(null);
  const [renderingMode, setRenderingMode] = useState<RenderingMode>("terrain");
  const [isLoading, setIsLoading] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);

  useEffect(() => {
    async function load() {
      if (!opened) return;
      try {
        setIsLoading(true);
        setSelectedTriangle(null); // Reset selected triangle
        
        console.log('[MapTab] Loading map and textures for', currentMapType);
        await loadTextures(currentMapType);
        await loadMap(MAP_ID_BY_TYPE[currentMapType], currentMapType);
      } catch (error) {
        setMessage(error as string, true);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [opened, openedTime, currentMapType, enabledAlternatives]);

  useEffect(() => {
    if (selectedTriangle) {
      console.debug("Selected triangle", selectedTriangle);
      const texture = textures[selectedTriangle.texture];
      console.debug("Texture", texture);
    }
  }, [selectedTriangle]);

  const handleVertexChange = (vertexIndex: number, axis: 'x' | 'y' | 'z', value: string) => {
    if (!selectedTriangle) return;
    const newValue = parseInt(value);
    if (isNaN(newValue)) return;

    // Create a deep copy of the selected triangle
    const updatedTriangle = { ...selectedTriangle };
    const targetVertex = `vertex${vertexIndex}` as 'vertex0' | 'vertex1' | 'vertex2';
    updatedTriangle[targetVertex] = { 
      ...updatedTriangle[targetVertex],
      [axis]: newValue 
    };

    // Update the vertices array for the 3D update
    const vertices: [number, number, number][] = [
      [updatedTriangle.vertex0.x, updatedTriangle.vertex0.y, updatedTriangle.vertex0.z],
      [updatedTriangle.vertex1.x, updatedTriangle.vertex1.y, updatedTriangle.vertex1.z],
      [updatedTriangle.vertex2.x, updatedTriangle.vertex2.y, updatedTriangle.vertex2.z]
    ];

    // Update both the 3D view and the state
    (window as any).updateTrianglePosition(
      vertices[0],
      vertices[1],
      vertices[2]
    );
    setSelectedTriangle(updatedTriangle);
  };

  return (
    <GridSelectionProvider>
      <div className="flex h-full w-full">
        <div className="flex-1">
          <MapViewer 
            renderingMode={renderingMode} 
            showGrid={showExportImport}
            onTriangleSelect={showExportImport ? undefined : setSelectedTriangle}
            isLoading={isLoading}
          />
        </div>
        <div className="w-[300px] border-l bg-background pl-3 pr-2">
          <div>
            <div className="mt-2 space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="map-type">Type</Label>
                <Select value={currentMapType} onValueChange={(value: MapType) => loadMap(MAP_ID_BY_TYPE[value], value)}>
                  <SelectTrigger id="map-type" className="w-full h-8">
                    <SelectValue placeholder="Select map type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overworld">Overworld</SelectItem>
                    <SelectItem value="underwater">Underwater</SelectItem>
                    <SelectItem value="glacier">Great Glacier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rendering-mode">Rendering Mode</Label>
                <Select value={renderingMode} onValueChange={(value: RenderingMode) => setRenderingMode(value)}>
                  <SelectTrigger id="rendering-mode" className="w-full h-8">
                    <SelectValue placeholder="Select rendering mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terrain">Terrain Type</SelectItem>
                    <SelectItem value="textured">Textured</SelectItem>
                    <SelectItem value="region">Region</SelectItem>
                    <SelectItem value="scripts">Scripts & Chocobos</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowExportImport(true)}
                >
                  Export / Import geometry
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Sections: {worldmap ? `${worldmap.length}x${worldmap[0]?.length}` : 'Loading...'}
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between group">
              <h3 className="text-sm font-medium">Alternative Sections</h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {ALTERNATIVE_SECTIONS.map((section) => (
                <div key={section.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`alt-${section.id}`}
                    checked={enabledAlternatives.includes(section.id)}
                    onCheckedChange={(checked) => {
                      setEnabledAlternatives(
                        checked 
                          ? [...enabledAlternatives, section.id]
                          : enabledAlternatives.filter(id => id !== section.id)
                      );
                    }}
                  />
                  <label
                    htmlFor={`alt-${section.id}`}
                    className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {section.name}
                  </label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
          <Separator className="my-4" />
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{showExportImport ? "Export / Import geometry" : "Triangle"}</h3>
              {showExportImport && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowExportImport(false)}
                  className="h-6"
                >
                  Back
                </Button>
              )}
            </div>
            <div className="mt-2">
              {showExportImport ? (
                <div className="flex flex-col gap-2 w-72">
                  <div className="space-y-2">
                    <ExportImport />
                  </div>
                </div>
              ) : (
                <SelectedTriangle 
                  triangle={selectedTriangle}
                  textures={textures}
                  onVertexChange={handleVertexChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </GridSelectionProvider>
  );
}
