import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { RotateCcw, RotateCw, Home, Grid, Grip, Boxes, MousePointer, Download, Brush, Map, ArrowUpRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RenderingMode } from '../types';
import { MapType, MapMode } from '@/hooks/useMapState';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ALTERNATIVE_SECTIONS = [
  { id: 50, name: "Temple of Ancients gone" },
  { id: 41, name: "Junon Area crater (left)" },
  { id: 42, name: "Junon Area crater (right)" },
  { id: 60, name: "Mideel after Lifestream" },
  { id: 47, name: "Cosmo Canyon crater (left)" },
  { id: 48, name: "Cosmo Canyon crater (right)" },
] as const;

interface MapControlsProps {
  onRotate: (direction: 'left' | 'right') => void;
  onReset: () => void;
  wireframe?: boolean;
  onWireframeToggle?: (checked: boolean) => void;
  showGrid?: boolean;
  onGridToggle?: (checked: boolean) => void;
  showModels?: boolean;
  onModelsToggle?: () => void;
  showNormals?: boolean;
  onNormalsToggle?: (checked: boolean) => void;
  renderingMode: RenderingMode;
  onRenderingModeChange: (mode: RenderingMode) => void;
  mapType: MapType;
  onMapTypeChange: (type: MapType) => void;
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  enabledAlternatives: number[];
  onAlternativesChange: (ids: number[], section: typeof ALTERNATIVE_SECTIONS[number]) => void;
}

export function MapControls({ 
  onRotate, 
  onReset, 
  wireframe = false, 
  onWireframeToggle,
  showGrid = false,
  onGridToggle,
  showModels = false,
  onModelsToggle,
  showNormals = false,
  onNormalsToggle,
  renderingMode,
  onRenderingModeChange,
  mapType,
  onMapTypeChange,
  mode,
  onModeChange,
  enabledAlternatives,
  onAlternativesChange
}: MapControlsProps) {
  return (
    <div className="w-full bg-sidebar border-b border-slate-800/40 flex items-center justify-between gap-2 px-2 py-1">
      {/* Left side - Rendering options and toggles */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === 'selection' ? "default" : "outline"}
                    size="icon"
                    className={`h-6 w-6 ${mode === 'selection' ? 'bg-primary hover:bg-primary/90' : ''}`}
                    onClick={() => onModeChange('selection')}
                  >
                    <MousePointer className={`h-3.5 w-3.5 ${mode === 'selection' ? 'text-primary-foreground' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p>Single triangle selection</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === 'painting' ? "default" : "outline"}
                    size="icon"
                    className={`h-6 w-6 ${mode === 'painting' ? 'bg-primary hover:bg-primary/90' : ''}`}
                    onClick={() => onModeChange('painting')}
                  >
                    <Brush className={`h-3.5 w-3.5 ${mode === 'painting' ? 'text-primary-foreground' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p>Painting mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === 'export' ? "default" : "outline"}
                    size="icon"
                    className={`h-6 w-6 ${mode === 'export' ? 'bg-primary hover:bg-primary/90' : ''}`}
                    onClick={() => onModeChange('export')}
                  >
                    <Download className={`h-3.5 w-3.5 ${mode === 'export' ? 'text-primary-foreground' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p>Export / Import geometry</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="h-3.5 w-[1px] bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">Map:</span>
          <Select value={mapType} onValueChange={onMapTypeChange}>
            <SelectTrigger className="w-[110px] px-2 h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overworld">Overworld</SelectItem>
              <SelectItem value="underwater">Underwater</SelectItem>
              <SelectItem value="glacier">Great Glacier</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-3.5 w-[1px] bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">Mode:</span>
          <Select value={renderingMode} onValueChange={(value) => onRenderingModeChange(value as RenderingMode)}>
            <SelectTrigger className="w-[90px] px-2 h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="textured">Textured</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
              <SelectItem value="region">Region</SelectItem>
              <SelectItem value="scripts">Scripts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-3.5 w-[1px] bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">Display:</span>
          {onWireframeToggle && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={wireframe ? "default" : "outline"}
                    size="icon"
                    className={`h-6 w-6 ${wireframe ? 'bg-primary hover:bg-primary/90' : ''}`}
                    onClick={() => onWireframeToggle(!wireframe)}
                  >
                    <Grid className={`h-3.5 w-3.5 ${wireframe ? 'text-primary-foreground' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p>Toggle wireframe {wireframe ? '(on)' : '(off)'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {onGridToggle && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showGrid ? "default" : "outline"}
                    size="icon"
                    className={`h-6 w-6 ${showGrid ? 'bg-primary hover:bg-primary/90' : ''}`}
                    onClick={() => onGridToggle(!showGrid)}
                  >
                    <Grip className={`h-3.5 w-3.5 ${showGrid ? 'text-primary-foreground' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p>Toggle grid overlay {showGrid ? '(on)' : '(off)'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {onModelsToggle && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showModels ? "default" : "outline"}
                    size="icon"
                    className={`h-6 w-6 ${showModels ? 'bg-primary hover:bg-primary/90' : ''}`}
                    onClick={onModelsToggle}
                  >
                    <Boxes className={`h-3.5 w-3.5 ${showModels ? 'text-primary-foreground' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p>Toggle models {showModels ? '(on)' : '(off)'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {onNormalsToggle && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showNormals ? "default" : "outline"}
                    size="icon"
                    className={`h-6 w-6 ${showNormals ? 'bg-primary hover:bg-primary/90' : ''}`}
                    onClick={() => onNormalsToggle(!showNormals)}
                  >
                    <ArrowUpRight className={`h-3.5 w-3.5 ${showNormals ? 'text-primary-foreground' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p>Toggle normals {showNormals ? '(on)' : '(off)'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-6 relative text-xs font-normal px-2"
              >
                <Map className="h-3.5 w-3.5" /> Alternatives
                {enabledAlternatives.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full text-[8px] text-primary-foreground flex items-center justify-center">
                    {enabledAlternatives.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2">
              <div className="space-y-2">
                {ALTERNATIVE_SECTIONS.map((section) => (
                  <div key={section.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`alt-${section.id}`}
                      checked={enabledAlternatives.includes(section.id)}
                      onCheckedChange={(checked) => {
                        onAlternativesChange(
                          checked 
                            ? [...enabledAlternatives, section.id]
                            : enabledAlternatives.filter(id => id !== section.id),
                          section
                        );
                      }}
                    />
                    <label
                      htmlFor={`alt-${section.id}`}
                      className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {section.name}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>


      </div>

      {/* Right side - Camera controls */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground font-medium">Camera:</span>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={onReset}
              >
                <Home className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              <p>Reset view</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => onRotate('left')}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              <p>Rotate map left</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => onRotate('right')}
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              <p>Rotate map right</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
} 