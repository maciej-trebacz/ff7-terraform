import { useEffect, useRef } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, keymap } from '@codemirror/view'
import { history, historyKeymap } from '@codemirror/commands'
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { ff7OpcodesLanguage } from './FF7OpcodesLanguage'
import { ff7OpcodesTheme } from './FF7OpcodesTheme'

interface OpcodesEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

// Create a basic setup similar to the one in @codemirror/basic-setup
const basicSetup = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...closeBracketsKeymap,
    indentWithTab
  ])
]

export function OpcodesEditor({ value, onChange, className }: OpcodesEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    // Clean up any existing editor
    if (editorViewRef.current) {
      editorViewRef.current.destroy()
    }

    // Create a new editor state
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        ff7OpcodesLanguage(),
        ff7OpcodesTheme,
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        })
      ]
    })

    // Create the editor view
    const view = new EditorView({
      state,
      parent: editorRef.current
    })

    editorViewRef.current = view

    return () => {
      view.destroy()
    }
  }, []) // Only run once on mount

  // Update the editor content when the value prop changes
  useEffect(() => {
    const view = editorViewRef.current
    if (!view) return

    const currentContent = view.state.doc.toString()
    if (value !== currentContent) {
      view.dispatch({
        changes: { from: 0, to: currentContent.length, insert: value }
      })
    }
  }, [value])

  return (
    <div 
      ref={editorRef} 
      className={className}
      style={{ 
        width: '100%', 
        height: '100%',
        overflow: 'hidden'
      }}
    />
  )
} 