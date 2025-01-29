import { atom, useAtom } from 'jotai'
import { readFile } from "@tauri-apps/plugin-fs"
import { useAppState } from './useAppState'
import { MapFile } from '@/ff7/mapfile'
import { TexFile, WorldMapTexture } from '@/ff7/texfile'
import { useLgpState } from './useLgpState'
import { WORLD_MAP_GLACIER_TEXTURES, WORLD_MAP_OVERWORLD_TEXTURES, WORLD_MAP_UNDERWATER_TEXTURES } from '@/lib/map-data'

export type MapId = 'WM0' | 'WM2' | 'WM3'
export type MapType = 'overworld' | 'underwater' | 'glacier'

interface MapState {
  mapId: MapId | null
  mapType: MapType
  map: MapFile | null
  textures: WorldMapTexture[]
}

const mapStateAtom = atom<MapState>({
  mapId: null,
  mapType: 'overworld',
  map: null,
  textures: []
})

// World map texture metadata


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

    const mapData = new MapFile(fileData)

    setState(prev => ({ ...prev, mapId, mapType, map: mapData }))
    return mapData
  }

  return {
    mapId: state.mapId,
    mapType: state.mapType,
    map: state.map,
    textures: state.textures,
    loadMap,
    loadTextures
  }
} 