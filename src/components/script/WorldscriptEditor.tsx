import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import 'ace-builds/src-noconflict/ext-language_tools';
import { setCompleters } from 'ace-builds/src-noconflict/ext-language_tools';
import './AceWorldscript.js';
import { useEffect } from 'react';

interface WorldscriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function WorldscriptEditor({ value, onChange, className }: WorldscriptEditorProps) {
  const completions = [
    "System", "Player", "Entities", "Special", "Memory", "Point", "Window", "Sound", "Savemap", "Entity", "Entities", "Special", "Memory", "Point", "Window", "Sound", "Savemap",
  ];
  useEffect(() => {
    setCompleters([
      {
      getCompletions: (editor, session, pos, prefix, callback) => {
        console.log(`getCompletions`, editor, session, pos, prefix, callback);
        callback(null, completions.map(completion => ({
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
      mode="worldscript"
      theme="tomorrow_night"
      onChange={onChange}
      value={value}
      name="worldscript-editor"
      editorProps={{ $blockScrolling: true }}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: false,
        enableSnippets: false,
        showLineNumbers: true,
        tabSize: 2,
        useSoftTabs: true,
        showPrintMargin: false,
        fontSize: 14,
        highlightActiveLine: true,
        highlightGutterLine: true,
      }}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
}