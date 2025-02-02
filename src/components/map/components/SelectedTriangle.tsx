import { Triangle } from "@/ff7/mapfile";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { REGION_NAMES, TRIANGLE_TYPES } from "@/lib/map-data";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UVEditor } from "@/components/map/components/UVEditor";

interface SelectedTriangleProps {
  triangle: Triangle | null;
  textures: any[];
  onVertexChange: (vertexIndex: number, axis: 'x' | 'y' | 'z', value: string) => void;
}

export function SelectedTriangle({ triangle, textures, onVertexChange }: SelectedTriangleProps) {
  if (!triangle) {
    return (
      <div className="text-xs text-muted-foreground rounded-md border bg-muted/50 p-2">
        Click on the map to select a triangle
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="space-y-1.5">
          <Label>Properties</Label>
          <div className="rounded-md border bg-muted/50 p-2 space-y-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help flex justify-between text-xs">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">
                      {TRIANGLE_TYPES[triangle.type]?.type ?? `Unknown (${triangle.type})`}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{TRIANGLE_TYPES[triangle.type]?.description ?? 'Unknown type'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Script ID</span>
              <span className="font-medium">{triangle.script}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Region</span>
              <span className="font-medium">
                {REGION_NAMES[triangle.locationId] ?? `Unknown (${triangle.locationId})`}
              </span>
            </div>
            {triangle.isChocobo ? (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Chocobo</span>
                <span className="font-medium">Yes</span>
              </div>
            ) : null}
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
          <Label>Texture</Label>
          <div className="rounded-md border bg-muted/50 p-2 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">ID</span>
              <span className="font-medium">{textures[triangle.texture]?.name ?? 'Unknown'} ({triangle.texture})</span>
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
                  (window as any).updateTriangleUVs(
                    uvCoords[0].u,
                    uvCoords[0].v,
                    uvCoords[1].u,
                    uvCoords[1].v,
                    uvCoords[2].u,
                    uvCoords[2].v
                  );
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
