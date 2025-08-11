export interface FieldOption {
  id: number
  label: string
}

let cachedOptions: FieldOption[] | null = null
let cachedById: Record<number, string> | null = null
let loadingPromise: Promise<{ options: FieldOption[]; byId: Record<number, string> }>|null = null

export async function loadFieldOptions(): Promise<{ options: FieldOption[]; byId: Record<number, string> }> {
  if (cachedOptions && cachedById) {
    return { options: cachedOptions, byId: cachedById }
  }
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    const mod = await import('@/data/scenes.json')
    const scenes: any = (mod as any).default ?? mod
    const options: FieldOption[] = Object.values(scenes).map((scene: any) => {
      const name: string = scene.fieldName
      const mapName: string = scene.mapNames && scene.mapNames.length > 0 ? ` (${scene.mapNames[0]})` : ''
      return { id: scene.id as number, label: `${name}${mapName} (ID: ${scene.id})` }
    })
    const byId: Record<number, string> = {}
    for (const opt of options) byId[opt.id] = opt.label
    cachedOptions = options
    cachedById = byId
    return { options, byId }
  })()

  const result = await loadingPromise
  loadingPromise = null
  return result
}


