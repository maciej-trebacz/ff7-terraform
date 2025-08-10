import { atom, useAtom } from 'jotai'
import { useStatusBar } from './useStatusBar'
import { useLgpState } from './useLgpState'
import { EncWFile, EncWData, EncounterSet, EncounterPair, YuffieEncounter, ChocoboRating } from '@/ff7/encwfile'

interface EncountersState {
  file: EncWFile | null
  data: EncWData | null
}

const encountersStateAtom = atom<EncountersState>({
  file: null,
  data: null,
})

async function readEncW(getFile: (name: string) => Promise<Uint8Array | null>): Promise<Uint8Array> {
  // Try common filename variants just in case
  const candidates = ['enc_w.bin', 'enc_w.BIN', 'ENC_W.BIN']
  for (const name of candidates) {
    const buf = await getFile(name)
    if (buf) return buf
  }
  throw new Error('enc_w.bin not found in world_us.lgp')
}

export function useEncountersState() {
  const [state, setState] = useAtom(encountersStateAtom)
  const { setMessage } = useStatusBar()
  const { getFile, setFile } = useLgpState()

  const loadEncounters = async () => {
    try {
      const data = await readEncW(getFile)
      const file = new EncWFile(data)
      setState({ file, data: file.data })
    } catch (error) {
      console.error('[Encounters] Failed to load enc_w.bin', error)
      setMessage('Failed to load encounters: ' + (error as Error).message, true)
    }
  }

  const saveEncounters = async () => {
    try {
      if (!state.file) {
        setMessage('No encounters loaded to save', true)
        return
      }
      const data = state.file.writeFile()
      await setFile('enc_w.bin', data)
      setMessage('Encounters saved successfully!')
    } catch (error) {
      console.error('[Encounters] Failed to save enc_w.bin', error)
      setMessage('Failed to save encounters: ' + (error as Error).message, true)
    }
  }

  const updateYuffie = (index: number, updates: Partial<YuffieEncounter>) => {
    setState(prev => {
      if (!prev.file || !prev.data) return prev
      prev.file.setYuffieEncounter(index, updates)
      const next = structuredClone(prev)
      next.data = prev.file.data
      return next
    })
  }

  const updateChocobo = (index: number, updates: Partial<ChocoboRating>) => {
    setState(prev => {
      if (!prev.file || !prev.data) return prev
      prev.file.setChocoboRating(index, updates)
      const next = structuredClone(prev)
      next.data = prev.file.data
      return next
    })
  }

  const updateEncounterMeta = (
    regionIndex: number,
    setIndex: number,
    updates: Partial<Pick<EncounterSet, 'active' | 'encounterRate'>>
  ) => {
    setState(prev => {
      if (!prev.file || !prev.data) return prev
      prev.file.setEncounterSet(regionIndex, setIndex, updates as Partial<EncounterSet>)
      const next = structuredClone(prev)
      next.data = prev.file.data
      return next
    })
  }

  const updateEncounterPair = (
    regionIndex: number,
    setIndex: number,
    group: 'normal' | 'back' | 'side' | 'pincer' | 'chocobo',
    indexInGroup: number | null,
    updates: Partial<EncounterPair>
  ) => {
    setState(prev => {
      if (!prev.file || !prev.data) return prev
      const set = prev.file.getEncounterSet(regionIndex, setIndex)
      if (group === 'normal' && indexInGroup != null) {
        set.normalEncounters[indexInGroup] = { ...set.normalEncounters[indexInGroup], ...updates }
      } else if (group === 'back' && indexInGroup != null) {
        set.backAttacks[indexInGroup] = { ...set.backAttacks[indexInGroup], ...updates }
      } else if (group === 'side') {
        set.sideAttack = { ...set.sideAttack, ...updates }
      } else if (group === 'pincer') {
        set.pincerAttack = { ...set.pincerAttack, ...updates }
      } else if (group === 'chocobo' && indexInGroup != null) {
        set.chocoboEncounters[indexInGroup] = { ...set.chocoboEncounters[indexInGroup], ...updates }
      }
      prev.file.setEncounterSet(regionIndex, setIndex, set)
      const next = structuredClone(prev)
      next.data = prev.file.data
      return next
    })
  }

  return {
    data: state.data,
    loadEncounters,
    saveEncounters,
    updateYuffie,
    updateChocobo,
    updateEncounterMeta,
    updateEncounterPair,
  }
}


