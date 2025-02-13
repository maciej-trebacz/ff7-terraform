import { Triangle } from "@/ff7/mapfile";
import { SelectedTriangle } from "./SelectedTriangle";
import { Separator } from "@/components/ui/separator";

interface SelectionSidebarProps {
  selectedTriangle: Triangle | null;
  textures: any[];
  onVertexChange: (vertexIndex: number, axis: 'x' | 'y' | 'z', value: string) => void;
}

export function SelectionSidebar({
  selectedTriangle,
  textures,
  onVertexChange,
}: SelectionSidebarProps) {
  return (
    <>
      <Separator className="my-4" />
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Triangle</h3>
        </div>
        <div className="mt-2">
          <SelectedTriangle 
            triangle={selectedTriangle}
            textures={textures}
            onVertexChange={onVertexChange}
          />
        </div>
      </div>
    </>
  );
} 