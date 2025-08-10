import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import 'ace-builds/src-noconflict/ext-language_tools';
import { setCompleters } from 'ace-builds/src-noconflict/ext-language_tools';
import './AceWorldscript.js';
import { useEffect, useRef, useState } from 'react';
import { Opcodes, Namespace } from '../../ff7/worldscript/opcodes';
import { SPECIAL_MAP } from '../../ff7/worldscript/constants';

interface WorldscriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function WorldscriptEditor({ value, onChange, className }: WorldscriptEditorProps) {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const namespacesRef = useRef<string[]>([]);
  const methodsByNamespaceRef = useRef<Record<string, { name: string; description: string; stackParams: number; stackParamsDef?: Array<{ name: string; description: string }>; notes?: string }[]>>({});
  const [signatureHelp, setSignatureHelp] = useState<{
    namespace: string;
    method: string;
    paramNames: string[];
    paramDescriptions?: string[];
    description?: string;
    notes?: string;
    activeParamIndex: number;
    totalParams: number;
    top: number;
    left: number;
  } | null>(null);
  useEffect(() => {
    const namespaceNames = Object.values(Namespace) as string[];
    const methodsByNamespace: Record<string, { name: string; description: string; stackParams: number; stackParamsDef?: Array<{ name: string; description: string }>; notes?: string }[]> = {};
    for (const def of Object.values(Opcodes)) {
      const list = methodsByNamespace[def.namespace] ?? [];
      list.push({ name: def.name, description: def.description, stackParams: def.stackParams, stackParamsDef: def.stackParamsDef, notes: def.notes });
      methodsByNamespace[def.namespace] = list;
    }

    // Special namespace: provide fields instead of methods
    const specialFields = Object.values(SPECIAL_MAP).map(v => v.name);

    // Save for handlers
    namespacesRef.current = namespaceNames;
    methodsByNamespaceRef.current = methodsByNamespace;

    setCompleters([
      {
      getCompletions: (_editor, session, pos, prefix, callback) => {
        const line = session.getLine(pos.row) as string;
        const tokenStartColumn = Math.max(0, pos.column - (prefix?.length ?? 0));

        const beforeToken = line.slice(0, tokenStartColumn);
        const isTokenAtLineStart = /^\s*$/.test(beforeToken);

        const indexBeforePrefix = tokenStartColumn - 1;
        const charBeforePrefix = indexBeforePrefix >= 0 ? line[indexBeforePrefix] : '';
        const isAfterSpaceOrParen = charBeforePrefix === ' ' || charBeforePrefix === '(';

        // Check for Namespace.method context like "System." or "System.di"
        const lastDotIndex = beforeToken.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          const beforeDot = beforeToken.slice(0, lastDotIndex);
          // Support both "Namespace.method" and special array syntax like "Savemap[0xF29].method"
          const nsMatch = beforeDot.match(/([A-Za-z_][A-Za-z0-9_]*)\s*(?:\[[^\]]*\])?\s*$/);
          const typedNamespace = nsMatch?.[1];
          if (typedNamespace && namespaceNames.includes(typedNamespace)) {
            if (typedNamespace === 'Special') {
              const candidates = prefix ? specialFields.filter(n => n.startsWith(prefix)) : specialFields;
              callback(null, candidates.map((n) => ({
                name: n,
                value: n,
                caption: n,
                meta: 'Special',
                score: 1000,
              })));
              return;
            }

            const methods = methodsByNamespace[typedNamespace] ?? [];
            const filtered = prefix
              ? methods.filter((m) => m.name.startsWith(prefix))
              : methods;
            callback(
              null,
              filtered.map((m) => ({
                name: m.name,
                value: m.name,
                caption: m.name,
                meta: typedNamespace,
                score: 1000,
              }))
            );
            return;
          }
        }

        // Otherwise suggest Namespaces only in the allowed positions
        if (isTokenAtLineStart || isAfterSpaceOrParen) {
          const filteredNamespaces = prefix
            ? namespaceNames.filter((n) => n.startsWith(prefix))
            : namespaceNames;
          callback(
            null,
            filteredNamespaces.map((n) => ({
              name: n,
              value: n,
              caption: n,
              meta: 'namespace',
              score: 1000,
            }))
          );
          return;
        }

        callback(null, []);
      }
    }
    ]);
  }, []);

  const updateSignatureHelp = (editor: any) => {
    const session = editor.getSession();
    const pos = editor.getCursorPosition();
    const line: string = session.getLine(pos.row);
    const beforeCursor = line.slice(0, pos.column);

    // Find the matching open paren for current cursor by scanning backwards
    let depth = 0;
    let openIndex = -1;
    for (let i = beforeCursor.length - 1; i >= 0; i--) {
      const ch = beforeCursor[i];
      if (ch === ')') depth++;
      else if (ch === '(') {
        if (depth === 0) { openIndex = i; break; }
        depth--;
      }
    }

    if (openIndex === -1) {
      setSignatureHelp(null);
      return;
    }

    const beforeOpen = beforeCursor.slice(0, openIndex);
    const nsMethodMatch = beforeOpen.match(/([A-Za-z_][A-Za-z0-9_]*)\s*(?:\[[^\]]*\])?\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)\s*$/);
    if (!nsMethodMatch) {
      setSignatureHelp(null);
      return;
    }
    const typedNamespace = nsMethodMatch[1];
    const methodName = nsMethodMatch[2];
    if (!namespacesRef.current.includes(typedNamespace) || typedNamespace === 'Special') {
      setSignatureHelp(null);
      return;
    }

    const methods = methodsByNamespaceRef.current[typedNamespace] ?? [];
    const def = methods.find((m) => m.name === methodName);
    if (!def) {
      setSignatureHelp(null);
      return;
    }

    // Count top-level commas between '(' and cursor to get active param index
    const argsSoFar = beforeCursor.slice(openIndex + 1);
    let commas = 0;
    let nested = 0;
    for (let i = 0; i < argsSoFar.length; i++) {
      const ch = argsSoFar[i];
      if (ch === '(') nested++;
      else if (ch === ')') { if (nested > 0) nested--; }
      else if (ch === ',' && nested === 0) commas++;
    }
    const activeIndex = Math.min(commas, Math.max(0, def.stackParams - 1));

    const paramNames = def.stackParamsDef && def.stackParamsDef.length === def.stackParams
      ? def.stackParamsDef.map(p => p.name)
      : Array.from({ length: def.stackParams }, (_, i) => `arg${i + 1}`);
    const paramDescriptions = def.stackParamsDef?.map(p => p.description);

    // Position near cursor
    const coords = editor.renderer.textToScreenCoordinates(pos.row, pos.column);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const top = coords.pageY - rect.top + editor.renderer.lineHeight;
    const left = coords.pageX - rect.left;

    setSignatureHelp({
      namespace: typedNamespace,
      method: def.name,
      paramNames,
      paramDescriptions,
      description: def.description,
      notes: def.notes,
      activeParamIndex: activeIndex,
      totalParams: def.stackParams,
      top,
      left,
    });
  };

  const handleLoad = (editor: any) => {
    editorRef.current = editor;
    editor.commands.on('afterExec', (e: any) => {
      if (e.command && e.command.name === 'insertstring') {
        if (e.args === '.') {
          editor.execCommand('startAutocomplete');
        }
        if (e.args === '(' || e.args === ',' ) {
          updateSignatureHelp(editor);
        }
        if (e.args === ')') {
          setSignatureHelp(null);
        }
      }
    });
    // Update on cursor move
    editor.getSession().selection.on('changeCursor', () => updateSignatureHelp(editor));
  };
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <AceEditor
        mode="worldscript"
        theme="tomorrow_night"
        onLoad={handleLoad}
        onChange={onChange}
        value={value}
        name="worldscript-editor"
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
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
      {signatureHelp && (
        <div
          style={{
            position: 'absolute',
            top: signatureHelp.top,
            left: signatureHelp.left,
            background: 'rgba(30,30,30,0.95)',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: 4,
            padding: '6px 8px',
            fontSize: 12,
            maxWidth: 420,
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ fontFamily: 'monospace' }}>
            {signatureHelp.namespace}.{signatureHelp.method}(
            {signatureHelp.paramNames.map((p, i) => {
              const isActive = i === signatureHelp.activeParamIndex;
              return (
                <span
                  key={i}
                  style={{
                    fontWeight: isActive ? ('bold' as const) : 'normal',
                    color: isActive ? '#FFD54A' : 'inherit',
                  }}
                >
                  {p}{i < signatureHelp.paramNames.length - 1 ? ', ' : ''}
                </span>
              );
            })}
            )
          </div>
          {signatureHelp.description && (
            <div style={{ marginTop: 4, opacity: 0.9 }}>{signatureHelp.description}</div>
          )}
          {signatureHelp.notes && (
            <div style={{ marginTop: 6, opacity: 0.7 }}>
              <span style={{ fontWeight: 'bold' }}>Notes:</span> {signatureHelp.notes}
            </div>
          )}
          {signatureHelp.notes && signatureHelp.paramDescriptions && signatureHelp.paramDescriptions[signatureHelp.activeParamIndex] && (
            <div style={{
              marginTop: 8,
              marginBottom: 8,
              borderTop: '1px solid #555',
              width: '100%'
            }} />
          )}
          {signatureHelp.paramDescriptions && signatureHelp.paramDescriptions[signatureHelp.activeParamIndex] && (
            <div style={{ marginTop: 6, opacity: 0.85 }}>
              <span style={{ fontWeight: 'bold' }}>Param:</span> {signatureHelp.paramDescriptions[signatureHelp.activeParamIndex]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}