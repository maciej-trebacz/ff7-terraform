import { atom, useAtom } from 'jotai'
import { readFile, writeFile } from "@tauri-apps/plugin-fs"
import { useAppState } from './useAppState'
import { MapFile, Mesh } from '@/ff7/mapfile'
import { TexFile, WorldMapTexture } from '@/ff7/texfile'
import { useLgpState } from './useLgpState'
import { WORLD_MAP_GLACIER_TEXTURES, WORLD_MAP_OVERWORLD_TEXTURES, WORLD_MAP_UNDERWATER_TEXTURES } from '@/lib/map-data'
import { useCallback } from 'react'

export type MapId = 'WM0' | 'WM2' | 'WM3'
export type MapType = 'overworld' | 'underwater' | 'glacier'

const ALTERNATIVE_SECTIONS = [
  { id: 50, name: "Temple of Ancients gone" },
  { id: 41, name: "Junon Area crater (left)" },
  { id: 42, name: "Junon Area crater (right)" },
  { id: 60, name: "Mideel after Lifestream" },
  { id: 47, name: "Cosmo Canyon crater (left)" },
  { id: 48, name: "Cosmo Canyon crater (right)" },
] as const;

interface MapState {
  mapId: MapId | null
  mapType: MapType
  map: MapFile | null
  worldmap: Mesh[][] | null
  textures: WorldMapTexture[]
  enabledAlternatives: number[]
  changedMeshes: [number, number][]
}

const mapStateAtom = atom<MapState>({
  mapId: null,
  mapType: 'overworld',
  map: null,
  worldmap: null,
  textures: [],
  enabledAlternatives: [],
  changedMeshes: []
})

const MESHES_IN_ROW = 4;
const MESHES_IN_COLUMN = 4;

// Map dimensions for different map types
const dimensions = {
  overworld: { horizontal: 9, vertical: 7 },
  underwater: { horizontal: 3, vertical: 4 },
  glacier: { horizontal: 2, vertical: 2 }
};

export function useMapState() {
  const [state, setState] = useAtom(mapStateAtom)
  const { dataPath } = useAppState()
  const { getFile } = useLgpState()

  const getTexturesForMapType = (mapType: MapType): WorldMapTexture[] => {
    switch (mapType) {
      case 'underwater':
        return WORLD_MAP_UNDERWATER_TEXTURES;
      case 'glacier':
        return WORLD_MAP_GLACIER_TEXTURES;
      default:
        return WORLD_MAP_OVERWORLD_TEXTURES;
    }
  }

  const parseWorldmap = (rawMapData: MapFile, mapType: MapType, enabledAlternatives: number[]) => {
    if (!rawMapData) return null;

    console.time("[Map] Parsing worldmap")
    // 2D array containing rows and columns of meshes
    const data: Mesh[][] = [];


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

    console.timeEnd("[Map] Parsing worldmap")
    return data;
  }

  const loadTextures = async (mapType: MapType) => {
    console.debug("[Map] Loading textures for", mapType)
    const textures = getTexturesForMapType(mapType).map(texture => ({ ...texture, tex: null }));

    // Load textures in parallel
    const loadPromises = textures.map(async texture => {
      const filename = `${texture.name}.tex`
      try {
        const fileData = await getFile(filename)
        if (fileData) {
          texture.tex = new TexFile(fileData)
        } else {
          console.warn(`[Map] Failed to load texture: ${filename}`)
        }
      } catch (error) {
        console.error(`[Map] Error loading texture ${filename}:`, error)
      }
    });

    await Promise.all(loadPromises);
    console.log(`[Map] Loaded ${textures.filter(t => t.tex !== null).length}/${textures.length} textures`)

    setState(prev => ({ ...prev, textures, mapType }))
    return textures
  }

  const loadMap = async (mapId: MapId, mapType: MapType) => {
    console.debug("[Map] Loading map:", mapId)
    const path = `${dataPath}/data/wm/${mapId}.MAP`
    const fileData = await readFile(path)
    if (!fileData) {
      console.error("Failed to read map file:", path)
      return
    }

    const botPath = `${dataPath}/data/wm/${mapId}.BOT`
    const botData = await readFile(botPath)
    const botMap = new MapFile(botData)
    botMap.readBot(botData);

    const mapData = new MapFile(fileData)
    const worldmapData = parseWorldmap(mapData, mapType, state.enabledAlternatives)

    setState(prev => ({ ...prev, mapId, mapType, map: mapData, worldmap: worldmapData }))
    return mapData
  }

  const setEnabledAlternatives = (alternatives: number[]) => {
    setState(prev => {
      const worldmapData = prev.map ? parseWorldmap(prev.map, prev.mapType, alternatives) : null;
      return { ...prev, enabledAlternatives: alternatives, worldmap: worldmapData };
    });
  }

  const addChangedMesh = useCallback((row: number, col: number) => {
    setState(prev => {
      const newMesh = [row, col] as [number, number];
      const exists = prev.changedMeshes.some(([r, c]) => r === row && c === col);
      if (!exists) {
        return {
          ...prev,
          changedMeshes: [...prev.changedMeshes, newMesh]
        };
      }
      return prev;
    });
  }, [setState]);

  const saveMap = async () => {
    if (!state.map) return;

    console.debug(`Changed ${state.changedMeshes.length} meshes`, state.changedMeshes)
    console.time("[Map] Saving map")
    state.changedMeshes.forEach(mesh => {
      const [row, col] = mesh
      const sectionIdx = Math.floor(row / MESHES_IN_ROW) * dimensions[state.mapType as keyof typeof dimensions].horizontal + Math.floor(col / MESHES_IN_COLUMN);
      const meshIdx = (row % MESHES_IN_ROW) * MESHES_IN_COLUMN + (col % MESHES_IN_COLUMN);
      state.map.writeMesh(sectionIdx, meshIdx, state.worldmap[row][col])
    })

    // for (let row = 0; row < dimensions[state.mapType as keyof typeof dimensions].vertical * MESHES_IN_ROW; row++) {
    //   for (let col = 0; col < dimensions[state.mapType as keyof typeof dimensions].horizontal * MESHES_IN_COLUMN; col++) {
    //     const sectionIdx = Math.floor(row / MESHES_IN_ROW) * dimensions[state.mapType as keyof typeof dimensions].horizontal + Math.floor(col / MESHES_IN_COLUMN);
    //     const meshIdx = (row % MESHES_IN_ROW) * MESHES_IN_COLUMN + (col % MESHES_IN_COLUMN);
    //     state.map.writeMesh(sectionIdx, meshIdx, state.worldmap[row][col])
    //   }
    // }

    const path = `${dataPath}/data/wm/${state.mapId}`
    const mapData = state.map.writeMap()
    await writeFile(path + '.MAP', mapData)
    const botData = state.map.writeBot()
    await writeFile(path + '.BOT', botData)
    console.timeEnd("[Map] Saving map")
  }

  return {
    mapId: state.mapId,
    mapType: state.mapType,
    map: state.map,
    worldmap: state.worldmap,
    textures: state.textures,
    enabledAlternatives: state.enabledAlternatives,
    loadMap,
    saveMap,
    loadTextures,
    setEnabledAlternatives,
    addChangedMesh
  }
} 