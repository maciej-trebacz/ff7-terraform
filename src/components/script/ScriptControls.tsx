import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Save, Plus, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapId } from '@/hooks/useMapState';
import { useScriptsState } from '@/hooks/useScriptState';
import { FunctionType } from '@/ff7/evfile';

const MAP_NAMES: Record<MapId, string> = {
  WM0: 'Overworld',
  WM2: 'Underwater',
  WM3: 'Great Glacier'
};

export function ScriptControls() {
  const { selectedMap, scriptType, setSelectedMap, setScriptType, loadScripts } = useScriptsState();

  const handleMapChange = (value: MapId) => {
    setSelectedMap(value);
    loadScripts(value);
  };

  const handleScriptTypeChange = (value: string) => {
    setScriptType(Number(value) as FunctionType);
  };

  return (
    <div className="w-full bg-sidebar border-b border-slate-800/40 flex items-center justify-between gap-2 px-2 py-1">
      {/* Left side - Script actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                <p>Add new script</p>
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
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                <p>Delete selected script</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="h-3.5 w-[1px] bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">Map:</span>
          <Select value={selectedMap} onValueChange={handleMapChange}>
            <SelectTrigger className="w-[110px] px-2 h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MAP_NAMES).map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-3.5 w-[1px] bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">Type:</span>
          <Select value={scriptType.toString()} onValueChange={handleScriptTypeChange}>
            <SelectTrigger className="w-[90px] px-2 h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FunctionType.System.toString()}>System</SelectItem>
              <SelectItem value={FunctionType.Model.toString()}>Models</SelectItem>
              <SelectItem value={FunctionType.Mesh.toString()}>Mesh</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right side - Search */}
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search scripts..."
            className="h-6 w-[200px] pl-8 text-xs"
          />
        </div>
      </div>
    </div>
  );
} 