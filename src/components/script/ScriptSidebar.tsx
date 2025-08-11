import { cn } from "@/lib/utils"
import { useEffect, useMemo, useRef, useState } from "react"
import type { CallContext } from "@/components/script/WorldscriptEditor"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { loadFieldOptions } from "@/lib/field-options"
import { useLocationsState } from "@/hooks/useLocationsState"
import { useMessagesState } from "@/hooks/useMessagesState"
//
import { modelsMapping, fieldsMapping } from "@/ff7/worldscript/constants"

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
  'System.set_map_options': (ctx, onBatch) => mapOptions(ctx, onBatch),
  'Sound.set_music_volume': (ctx, onBatch) => numberSlider(ctx, onBatch, 0, { label: 'Music Volume' }),
  'Entity.set_walk_speed': (ctx, onBatch) => numberSlider(ctx, onBatch, 0, { label: 'Walk Speed' }),
  'Entity.set_movespeed': (ctx, onBatch) => numberSlider(ctx, onBatch, 0, { label: 'Move Speed' }),
  'System.fade_in': (ctx, onBatch) => numberSlider(ctx, onBatch, 0, { label: 'Fade Speed' }),
  'System.fade_out': (ctx, onBatch) => numberSlider(ctx, onBatch, 0, { label: 'Fade Speed' }),
  'Camera.set_rotation_speed': (ctx, onBatch) => numberSlider(ctx, onBatch, 0, { label: 'Camera Rotation Speed' }),
  'Camera.set_tilt_speed': (ctx, onBatch) => numberSlider(ctx, onBatch, 0, { label: 'Camera Tilt Speed' }),
  'Camera.set_zoom_speed': (ctx, onBatch) => numberSlider(ctx, onBatch, 0, { label: 'Camera Zoom Speed' }),
  'System.enter_field': (ctx, onBatch) => <EnterFieldUI ctx={ctx} onBatch={onBatch} />,
  'Entity.load_model': (ctx, onBatch) => <EntityModelSelectUI ctx={ctx} onBatch={onBatch} />,
  'Window.set_message': (ctx, onBatch) => <SetMessageUI ctx={ctx} onBatch={onBatch} />,
  'Window.set_dimensions': (ctx, onBatch) => <SetDimensionsUI ctx={ctx} onBatch={onBatch} />,
  'Entity.set_direction_facing': (ctx, onBatch) => directionRadial(ctx, onBatch, 0, { label: 'Direction' }),
  'Entity.set_movement_direction': (ctx, onBatch) => directionRadial(ctx, onBatch, 0, { label: 'Direction' }),
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
      {ctx.description && (
        <div className="text-[11px] text-muted-foreground">{ctx.description}</div>
      )}
      <div className="space-y-2">
        <Label className="text-xs">Color <span className="text-muted-foreground text-[11px]">(click to edit)</span></Label>
        <div className="flex items-center gap-2 !mt-1">
          <input type="color" value={hex} onChange={e => onChange(e.target.value)} className="h-6 w-8 p-0 border-0 bg-transparent" />
          <div className="text-[11px] text-muted-foreground">RGB: {`${clamp(r)}, ${clamp(g)}, ${clamp(b)}`}</div>
        </div>
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
              // Direction radial control for better UX (0 up, 64 right, 128 down, 192 left)
              if (type?.kind === 'number' && (p.name?.toLowerCase?.() === 'direction') && (type.min ?? 0) === 0 && (type.max ?? 255) === 255) {
                const n = parseInt(arg.text || '0', 10) || 0
                return (
                  <div key={i} className="space-y-1">
                    <DirectionRadial value={n} onChange={(v) => onParamChange?.(i, String(v))} />
                  </div>
                )
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

function numberSlider(ctx: CallContext, onBatch: (updates: Array<{ index: number; newText: string }>) => void, index: number, opts?: { label?: string }) {
  const p = ctx.params[index] as any;
  const type = p?.type as undefined | { kind: string; min?: number; max?: number; step?: number };
  const val = parseInt(ctx.args[index]?.text || '0', 10) || 0;
  const min = Math.max(0, type?.min ?? 0);
  const max = Math.max(min, type?.max ?? 255);
  const step = type?.step ?? 1;
  const label = opts?.label ?? p?.name ?? `arg${index+1}`;
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium">{ctx.namespace}.{ctx.method}</div>
      {ctx.description && (
        <div className="text-[11px] text-muted-foreground">{ctx.description}</div>
      )}
      <div className="space-y-1">
        <Label className="text-xs">{label}: {val}</Label>
        <input type="range" className="w-full" min={min} max={max} step={step} value={val} onChange={(e) => onBatch([{ index, newText: String(e.target.value) }])} />
      </div>
    </div>
  );
}

function mapOptions(ctx: CallContext, onBatch: (updates: Array<{ index: number; newText: string }>) => void) {
  const flags = [
    { bit: 1, label: 'Camera low' },
    { bit: 2, label: 'Show heading' },
    { bit: 4, label: 'Show big map' },
    { bit: 8, label: 'Hide mini map' },
  ];
  const current = parseInt(ctx.args[0]?.text || '0', 10) || 0;
  const toggle = (bit: number) => {
    const next = (current & bit) ? (current & ~bit) : (current | bit);
    onBatch([{ index: 0, newText: String(next) }]);
  };
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium">{ctx.namespace}.{ctx.method}</div>
      {ctx.description && (
        <div className="text-[11px] text-muted-foreground">{ctx.description}</div>
      )}
      <div className="grid grid-cols-1 gap-1">
        {flags.map(f => (
          <label key={f.bit} className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={(current & f.bit) !== 0} onChange={() => toggle(f.bit)} />
            <span>{f.label}</span>
          </label>
        ))}
      </div>
      <div className="text-[11px] text-muted-foreground">Value: {current}</div>
    </div>
  );
}

function EnterFieldUI({ ctx, onBatch }: { ctx: CallContext; onBatch: (updates: Array<{ index: number; newText: string }>) => void }) {
  const [options, setOptions] = useState<Array<{ id: number; fieldId: number; label: string }>>([])
  const [nameByFieldId, setNameByFieldId] = useState<Record<number, string>>({})
  const { entries, loadLocations } = useLocationsState()

  // Ensure we have scene labels and locations loaded
  useEffect(() => {
    let mounted = true
    loadFieldOptions().then(({ byId }) => { if (mounted) setNameByFieldId(byId) })
    if (!entries || entries.length === 0) {
      loadLocations()
    }
    return () => { mounted = false }
  }, [entries?.length, loadLocations])

  // Recompute dropdown options when entries or scenario changes
  useEffect(() => {
    const scenario = parseInt(ctx.args[1]?.text || '0', 10) || 0
    if (!entries || entries.length === 0) {
      setOptions([])
      return
    }
    const opts: Array<{ id: number; fieldId: number; label: string }>= entries.map((entry, idx) => {
      const fieldId = scenario === 1 ? entry.alternative.fieldId : entry.default.fieldId
      const sceneLabel = nameByFieldId[fieldId] ?? String(fieldId)
      return { id: idx + 1, fieldId, label: `${idx + 1} - ${sceneLabel}` }
    })
    setOptions(opts)
  }, [entries, ctx.args[1]?.text, nameByFieldId])
  // Determine current selection: support Fields.slug or numeric index
  // scenario is included in deps above; compute but don't store local var to avoid stale usage warnings
  const raw = ctx.args[0]?.text?.trim() || ''
  let currentId = 0
  const fieldsSlugMatch = raw.match(/^Fields\.([A-Za-z0-9_]+)$/i)
  if (fieldsSlugMatch && entries && entries.length > 0) {
    const slug = fieldsSlugMatch[1]
    // Build reverse map slug -> location index (as defined in fieldsMapping)
    const slugToLocIndex: Record<string, number> = {}
    Object.entries(fieldsMapping).forEach(([locIndex, s]) => { slugToLocIndex[s] = Number(locIndex) })
    const wantedIndex = slugToLocIndex[slug]
    currentId = (wantedIndex && wantedIndex >= 1 && wantedIndex <= (entries?.length ?? 0)) ? wantedIndex : 0
  } else {
    currentId = parseInt(raw || '0', 10) || 0
  }
  const currentScenario = parseInt(ctx.args[1]?.text || '0', 10) || 0
  return (
    <div className="space-y-3">
      <div className="text-xs font-medium">{ctx.namespace}.{ctx.method}</div>
      {ctx.description && (
        <div className="text-[11px] text-muted-foreground">{ctx.description}</div>
      )}
      <div className="space-y-1">
        <Label className="text-xs">Location</Label>
        <Select value={currentId ? String(currentId) : ''} onValueChange={(v) => {
          const idx = parseInt(v, 10)
          const slug = (fieldsMapping as any)[idx]
          const newText = slug ? `Fields.${slug}` : String(idx)
          onBatch([{ index: 0, newText }])
        }}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            {options.map(opt => (
              <SelectItem key={opt.id} value={String(opt.id)} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-[11px] text-muted-foreground">
          You can edit this list in the Locations tab.
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Scenario</Label>
        <Select value={String(currentScenario)} onValueChange={(v) => onBatch([{ index: 1, newText: String(v) }])}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Select scenario" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0" className="text-xs">Default</SelectItem>
            <SelectItem value="1" className="text-xs">Alternate</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function EntityModelSelectUI({ ctx, onBatch }: { ctx: CallContext; onBatch: (updates: Array<{ index: number; newText: string }>) => void }) {
  const entries: Array<{ value: number; slug: string }> = useMemo(() => {
    return Object.entries(modelsMapping).map(([k, v]) => ({ value: Number(k), slug: v }))
  }, [])
  const raw = ctx.args[0]?.text?.trim() || ''
  const slugMatch = raw.match(/^Entities\.([A-Za-z0-9_]+)$/i)
  let currentValue: number | '' = ''
  if (slugMatch) {
    const slug = slugMatch[1]
    const found = entries.find(e => e.slug === slug)
    currentValue = found ? found.value : ''
  } else {
    const n = parseInt(raw || '0', 10)
    currentValue = Number.isNaN(n) ? '' : n
  }
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium">{ctx.namespace}.{ctx.method}</div>
      {ctx.description && (
        <div className="text-[11px] text-muted-foreground">{ctx.description}</div>
      )}
      <div className="space-y-1">
        <Label className="text-xs">Model</Label>
        <Select value={currentValue === '' ? '' : String(currentValue)} onValueChange={(v) => {
          const value = parseInt(v, 10)
          const found = entries.find(e => e.value === value)
          const newText = found ? `Entities.${found.slug}` : String(value)
          onBatch([{ index: 0, newText }])
        }}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {entries.map(e => (
              <SelectItem key={e.value} value={String(e.value)} className="text-xs">{e.value} - {e.slug}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function SetMessageUI({ ctx, onBatch }: { ctx: CallContext; onBatch: (updates: Array<{ index: number; newText: string }>) => void }) {
  const { messages, loadMessages } = useMessagesState()
  useEffect(() => {
    if (!messages || messages.length === 0) loadMessages()
  }, [messages?.length, loadMessages])
  const raw = ctx.args[0]?.text?.trim() || ''
  const currentIndex = (/^\d+$/.test(raw) ? parseInt(raw, 10) : NaN)
  const preview = Number.isInteger(currentIndex) && messages[currentIndex] ? messages[currentIndex] : ''
  const labelFor = (i: number) => {
    const t = messages[i] ?? ''
    const truncated = t.length > 60 ? t.slice(0, 57) + '…' : t
    return `${i} - ${truncated || '(empty)'}`
  }
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium">{ctx.namespace}.{ctx.method}</div>
      {ctx.description && (
        <div className="text-[11px] text-muted-foreground">{ctx.description}</div>
      )}
      <div className="space-y-1">
        <Label className="text-xs">Message</Label>
        <Select value={Number.isInteger(currentIndex) ? String(currentIndex) : ''} onValueChange={(v) => onBatch([{ index: 0, newText: String(v) }])}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Select message" />
          </SelectTrigger>
          <SelectContent>
            {messages.map((_m, i) => (
              <SelectItem key={i} value={String(i)} className="text-xs">
                {labelFor(i)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {preview && (
        <div className="text-[11px] text-muted-foreground border rounded p-2 max-h-36 overflow-auto whitespace-pre-wrap">
          {preview}
        </div>
      )}
    </div>
  )
}

function SetDimensionsUI({ ctx, onBatch }: { ctx: CallContext; onBatch: (updates: Array<{ index: number; newText: string }>) => void }) {
  const SCREEN_W = 320
  const SCREEN_H = 240
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

  const x = clamp(parseInt(ctx.args[0]?.text || '0', 10) || 0, 0, SCREEN_W)
  const y = clamp(parseInt(ctx.args[1]?.text || '0', 10) || 0, 0, SCREEN_H)
  const wRaw = parseInt(ctx.args[2]?.text || '0', 10) || 0
  const hRaw = parseInt(ctx.args[3]?.text || '0', 10) || 0
  const w = clamp(wRaw, 1, SCREEN_W - x)
  const h = clamp(hRaw, 1, SCREEN_H - y)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const scaleRef = useRef<number>(1)
  const dragStateRef = useRef<null | { kind: 'move' | 'resize-right' | 'resize-bottom'; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number }>(null)

  // Compute scale to fit width
  const [containerWidth, setContainerWidth] = useState<number>(0)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const resizeObserver = new ResizeObserver(() => {
      setContainerWidth(el.clientWidth)
    })
    resizeObserver.observe(el)
    setContainerWidth(el.clientWidth)
    return () => resizeObserver.disconnect()
  }, [])
  const scale = Math.max(0.1, Math.min(2, containerWidth > 0 ? containerWidth / SCREEN_W : 1))
  scaleRef.current = scale

  const commit = (nx: number, ny: number, nw: number, nh: number) => {
    const clampedX = clamp(Math.round(nx), 0, SCREEN_W - 1)
    const clampedY = clamp(Math.round(ny), 0, SCREEN_H - 1)
    const maxW = SCREEN_W - clampedX
    const maxH = SCREEN_H - clampedY
    const clampedW = clamp(Math.round(nw), 1, maxW)
    const clampedH = clamp(Math.round(nh), 1, maxH)
    onBatch([
      { index: 0, newText: String(clampedX) },
      { index: 1, newText: String(clampedY) },
      { index: 2, newText: String(clampedW) },
      { index: 3, newText: String(clampedH) },
    ])
  }

  const onMouseMove = (e: MouseEvent) => {
    const st = dragStateRef.current
    if (!st) return
    const s = scaleRef.current || 1
    const dx = (e.clientX - st.startX) / s
    const dy = (e.clientY - st.startY) / s
    if (st.kind === 'move') {
      const nx = clamp(st.origX + dx, 0, SCREEN_W - st.origW)
      const ny = clamp(st.origY + dy, 0, SCREEN_H - st.origH)
      commit(nx, ny, st.origW, st.origH)
    } else if (st.kind === 'resize-right') {
      const nw = clamp(st.origW + dx, 1, SCREEN_W - st.origX)
      commit(st.origX, st.origY, nw, st.origH)
    } else if (st.kind === 'resize-bottom') {
      const nh = clamp(st.origH + dy, 1, SCREEN_H - st.origY)
      commit(st.origX, st.origY, st.origW, nh)
    }
  }

  const endDrag = () => {
    dragStateRef.current = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', endDrag)
  }

  const beginDrag = (kind: 'move' | 'resize-right' | 'resize-bottom') => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragStateRef.current = {
      kind,
      startX: e.clientX,
      startY: e.clientY,
      origX: x,
      origY: y,
      origW: w,
      origH: h,
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', endDrag)
  }

  const handleInput = (index: 0 | 1 | 2 | 3, rawValue: string) => {
    let nx = x, ny = y, nw = w, nh = h
    const parsed = parseInt(rawValue || '0', 10)
    const val = Number.isNaN(parsed) ? 0 : parsed
    if (index === 0) {
      nx = clamp(val, 0, SCREEN_W - nw)
    } else if (index === 1) {
      ny = clamp(val, 0, SCREEN_H - nh)
    } else if (index === 2) {
      nw = clamp(val, 1, SCREEN_W - nx)
    } else if (index === 3) {
      nh = clamp(val, 1, SCREEN_H - ny)
    }
    commit(nx, ny, nw, nh)
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium">{ctx.namespace}.{ctx.method}</div>
      {ctx.description && (
        <div className="text-[11px] text-muted-foreground">{ctx.description} Screen: {SCREEN_W}x{SCREEN_H}</div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">X</Label>
          <input type="number" className="h-7 text-xs w-full bg-background border rounded px-2" value={x}
            min={0} max={SCREEN_W - 1}
            onChange={(e) => handleInput(0, e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Y</Label>
          <input type="number" className="h-7 text-xs w-full bg-background border rounded px-2" value={y}
            min={0} max={SCREEN_H - 1}
            onChange={(e) => handleInput(1, e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Width</Label>
          <input type="number" className="h-7 text-xs w-full bg-background border rounded px-2" value={w}
            min={1} max={SCREEN_W - x}
            onChange={(e) => handleInput(2, e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Height</Label>
          <input type="number" className="h-7 text-xs w-full bg-background border rounded px-2" value={h}
            min={1} max={SCREEN_H - y}
            onChange={(e) => handleInput(3, e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[11px] text-muted-foreground">Preview</div>
        <div ref={containerRef} className="w-full border rounded bg-muted/30">
          <div
            ref={stageRef}
            className="relative select-none"
            style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          >
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_20px)]" />
            <div
              className="absolute border border-blue-500/70 bg-blue-500/10"
              style={{ left: x, top: y, width: w, height: h, cursor: 'move' }}
              onMouseDown={beginDrag('move')}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-[10px] text-foreground/80 bg-background/70 px-1 rounded">Message</div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-6 bg-blue-500/50 cursor-ew-resize" onMouseDown={beginDrag('resize-right')} />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-blue-500/50 cursor-ns-resize" onMouseDown={beginDrag('resize-bottom')} />
            </div>
            <div className="absolute bottom-1 left-1 text-[10px] text-muted-foreground/70 bg-background/70 px-1 rounded">
              {x},{y} {w}x{h}
            </div>
          </div>
          {/* spacer to give container proper height according to scale */}
          {/* <div style={{ height: SCREEN_H * scale }} /> */}
        </div>
      </div>
    </div>
  )
}

function directionRadial(ctx: CallContext, onBatch: (updates: Array<{ index: number; newText: string }>) => void, index: number, _opts?: { label?: string }) {
  const val = parseInt(ctx.args[index]?.text || '0', 10) || 0
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium">{ctx.namespace}.{ctx.method}</div>
      {ctx.description && (
        <div className="text-[11px] text-muted-foreground">{ctx.description}</div>
      )}
      <DirectionRadial value={val} onChange={(v) => onBatch([{ index, newText: String(v) }])} />
    </div>
  )
}

function DirectionRadial({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  const size = 112
  const radius = 48
  const center = { x: size/2, y: size/2 }
  const isDraggingRef = useRef(false)

  const updateFromEvent = (clientX: number, clientY: number, rect: DOMRect) => {
    const x = clientX - rect.left
    const y = clientY - rect.top
    const dx = x - center.x
    const dy = y - center.y
    if (dx === 0 && dy === 0) return
    // atan2 returns angle from +X; map so 0 is up: add PI/2 then normalize to [0,1)
    const angle = Math.atan2(dy, dx) // -PI..PI (screen coords)
    let normalized = (angle + Math.PI/2) / (Math.PI * 2)
    normalized = (normalized % 1 + 1) % 1
    const val = Math.max(0, Math.min(255, Math.round(normalized * 256) % 256))
    onChange(val)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    isDraggingRef.current = true
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    updateFromEvent(e.clientX, e.clientY, rect)
    const move = (ev: MouseEvent) => updateFromEvent(ev.clientX, ev.clientY, rect)
    const up = () => { isDraggingRef.current = false; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const normalized = (value % 256 + 256) % 256 / 256
  const angle = normalized * Math.PI * 2 - Math.PI/2
  const knobX = center.x + Math.cos(angle) * radius
  const knobY = center.y + Math.sin(angle) * radius

  return (
    <div className="inline-block">
      <div
        className="relative select-none"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
      >
        <svg width={size} height={size}>
          <circle cx={center.x} cy={center.y} r={radius} fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
          {/* tick marks */}
          {[0,64,128,192].map((v) => {
            const n = v/256
            const a = n * Math.PI * 2 - Math.PI/2
            const ix = center.x + Math.cos(a) * (radius - 8)
            const iy = center.y + Math.sin(a) * (radius - 8)
            const ox = center.x + Math.cos(a) * (radius + 8)
            const oy = center.y + Math.sin(a) * (radius + 8)
            return <line key={v} x1={ix} y1={iy} x2={ox} y2={oy} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
          })}
          {/* knob */}
          <circle cx={knobX} cy={knobY} r={5} fill="hsl(var(--primary))" stroke="hsl(var(--primary))" />
          {/* center */}
          <circle cx={center.x} cy={center.y} r={2} fill="hsl(var(--muted-foreground))" />
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] text-foreground/80 bg-background/70 rounded px-1">
          {value}
        </div>
      </div>
    </div>
  )
}