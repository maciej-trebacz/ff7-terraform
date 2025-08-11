import { cn } from "@/lib/utils"
import { useMemo } from "react"
import type { CallContext } from "@/components/script/WorldscriptEditor"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ScriptSidebarProps {
  className?: string
  context?: CallContext | null
  onParamChange?: (index: number, newText: string) => void
  onBatchParamsChange?: (updates: Array<{ index: number; newText: string }>) => void
}

type CustomRenderer = (ctx: CallContext, onBatchChange: (updates: Array<{ index: number; newText: string }>) => void) => JSX.Element

const customUiRegistry: Record<string, CustomRenderer> = {
  // Keys are Namespace.method
  'Point.set_terrain_color': (ctx, onBatch) => colorTriple(ctx, onBatch),
  'Point.set_sky_top_color': (ctx, onBatch) => colorTriple(ctx, onBatch),
  'Point.set_sky_bottom_color': (ctx, onBatch) => colorTriple(ctx, onBatch),
};

function colorTriple(ctx: CallContext, onBatch: (updates: Array<{ index: number; newText: string }>) => void) {
  const [b, g, r] = ctx.args.map(a => parseInt(a.text || '0', 10) || 0);
  const clamp = (n: number) => Math.max(0, Math.min(255, n|0));
  const hex = `#${clamp(r).toString(16).padStart(2,'0')}${clamp(g).toString(16).padStart(2,'0')}${clamp(b).toString(16).padStart(2,'0')}`.toUpperCase();
  const onChange = (val: string) => {
    if (!/^#?[0-9a-fA-F]{6}$/.test(val)) return;
    const v = val.startsWith('#') ? val.slice(1) : val;
    const nr = parseInt(v.slice(0,2), 16);
    const ng = parseInt(v.slice(2,4), 16);
    const nb = parseInt(v.slice(4,6), 16);
    onBatch([
      { index: 0, newText: String(nb) },
      { index: 1, newText: String(ng) },
      { index: 2, newText: String(nr) },
    ]);
  };
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium">{ctx.namespace}.{ctx.method}</div>
      <div className="flex items-center gap-2">
        <input type="color" value={hex} onChange={e => onChange(e.target.value)} className="h-6 w-8 p-0 border-0 bg-transparent" />
        <div className="text-[11px] text-muted-foreground">RGB: {`${clamp(r)}, ${clamp(g)}, ${clamp(b)}`}</div>
      </div>
    </div>
  );
}

export function ScriptSidebar({ className, context, onParamChange, onBatchParamsChange }: ScriptSidebarProps) {
  const customRenderer = useMemo(() => {
    if (!context) return null;
    const key = `${context.namespace}.${context.method}`;
    return customUiRegistry[key] ?? null;
  }, [context]);

  return (
    <div className={cn("bg-background p-2", className)}>
      {!context ? (
        <div className="text-xs text-muted-foreground">No opcode selected</div>
      ) : customRenderer ? (
        customRenderer(context, (updates) => onBatchParamsChange?.(updates))
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-medium">{context.namespace}.{context.method}</div>
          {context.description && (
            <div className="text-[11px] text-muted-foreground">{context.description}</div>
          )}
          {context.notes && (
            <div className="text-[11px] text-muted-foreground">{context.notes}</div>
          )}
          <div className="space-y-2">
            {context.params.map((p, i) => {
              const arg = context.args[i];
              const type = (p as any).type as undefined | { kind: string; [k: string]: any };
              if (!arg) return null;
              const label = p.name || `arg${i+1}`;
              if (type?.kind === 'boolean') {
                const checked = (arg.text === '1' || arg.text.toLowerCase?.() === 'true');
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Checkbox checked={checked} onCheckedChange={(v) => onParamChange?.(i, v ? '1' : '0')} />
                    <Label className="text-xs">{label}</Label>
                  </div>
                );
              }
              if (type?.kind === 'enum') {
                const options = type.options || [];
                const current = arg.text;
                return (
                  <div key={i} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Select value={current} onValueChange={(v) => onParamChange?.(i, String(v))}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((opt, idx) => (
                          <SelectItem key={idx} value={String(opt.value)} className="text-xs">{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
              if (type?.kind === 'number') {
                const n = parseInt(arg.text || '0', 10);
                return (
                  <div key={i} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <input type="number" className="h-7 text-xs w-full bg-background border rounded px-2"
                      value={Number.isNaN(n) ? '' : n}
                      min={type.min}
                      max={type.max}
                      step={type.step}
                      onChange={(e) => onParamChange?.(i, e.target.value)} />
                  </div>
                );
              }
              return (
                <div key={i} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <input className="h-7 text-xs w-full bg-background border rounded px-2" value={arg.text} onChange={(e) => onParamChange?.(i, e.target.value)} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
} 