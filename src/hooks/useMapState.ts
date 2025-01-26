import { atom, useAtom } from 'jotai'
import { readFile } from "@tauri-apps/plugin-fs"
import { useAppState } from './useAppState'
import { MapFile } from '@/ff7/mapfile'
import { TexFile, WorldMapTexture } from '@/ff7/texfile'
import { useLgpState } from './useLgpState'
import { WORLD_MAP_TEXTURES } from '@/lib/map-data'

export type MapId = 'WM0' | 'WM2' | 'WM3'

interface MapState {
  mapId: MapId | null
  map: MapFile | null
  textures: WorldMapTexture[]
}

const mapStateAtom = atom<MapState>({
  mapId: null,
  map: null,
  textures: []
})

// World map texture metadata


export function useMapState() {
  const [state, setState] = useAtom(mapStateAtom)
  const { dataPath } = useAppState()
  const { getFile } = useLgpState()

  const loadTextures = async () => {
    console.debug("[Map] Loading textures")
    const textures = WORLD_MAP_TEXTURES.map(texture => ({ ...texture, tex: null }));

    // Load textures in parallel
    const loadPromises = textures.map(async texture => {
      const filename = `${texture.name}.tex`
      try {
        const fileData = await getFile(filename)
        if (fileData) {
          texture.tex = new TexFile(fileData)
          console.log(`[Map] Loaded texture: ${filename}`)
        } else {
          console.warn(`[Map] Failed to load texture: ${filename}`)
        }
      } catch (error) {
        console.error(`[Map] Error loading texture ${filename}:`, error)
      }
    });

    await Promise.all(loadPromises);
    console.log(`[Map] Loaded ${textures.filter(t => t.tex !== null).length}/${textures.length} textures`)

    setState(prev => ({ ...prev, textures }))
    return textures
  }

  const loadMap = async (mapId: MapId) => {
    console.debug("[Map] Loading map:", mapId)
    const path = `${dataPath}/data/wm/${mapId}.MAP`
    const fileData = await readFile(path)
    if (!fileData) {
      console.error("Failed to read map file:", path)
      return
    }

    const mapData = new MapFile(fileData)

    setState(prev => ({ ...prev, mapId: mapId, map: mapData }))
    return mapData
  }

  return {
    mapId: state.mapId,
    map: state.map,
    textures: state.textures,
    loadMap,
    loadTextures
  }
} 