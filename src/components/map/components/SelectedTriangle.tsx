import { Triangle } from "@/ff7/mapfile";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TRIANGLE_TYPES } from "@/lib/map-data";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UVEditor } from "@/components/map/components/UVEditor";
import { useMessagesState } from "@/hooks/useMessagesState";
import { useMapState } from "@/hooks/useMapState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface SelectedTriangleProps {
  triangle: Triangle | null;
  textures: any[];
  onVertexChange: (vertexIndex: number, axis: 'x' | 'y' | 'z', value: string) => void;
}

export function SelectedTriangle({ triangle, textures, onVertexChange }: SelectedTriangleProps) {
  const { messages } = useMessagesState();
  const { updateSingleTriangle } = useMapState();

  if (!triangle) {
    return (
      <div className="text-xs text-muted-foreground rounded-md border bg-muted/50 p-2">
        Click on the map to select a triangle
      </div>
    );
  }

  const handlePropertyChange = (updates: any) => {
    updateSingleTriangle(updates);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="space-y-1.5">
          <Label>Properties</Label>
          <div className="rounded-md border bg-muted/50 p-2 space-y-1">
            <div className="flex items-center justify-between space-x-2">
              <Label className="text-xs w-16 shrink-0">Type</Label>
              <Select
                value={triangle.type.toString()}
                onValueChange={(value) => handlePropertyChange({ type: parseInt(value) })}
              >
                <SelectTrigger className="h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIANGLE_TYPES).map(([id, data]) => (
                    <SelectItem key={id} value={id}>
                      {data.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label className="text-xs w-16 shrink-0">Script ID</Label>
              <Input
                type="number"
                className="h-6 text-xs"
                min={0}
                max={255}
                value={triangle.script}
                onChange={(e) => handlePropertyChange({ script: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label className="text-xs w-16 shrink-0">Region</Label>
              <Select
                value={triangle.locationId.toString()}
                onValueChange={(value) => handlePropertyChange({ locationId: parseInt(value) })}
              >
                <SelectTrigger className="h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {messages.slice(0, 20).map((message, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {message}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="chocobo"
                checked={triangle.isChocobo}
                onCheckedChange={(checked) => handlePropertyChange({ isChocobo: checked === true })}
              />
              <Label htmlFor="chocobo" className="text-xs">Is Chocobo Area</Label>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Vertices</Label>
          <div className="rounded-md border bg-muted/50 p-2">
            <div className="space-y-1">
              <div className="grid grid-cols-[1.5rem_repeat(3,1fr)] gap-x-1 text-xs">
                <div className="text-muted-foreground">#</div>
                <div className="text-muted-foreground text-center">X</div>
                <div className="text-muted-foreground text-center">Y</div>
                <div className="text-muted-foreground text-center">Z</div>
              </div>
              {[
                { label: "0", vertex: triangle.vertex0 },
                { label: "1", vertex: triangle.vertex1 },
                { label: "2", vertex: triangle.vertex2 }
              ].map(({ label, vertex }, index) => (
                <div key={label} className="grid grid-cols-[1.5rem_repeat(3,1fr)] gap-x-1">
                  <div className="text-muted-foreground">{label}</div>
                  <Input
                    type="number"
                    value={vertex.x}
                    step={25}
                    onChange={(e) => onVertexChange(index, 'x', e.target.value)}
                    className="h-6 !text-xs w-full pl-2 pr-1"
                  />
                  <Input
                    type="number"
                    value={vertex.y}
                    step={25}
                    onChange={(e) => onVertexChange(index, 'y', e.target.value)}
                    className="h-6 !text-xs w-full pl-2 pr-1"
                  />
                  <Input
                    type="number"
                    value={vertex.z}
                    step={25}
                    onChange={(e) => onVertexChange(index, 'z', e.target.value)}
                    className="h-6 !text-xs w-full pl-2 pr-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Normals</Label>
          <div className="rounded-md border bg-muted/50 p-2">
            <div className="space-y-1">
              <div className="grid grid-cols-[1.5rem_repeat(3,1fr)] gap-x-1 text-xs">
                <div className="text-muted-foreground">#</div>
                <div className="text-muted-foreground text-center">X</div>
                <div className="text-muted-foreground text-center">Y</div>
                <div className="text-muted-foreground text-center">Z</div>
              </div>
              {[
                { label: "0", normal: triangle.normal0 },
                { label: "1", normal: triangle.normal1 },
                { label: "2", normal: triangle.normal2 }
              ].map(({ label, normal }, index) => (
                <div key={label} className="grid grid-cols-[1.5rem_repeat(3,1fr)] gap-x-1">
                  <div className="text-muted-foreground">{label}</div>
                  <Input
                    type="number"
                    value={normal.x}
                    step={0.1}
                    onChange={(e) => handlePropertyChange({ [`normal${index + 1}`]: { ...normal, x: parseFloat(e.target.value) } })}
                    className="h-6 !text-xs w-full pl-2 pr-1"
                  />
                  <Input
                    type="number"
                    value={normal.y}
                    step={0.1}
                    onChange={(e) => handlePropertyChange({ [`normal${index + 1}`]: { ...normal, y: parseFloat(e.target.value) } })}
                    className="h-6 !text-xs w-full pl-2 pr-1"
                  />
                  <Input
                    type="number"
                    value={normal.z}
                    step={0.1}
                    onChange={(e) => handlePropertyChange({ [`normal${index + 1}`]: { ...normal, z: parseFloat(e.target.value) } })}
                    className="h-6 !text-xs w-full pl-2 pr-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Texture</Label>
          <div className="rounded-md border bg-muted/50 p-2 space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Texture</Label>
              <Select
                value={triangle.texture.toString()}
                onValueChange={(value) => handlePropertyChange({ texture: parseInt(value) })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {textures.map((texture, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {texture.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Size</span>
              <span className="font-medium">{textures[triangle.texture]?.width ?? '?'}×{textures[triangle.texture]?.height ?? '?'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">UV Offset</span>
              <span className="font-medium">({textures[triangle.texture]?.uOffset ?? '?'}, {textures[triangle.texture]?.vOffset ?? '?'})</span>
            </div>
            <div className="h-[128px]">
              <UVEditor 
                triangle={triangle}
                onSave={(uvCoords) => {
                  handlePropertyChange({
                    uVertex0: uvCoords[0].u,
                    vVertex0: uvCoords[0].v,
                    uVertex1: uvCoords[1].u,
                    vVertex1: uvCoords[1].v,
                    uVertex2: uvCoords[2].u,
                    vVertex2: uvCoords[2].v
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
