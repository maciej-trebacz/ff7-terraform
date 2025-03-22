import { Editor, PrismEditor } from "prism-react-editor"
import { BasicSetup } from "prism-react-editor/setups"
import { useAutoComplete, fuzzyFilter, completeSnippets, registerCompletions } from "prism-react-editor/autocomplete"
import {
  completeIdentifiers,
  completeKeywords,
  // completeScope,
  globalReactAttributes,
  jsContext,
  jsDocCompletion,
  jsSnipets,
  jsxTagCompletion,
  reactTags,
} from 'prism-code-editor/autocomplete/javascript';
import {
  markupCompletion,
  htmlTags,
  globalHtmlAttributes,
  svgTags,
  globalSvgAttributes,
} from 'prism-code-editor/autocomplete/markup';


import "prism-react-editor/prism/languages/jsx"
import "prism-react-editor/languages/jsx"

import "prism-react-editor/layout.css"
import "prism-react-editor/themes/github-dark.css"

import "prism-react-editor/search.css"

interface WorldscriptEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

const EditorSetup = ({ editor }: { editor: PrismEditor }) => {
  useAutoComplete(editor, {
    filter: fuzzyFilter,
  })
  return <BasicSetup editor={editor} />
}

export function WorldscriptEditor({ value, onChange, className }: WorldscriptEditorProps) {

  return (
    <Editor language="jsx" value={value} style={{ 
      width: '100%', 
      height: '100%',
      display: 'grid' // Required for proper editor layout
    }}>
      {editor => <EditorSetup editor={editor} />}
    </Editor>    
  )
} 

registerCompletions(["javascript", "js", "jsx", "tsx", "typescript", "ts"], {
	context: jsContext,
	sources: [
		// completeScope(window),
		completeIdentifiers(),
		completeKeywords,
		jsDocCompletion,
		jsxTagCompletion(reactTags, globalReactAttributes),
		completeSnippets(jsSnipets),
	],
})