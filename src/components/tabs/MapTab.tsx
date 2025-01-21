import { Card } from "@/components/ui/card";
import { MapFile, Mesh } from "@/ff7/mapfile";
import { useAppState } from "@/hooks/useAppState";
import { useMapState } from "@/hooks/useMapState";
import { useStatusBar } from "@/hooks/useStatusBar";
import { useEffect, useMemo, useState } from "react";
import MapViewer from "./MapViewer";

export function MapTab() {
  const { loadMap, map } = useMapState();
  const { opened, openedTime } = useAppState();
  const { setMessage } = useStatusBar();

  const [worldmap, setWorldmap] = useState<Mesh[][] | null>(null);

  useEffect(() => {
    async function load() {
      if (!opened) return;
      try {
        const rawMapData = await loadMap("WM0");
        console.debug("[Map] Loaded map:", rawMapData);
        setWorldmap(parseWorldmap(rawMapData));
      } catch (error) {
        setMessage(error as string, true);
      }
    }

    load();
  }, [opened, openedTime]);

  const parseWorldmap = (rawMapData: MapFile) => {
    if (!rawMapData) return null;

    // 2D array containing rows and columns of meshes
    const data: Mesh[][] = [];

    const MESHES_IN_ROW = 4;
    const MESHES_IN_COLUMN = 4;
    const SECTIONS_HORIZONTAL = 9;
    const SECTIONS_VERTICAL = 7;

    for (let row = 0; row < SECTIONS_VERTICAL * MESHES_IN_ROW; row++) {
      const rowData: Mesh[] = [];
      for (let column = 0; column < SECTIONS_HORIZONTAL * MESHES_IN_COLUMN; column++) {
        const sectionIdx = Math.floor(row / MESHES_IN_ROW) * SECTIONS_HORIZONTAL + Math.floor(column / MESHES_IN_COLUMN);
        const meshIdx = (row % MESHES_IN_ROW) * MESHES_IN_COLUMN + (column % MESHES_IN_COLUMN);
        rowData.push(rawMapData.readMesh(sectionIdx, meshIdx));
      }
      data.push(rowData);
    }

    return data;
  }

  return (
          <MapViewer worldmap={worldmap} />
  );
}
