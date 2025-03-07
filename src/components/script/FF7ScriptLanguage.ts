import { LanguageSupport, StreamLanguage } from '@codemirror/language'
import { CompletionContext, CompletionResult, autocompletion } from '@codemirror/autocomplete'
import { Mnemonic } from '@/ff7/worldscript/opcodes'

// Create a list of all mnemonics for autocomplete
const mnemonicValues = Object.values(Mnemonic)

// Define the FF7 script language for syntax highlighting
export function createFF7ScriptLanguage() {
  return StreamLanguage.define({
    name: 'ff7script',
    
    startState: () => ({
      inComment: false
    }),
    
    token: (stream, state) => {
      // Handle comments (lines starting with #)
      if (stream.sol() && stream.peek() === '#') {
        stream.skipToEnd()
        return 'comment'
      }
      
      // Skip whitespace
      if (stream.eatSpace()) return null
      
      // Check for mnemonics (keywords)
      const word = stream.match(/[A-Z_]+/)
      if (word && mnemonicValues.includes(word[0] as Mnemonic)) {
        return 'keyword'
      }
      
      // Check for hex numbers with 0x prefix (2 or 4 digits)
      if (stream.match(/0x[0-9A-Fa-f]{2,4}\b/)) {
        return 'number'
      }
      
      // Check for hex numbers without 0x prefix (2 or 4 digits)
      // This will match patterns like 03E8 or 03DB
      if (stream.match(/\b[0-9A-Fa-f]{2,4}\b/)) {
        // Only treat it as a hex number if it contains at least one A-F character
        const match = stream.string.substring(stream.start - 4, stream.pos);
        if (/[A-Fa-f]/.test(match)) {
          return 'number';
        }
      }
      
      // Check for regular numbers
      if (stream.match(/\b\d+\b/)) {
        return 'number'
      }
      
      // Skip any other character
      stream.next()
      return null
    }
  })
}

// Autocomplete function for FF7 script mnemonics
export function ff7ScriptCompletion(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\w*/)
  if (!word || word.from === word.to && !context.explicit) return null
  
  return {
    from: word.from,
    options: mnemonicValues.map(mnemonic => ({
      label: mnemonic,
      type: 'keyword'
    }))
  }
}

// Create the language support with autocomplete
export function ff7ScriptLanguage() {
  return new LanguageSupport(
    createFF7ScriptLanguage(),
    [autocompletion({ override: [ff7ScriptCompletion] })]
  )
} 