import { atom, useAtom } from 'jotai'
import { readFile, writeFile } from "@tauri-apps/plugin-fs"
import { useAppState } from './useAppState'
import { MapFile } from '@/ff7/mapfile'

export type MapId = 'WM0' | 'WM2' | 'WM3'

interface MapState {
  mapId: MapId | null
  map: MapFile | null
}

const mapStateAtom = atom<MapState>({
  mapId: null,
  map: null
})

export function useMapState() {
  const [state, setState] = useAtom(mapStateAtom)
  const { dataPath } = useAppState()

  const loadMap = async (mapId: MapId) => {
    console.debug("[Map] Loading map:", mapId)
    const path = `${dataPath}/data/wm/${mapId}.MAP`
    const fileData = await readFile(path)
    if (!fileData) {
      console.error("Failed to read map file:", path)
      return
    }

    const mapData = new MapFile(fileData)

    setState({ mapId: mapId, map: mapData })
    return mapData
  }

  return {
    mapId: state.mapId,
    map: state.map,
    loadMap
  }
} 