import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

// Define the colors for our theme
const white = '#ffffff'
const orangeRed = '#e74c3c'
const darkGray = '#1e1e1e'
const darkGray2 = '#2d2d2d'
const lightGray = '#cccccc'
const commentColor = '#6a737d'
const selectionColor = '#3a3d41'
const highlightColor = '#4d4d4d'

// Create the base theme
export const ff7OpcodesBaseTheme = EditorView.theme({
  '&': {
    backgroundColor: darkGray,
    color: lightGray,
    height: '100%',
    fontSize: '12px',
    fontFamily: 'monospace'
  },
  '.cm-content': {
    caretColor: lightGray
  },
  '.cm-cursor': {
    borderLeftColor: lightGray
  },
  '.cm-gutters': {
    backgroundColor: darkGray,
    color: '#555',
    border: 'none'
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#333'
  },
  '.cm-activeLine': {
    backgroundColor: '#333'
  },
  '.cm-selectionMatch': {
    backgroundColor: '#444'
  },
  '.cm-selectionBackground': {
    backgroundColor: '#444'
  },
  
  // Autocomplete popup styling
  '.cm-tooltip': {
    backgroundColor: darkGray2,
    border: '1px solid #444',
    borderRadius: '3px'
  },
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '& > ul': {
      backgroundColor: darkGray2,
      color: lightGray,
      fontFamily: 'monospace',
      fontSize: '12px',
      maxHeight: '200px'
    },
    '& > ul > li': {
      padding: '2px 8px'
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: selectionColor,
      color: white
    },
    '& > ul > li:hover': {
      backgroundColor: highlightColor
    }
  },
  '.cm-completionIcon': {
    marginRight: '8px',
    color: orangeRed
  },
  '.cm-completionLabel': {
    color: lightGray
  },
  '.cm-completionDetail': {
    color: '#888',
    fontSize: '11px',
    marginLeft: '8px'
  },
  '.cm-completionMatchedText': {
    textDecoration: 'none',
    color: white,
    fontWeight: 'bold'
  }
})

// Create the highlight style
export const ff7OpcodesHighlightStyle = HighlightStyle.define([
  // Keywords (mnemonics) in white
  { tag: tags.keyword, color: white },
  
  // Numbers in orange-red
  { tag: tags.number, color: orangeRed },
  
  // Comments in gray
  { tag: tags.comment, color: commentColor, fontStyle: 'italic' },
  
  // Default text color
  { tag: tags.content, color: lightGray }
])

// Export the combined theme
export const ff7OpcodesTheme = [
  ff7OpcodesBaseTheme,
  syntaxHighlighting(ff7OpcodesHighlightStyle)
] 