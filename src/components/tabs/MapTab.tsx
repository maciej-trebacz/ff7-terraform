import { Triangle } from "@/ff7/mapfile";
import { useAppState } from "@/hooks/useAppState";
import { MapType, MapMode, useMapState } from "@/hooks/useMapState";
import { useStatusBar } from "@/hooks/useStatusBar";
import { useEffect, useState } from "react";
import MapViewer from "../map/MapViewer";
import { SelectionSidebar } from "@/components/map/components/SelectionSidebar";
import { ExportImportSidebar } from "@/components/map/components/ExportImportSidebar";
import { PaintingSidebar } from "@/components/map/components/PaintingSidebar";
import { GridSelectionProvider } from '@/contexts/GridSelectionContext';

type MapId = "WM0" | "WM2" | "WM3";
type RenderingMode = "terrain" | "textured" | "region" | "scripts";

const MAP_ID_BY_TYPE: Record<MapType, MapId> = {
  overworld: "WM0",
  underwater: "WM2",
  glacier: "WM3"
};

export function MapTab() {
  const { loadMap, loadTextures, textures, worldmap, mapType: currentMapType, mode, setMode, enabledAlternatives, setEnabledAlternatives } = useMapState();
  const { opened, openedTime } = useAppState();
  const { setMessage, setMapInfo } = useStatusBar();

  const [selectedTriangle, setSelectedTriangle] = useState<Triangle | null>(null);
  const [renderingMode, setRenderingMode] = useState<RenderingMode>("terrain");
  const [isLoading, setIsLoading] = useState(false);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    async function load() {
      if (!opened) return;
      try {
        setIsLoading(true);
        setSelectedTriangle(null); // Reset selected triangle
        setMapInfo(currentMapType, null); // Show loading state
        
        console.log('[MapTab] Loading map and textures for', currentMapType);
        await loadTextures(currentMapType);
        await loadMap(MAP_ID_BY_TYPE[currentMapType], currentMapType);
        
        // Update status with map info
        if (worldmap) {
          setMapInfo(currentMapType, { length: worldmap.length, width: worldmap[0]?.length });
        }
      } catch (error) {
        setMessage(error as string, true);
      } finally {
        console.log('[MapTab] Loading complete');
        setIsLoading(false);
      }
    }

    load();
  }, [opened, openedTime, currentMapType]);

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

  const handleModeChange = (newMode: MapMode) => {
    setMode(newMode);
    if (newMode !== 'selection') {
      setSelectedTriangle(null);
    }
  };

  return (
    <GridSelectionProvider>
      <div className="flex h-full w-full">
        <div className="flex-1">
          <MapViewer 
            renderingMode={renderingMode} 
            showGrid={showGrid}
            onTriangleSelect={mode === 'selection' ? setSelectedTriangle : undefined}
            isLoading={isLoading}
            cameraType={mode === 'export' ? 'orthographic' : 'perspective'}
            wireframe={showWireframe}
            onWireframeToggle={setShowWireframe}
            onGridToggle={setShowGrid}
            onRenderingModeChange={setRenderingMode}
            onMapTypeChange={(type: MapType) => loadMap(MAP_ID_BY_TYPE[type], type)}
            onModeChange={handleModeChange}
            enabledAlternatives={enabledAlternatives}
            onAlternativesChange={setEnabledAlternatives}
            showNormals={true}
          />
        </div>
        <div className="w-[300px] border-l bg-background pl-3 pr-2 pt-2">
          {mode === 'export' ? (
            <ExportImportSidebar />
          ) : mode === 'painting' ? (
            <PaintingSidebar />
          ) : (
            <SelectionSidebar
              selectedTriangle={selectedTriangle}
              textures={textures}
              onVertexChange={handleVertexChange}
            />
          )}
        </div>
      </div>
    </GridSelectionProvider>
  );
}
