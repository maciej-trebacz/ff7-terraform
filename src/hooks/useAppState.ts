import { atom, useAtom } from 'jotai'

interface AppState {
  dataPath: string | null
  opened: boolean
  openedTime: number
  alert: {
    show: boolean
    title: string
    message: string
  }
}

const appStateAtom = atom<AppState>({
  dataPath: null,
  opened: false,
  openedTime: 0,
  alert: {
    show: false,
    title: '',
    message: ''
  }
})

export function useAppState() {
  const [state, setState] = useAtom(appStateAtom)

  const setDataPath = (path: string) => {
    setState(prev => ({
      ...prev,
      dataPath: path,
      opened: true,
      openedTime: Date.now()
    }))
  }

  const showAlert = (title: string, message: string) => {
    setState(prev => ({
      ...prev,
      alert: {
        show: true,
        title,
        message
      }
    }))
  }

  const hideAlert = () => {
    setState(prev => ({
      ...prev,
      alert: {
        show: false,
        title: '',
        message: ''
      }
    }))
  }

  return {
    dataPath: state.dataPath,
    opened: state.opened,
    openedTime: state.openedTime,
    alert: state.alert,
    setDataPath,
    showAlert,
    hideAlert
  }
} 