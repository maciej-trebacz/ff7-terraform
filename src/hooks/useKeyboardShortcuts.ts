import { useEffect, useCallback } from 'react'

export type KeyboardShortcut = {
  key: string
  ctrlOrCmd?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when user is typing in input fields
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.contentEditable === 'true'
    ) {
      return
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      // Check if the pressed key matches
      if (shortcut.key.toLowerCase() !== event.key.toLowerCase()) {
        return false
      }

      // Check modifiers
      const ctrlOrCmdPressed = isMac ? event.metaKey : event.ctrlKey
      // const shiftPressed = event.shiftKey
      // const altPressed = event.altKey

      // For shortcuts with ctrlOrCmd, check the appropriate modifier
      if (shortcut.ctrlOrCmd) {
        if (!ctrlOrCmdPressed) return false
        if (event.altKey !== !!shortcut.alt) return false
        if (event.shiftKey !== !!shortcut.shift) return false
      } else {
        // For shortcuts without ctrlOrCmd, check exact modifier match
        if (event.ctrlKey !== !!shortcut.ctrlOrCmd) return false
        if (event.altKey !== !!shortcut.alt) return false
        if (event.shiftKey !== !!shortcut.shift) return false
      }

      return true
    })

    if (matchingShortcut) {
      event.preventDefault()
      event.stopPropagation()
      matchingShortcut.action()
    }
  }, [shortcuts, isMac])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

// Helper function to get the display string for a shortcut
export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const parts: string[] = []

  if (shortcut.ctrlOrCmd) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt')
  }
  if (shortcut.shift) {
    parts.push('⇧')
  }

  parts.push(shortcut.key.toUpperCase())

  return parts.join(isMac ? '' : '+')
}
