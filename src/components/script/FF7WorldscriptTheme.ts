import { EditorView } from '@codemirror/view';

// Define colors
const white = '#ffffff';
const orangeRed = '#e74c3c';
const darkGray = '#1e1e1e';
const lightGray = '#cccccc';
const commentColor = '#6a737d';
const namespaceColor = '#c678dd';  // Purple
const variableColor = '#e6c07b';   // Yellow-gold (for functions and constants)
const operatorColor = '#56b6c2';   // Cyan
const labelColor = '#ff79c6';      // Pink
const punctuationColor = '#abb2bf'; // Light gray
const stringColor = '#98c379';     // Green

export const ff7WorldscriptBaseTheme = EditorView.theme({
  '&': {
    backgroundColor: darkGray,
    color: lightGray,
    height: '100%',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  '.cm-content': { caretColor: lightGray },
  '.cm-cursor': { borderLeftColor: lightGray },
  '.cm-gutters': {
    backgroundColor: darkGray,
    color: '#555',
    border: 'none',
  },
  '.cm-activeLine': { backgroundColor: '#333' },
  '.cm-selectionBackground': { backgroundColor: '#444' },
  
  // Token styles
  '.cm-keyword': { color: white, fontWeight: 'bold' },
  '.cm-operator': { color: operatorColor },
  '.cm-number': { color: orangeRed },
  '.cm-string': { color: stringColor },
  '.cm-comment': { color: commentColor, fontStyle: 'italic' },
  '.cm-label': { color: labelColor },
  '.cm-labelDelimiter': { color: labelColor },
  '.cm-namespace': { color: namespaceColor },
  '.cm-variable': { color: variableColor },
  '.cm-punct': { color: punctuationColor },
});

export const ff7WorldscriptTheme = [ff7WorldscriptBaseTheme];