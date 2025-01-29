import { MapFile, Mesh, Triangle } from "@/ff7/mapfile";
import { useAppState } from "@/hooks/useAppState";
import { useMapState } from "@/hooks/useMapState";
import { useStatusBar } from "@/hooks/useStatusBar";
import { useEffect, useState } from "react";
import MapViewer from "./MapViewer";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGION_NAMES, TRIANGLE_TYPES } from "@/lib/map-data";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import React from "react";
import { UVEditorModal } from "../modals/UVEditorModal";

type MapType = "overworld" | "underwater" | "glacier";
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

export function MapTab() {
  const { loadMap, loadTextures, textures } = useMapState();
  const { opened, openedTime } = useAppState();
  const { setMessage } = useStatusBar();
  const [isUVEditorOpen, setIsUVEditorOpen] = useState(false);

  const [worldmap, setWorldmap] = useState<Mesh[][] | null>(null);
  const [selectedTriangle, setSelectedTriangle] = useState<Triangle | null>(null);
  const [mapType, setMapType] = useState<MapType>("overworld");
  const [renderingMode, setRenderingMode] = useState<RenderingMode>("terrain");
  const [enabledAlternatives, setEnabledAlternatives] = useState<number[]>([]);

  useEffect(() => {
    async function load() {
      if (!opened) return;
      try {
        console.log('[MapTab] Loading textures...');
        await loadTextures();
        console.log('[MapTab] Textures loaded');

        const mapId: Record<MapType, MapId> = {
          overworld: "WM0",
          underwater: "WM2",
          glacier: "WM3"
        };
        
        console.log('[MapTab] Loading map...');
        const rawMapData = await loadMap(mapId[mapType]);
        console.log(`[MapTab] Loaded ${mapType} map:`, rawMapData);
        setWorldmap(parseWorldmap(rawMapData));
      } catch (error) {
        setMessage(error as string, true);
      }
    }

    load();
  }, [opened, openedTime, mapType, enabledAlternatives]);

  const parseWorldmap = (rawMapData: MapFile) => {
    if (!rawMapData) return null;

    // 2D array containing rows and columns of meshes
    const data: Mesh[][] = [];

    const MESHES_IN_ROW = 4;
    const MESHES_IN_COLUMN = 4;

    // Map dimensions for different map types
    const dimensions = {
      overworld: { horizontal: 9, vertical: 7 },
      underwater: { horizontal: 3, vertical: 4 },
      glacier: { horizontal: 2, vertical: 2 }
    };

    const { horizontal: SECTIONS_HORIZONTAL, vertical: SECTIONS_VERTICAL } = dimensions[mapType as keyof typeof dimensions];

    for (let row = 0; row < SECTIONS_VERTICAL * MESHES_IN_ROW; row++) {
      const rowData: Mesh[] = [];
      for (let column = 0; column < SECTIONS_HORIZONTAL * MESHES_IN_COLUMN; column++) {
        const sectionIdx = Math.floor(row / MESHES_IN_ROW) * SECTIONS_HORIZONTAL + Math.floor(column / MESHES_IN_COLUMN);
        const meshIdx = (row % MESHES_IN_ROW) * MESHES_IN_COLUMN + (column % MESHES_IN_COLUMN);
        let trueSectionIdx = sectionIdx;
        if (ALTERNATIVE_SECTIONS.some(alt => alt.id === sectionIdx && enabledAlternatives.includes(alt.id))) {
          trueSectionIdx = 63 + ALTERNATIVE_SECTIONS.findIndex(alt => alt.id === sectionIdx);
        }
        rowData.push(rawMapData.readMesh(trueSectionIdx, meshIdx));
      }
      data.push(rowData);
    }

    return data;
  }

  useEffect(() => {
    if (selectedTriangle) {
      console.debug("Selected triangle", selectedTriangle);
      const texture = textures[selectedTriangle.texture];
      console.debug("Texture", texture);
    }
  }, [selectedTriangle]);

  return (
    <div className="flex h-full w-full">
      <div className="flex-1">
        <MapViewer 
          worldmap={worldmap} 
          mapType={mapType} 
          renderingMode={renderingMode} 
          onTriangleSelect={setSelectedTriangle}
        />
      </div>
      <div className="w-64 border-l bg-background p-4">
        <div>
          <div className="mt-2 space-y-2">
            <div className="space-y-1.5">
              <Label htmlFor="map-type">Type</Label>
              <Select value={mapType} onValueChange={(value: MapType) => setMapType(value)}>
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
                    setEnabledAlternatives(prev => 
                      checked 
                        ? [...prev, section.id]
                        : prev.filter(id => id !== section.id)
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
          <h3 className="text-sm font-medium">Triangle</h3>
          <div className="mt-2">
            {selectedTriangle ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <Label>Properties</Label>
                    <div className="rounded-md border bg-muted/50 p-2 space-y-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help flex justify-between text-xs">
                              <span className="text-muted-foreground">Type</span>
                              <span className="font-medium">
                                {TRIANGLE_TYPES[selectedTriangle.type]?.type ?? `Unknown (${selectedTriangle.type})`}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{TRIANGLE_TYPES[selectedTriangle.type]?.description ?? 'Unknown type'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Script ID</span>
                        <span className="font-medium">{selectedTriangle.script}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Region</span>
                        <span className="font-medium">
                          {REGION_NAMES[selectedTriangle.locationId] ?? `Unknown (${selectedTriangle.locationId})`}
                        </span>
                      </div>
                      {selectedTriangle.isChocobo ? (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Chocobo</span>
                          <span className="font-medium">Yes</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Vertices</Label>
                    <div className="rounded-md border bg-muted/50 p-2">
                      <div className="grid grid-cols-[1.5rem_repeat(3,1fr)] gap-x-2 text-xs">
                        <div className="text-muted-foreground">#</div>
                        <div className="text-muted-foreground text-right">X</div>
                        <div className="text-muted-foreground text-right">Y</div>
                        <div className="text-muted-foreground text-right">Z</div>
                        {[
                          { label: "0", vertex: selectedTriangle.vertex0 },
                          { label: "1", vertex: selectedTriangle.vertex1 },
                          { label: "2", vertex: selectedTriangle.vertex2 }
                        ].map(({ label, vertex }) => (
                          <React.Fragment key={label}>
                            <div className="text-muted-foreground">{label}</div>
                            <div className="text-right font-medium">{vertex.x.toFixed(0)}</div>
                            <div className="text-right font-medium">{vertex.y.toFixed(0)}</div>
                            <div className="text-right font-medium">{vertex.z.toFixed(0)}</div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Texture</Label>
                    <div className="rounded-md border bg-muted/50 p-2 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">ID</span>
                        <span className="font-medium">{textures[selectedTriangle.texture]?.name ?? 'Unknown'} ({selectedTriangle.texture})</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Size</span>
                        <span className="font-medium">{textures[selectedTriangle.texture]?.width ?? '?'}×{textures[selectedTriangle.texture]?.height ?? '?'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">UV Offset</span>
                        <span className="font-medium">({textures[selectedTriangle.texture]?.uOffset ?? '?'}, {textures[selectedTriangle.texture]?.vOffset ?? '?'})</span>
                      </div>
                      <div className="grid grid-cols-[1.5rem_repeat(2,1fr)] gap-x-2 text-xs">
                        <div className="text-muted-foreground">#</div>
                        <div className="text-muted-foreground text-right">U</div>
                        <div className="text-muted-foreground text-right">V</div>
                        {[
                          { label: "0", u: selectedTriangle.uVertex0, v: selectedTriangle.vVertex0 },
                          { label: "1", u: selectedTriangle.uVertex1, v: selectedTriangle.vVertex1 },
                          { label: "2", u: selectedTriangle.uVertex2, v: selectedTriangle.vVertex2 }
                        ].map(({ label, u, v }) => (
                          <React.Fragment key={label}>
                            <div className="text-muted-foreground">{label}</div>
                            <div className="text-right font-medium">{u}</div>
                            <div className="text-right font-medium">{v}</div>
                          </React.Fragment>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2" 
                        onClick={() => setIsUVEditorOpen(true)}
                      >
                        UV Editor
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground rounded-md border bg-muted/50 p-2">
                Click on the map to select a triangle
              </div>
            )}
          </div>
        </div>
      </div>
      <UVEditorModal 
        isOpen={isUVEditorOpen} 
        setIsOpen={setIsUVEditorOpen} 
        triangle={selectedTriangle} 
      />
    </div>
  );
}
