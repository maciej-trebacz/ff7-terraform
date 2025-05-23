import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import 'ace-builds/src-noconflict/ext-language_tools';
import { setCompleters } from 'ace-builds/src-noconflict/ext-language_tools';
import './AceOpcodes.js';
import { useEffect } from 'react';
import { Mnemonic } from '@/ff7/worldscript/opcodes';

interface OpcodesEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function OpcodesEditor({ value, onChange, className }: OpcodesEditorProps) {
  const mnemonicValues = Object.values(Mnemonic);
  
  useEffect(() => {
    setCompleters([
      {
        getCompletions: (_editor, _session, _pos, _prefix, callback) => {
          callback(null, mnemonicValues.map(completion => ({
            name: completion,
            value: completion,
            caption: completion,
            meta: 'keyword',
            score: 1000,
          })));
        }
      }
    ]);
  }, []);

  return (
    <AceEditor
      mode="ff7opcodes"
      theme="tomorrow_night"
      onChange={onChange}
      value={value}
      name="ff7opcodes-editor"
      editorProps={{ $blockScrolling: true }}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: false,
        enableSnippets: false,
        showLineNumbers: true,
        tabSize: 2,
        useSoftTabs: true,
        showPrintMargin: false,
        fontSize: 12,
        highlightActiveLine: true,
        highlightGutterLine: true,
      }}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
} 