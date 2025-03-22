import { atom, useAtom } from 'jotai'
import { useStatusBar } from './useStatusBar'
import { useLgpState } from './useLgpState'
import { MapId } from './useMapState'
import { EvFile, FF7Function, FunctionType, SystemFunction, ModelFunction, MeshFunction } from '@/ff7/evfile'

interface SelectedScript {
  type: FunctionType
  id: number
  modelId?: number
  aliasId?: number
  x?: number
  y?: number
}

interface ScriptsState {
  functions: FF7Function[]
  selectedMap: MapId
  scriptType: FunctionType
  selectedScript: SelectedScript | null
  ev: EvFile | null
  decompiled: boolean
  decompiledScripts: Record<string, string> // Map of script keys to decompiled content
}

const scriptsStateAtom = atom<ScriptsState>({
  functions: [],
  selectedMap: 'WM0',
  scriptType: FunctionType.System,
  selectedScript: null,
  ev: null,
  decompiled: false,
  decompiledScripts: {}
})

export function useScriptsState() {
  const [state, setState] = useAtom(scriptsStateAtom)
  const { setMessage } = useStatusBar()
  const { getFile } = useLgpState()

  const loadScripts = async (mapId?: MapId) => {
    try {
      // Clear existing scripts first
      setState(prev => ({
        ...prev,
        functions: [],
        selectedScript: null,
        ev: null,
        decompiledScripts: {} // Clear decompiled scripts when loading new scripts
      }))

      const targetMap = mapId || state.selectedMap
      console.debug("[Scripts] Loading scripts for map", targetMap)

      const evData = await getFile(targetMap.toLowerCase() + '.ev')
      if (!evData) {
        console.error("Failed to read ev file")
        return
      }

      console.debug("[Scripts] Parsing ev file")

      const evFile = new EvFile(evData)
      setState(prev => ({
        ...prev,
        functions: evFile.functions,
        ev: evFile
      }))

      console.debug("[Scripts] Scripts loaded", evFile.functions)
    } catch (error) {
      console.error("Error loading scripts:", error)
      setMessage("Failed to load scripts: " + (error as Error).message, true)
    }
  }

  const setSelectedMap = (map: MapId) => {
    setState(prev => ({ ...prev, selectedMap: map }))
  }

  const setScriptType = (type: FunctionType) => {
    setState(prev => ({ ...prev, scriptType: type, selectedScript: null }))
  }

  const selectScript = (script: FF7Function) => {
    const selection: SelectedScript = {
      type: script.type,
      id: script.id,
      aliasId: script.aliasId,
      ...(script.type === FunctionType.Model && { modelId: script.modelId }),
      ...(script.type === FunctionType.Mesh && { x: script.x, y: script.y })
    }
    setState(prev => ({ ...prev, selectedScript: selection }))
  }

  const isScriptSelected = (script: FF7Function): boolean => {
    if (!state.selectedScript) return false

    switch (script.type) {
      case FunctionType.System:
        return state.selectedScript.type === script.type && state.selectedScript.id === script.id
      case FunctionType.Model:
        return state.selectedScript.type === script.type && 
               state.selectedScript.id === script.id && 
               state.selectedScript.modelId === script.modelId
      case FunctionType.Mesh:
        return state.selectedScript.type === script.type && 
               state.selectedScript.id === script.id && 
               state.selectedScript.x === script.x && 
               state.selectedScript.y === script.y
    }
  }

  const getSelectedScript = (): FF7Function | null => {
    if (!state.selectedScript) return null

    return state.functions.find(f => isScriptSelected(f)) || null
  }

  const updateSelectedScript = (updates: Partial<FF7Function>) => {
    const currentScript = getSelectedScript()
    if (!currentScript) return

    console.debug("[Scripts] Updating script", currentScript.id, updates)

    // Update the script in the functions array
    setState(prev => {
      const updatedFunctions = prev.functions.map(fn => {
        if (!isScriptSelected(fn)) return fn

        switch (fn.type) {
          case FunctionType.System:
            return {
              ...fn,
              ...updates
            } as SystemFunction
          case FunctionType.Model:
            return {
              ...fn,
              ...updates
            } as ModelFunction
          case FunctionType.Mesh:
            return {
              ...fn,
              ...updates
            } as MeshFunction
        }
      })

      return {
        ...prev,
        functions: updatedFunctions
      }
    })

    // Also update the selection state if needed
    if ('type' in updates || 'id' in updates || 'modelId' in updates || 'x' in updates || 'y' in updates) {
      selectScript({
        ...currentScript,
        ...updates
      } as FF7Function)
    }
  }

  const setDecompiledMode = (enabled: boolean) => {
    setState(prev => ({ ...prev, decompiled: enabled }))
  }

  const getScriptKey = (script: FF7Function): string => {
    switch (script.type) {
      case FunctionType.System:
        return `sys-${script.id}`
      case FunctionType.Model:
        return `mdl-${script.modelId}-${script.id}`
      case FunctionType.Mesh:
        return `mesh-${script.x}-${script.y}-${script.id}`
    }
  }

  const getDecompiledScript = (script: FF7Function): string => {
    const key = getScriptKey(script)
    return state.decompiledScripts[key] || ''
  }

  const updateDecompiledScript = (script: FF7Function, content: string) => {
    const key = getScriptKey(script)
    setState(prev => ({
      ...prev,
      decompiledScripts: {
        ...prev.decompiledScripts,
        [key]: content
      }
    }))
  }

  return {
    functions: state.functions,
    selectedMap: state.selectedMap,
    scriptType: state.scriptType,
    selectedScript: state.selectedScript,
    ev: state.ev,
    decompiled: state.decompiled,
    loadScripts,
    setSelectedMap,
    setScriptType,
    selectScript,
    isScriptSelected,
    getSelectedScript,
    updateSelectedScript,
    setDecompiledMode,
    getDecompiledScript,
    updateDecompiledScript,
    getScriptKey
  }
} 