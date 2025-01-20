import { atom, useAtom } from 'jotai'
import { debounce } from 'lodash-es'
import { syncMessages } from '@/lib/ff7-data'
import React from 'react'
import { useStatusBar } from './useStatusBar'

interface MessagesState {
  messages: string[]
}

const messagesStateAtom = atom<MessagesState>({
  messages: []
})

export function useMessagesState() {
  const [state, setState] = useAtom(messagesStateAtom)
  const { setMessage } = useStatusBar()
  const timeoutRef = React.useRef<number>()

  const debouncedSync = React.useMemo(
    () => debounce((messages: string[]) => {
      syncMessages(messages)
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
      setMessage('Messages synced with the game')
      timeoutRef.current = window.setTimeout(() => {
        setMessage('')
      }, 2000)
    }, 500),
    []
  )

  const loadMessages = (messages: string[]) => {
    setState(prev => ({
      ...prev,
      messages
    }))
  }

  const updateMessage = (index: number, value: string) => {
    setState(prev => {
      const newMessages = prev.messages.map((msg, i) => i === index ? value : msg)
      debouncedSync(newMessages)
      return {
        ...prev,
        messages: newMessages
      }
    })
  }

  React.useEffect(() => {
    return () => {
      debouncedSync.cancel()
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [debouncedSync])

  return {
    messages: state.messages,
    loadMessages,
    updateMessage
  }
} 