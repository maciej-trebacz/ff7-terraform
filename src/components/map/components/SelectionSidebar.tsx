import { Triangle } from "@/ff7/mapfile";
import { SelectedTriangle } from "./SelectedTriangle";

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
      <h3 className="text-sm font-medium">Triangle</h3>
      <div className="mt-2">
        <SelectedTriangle 
          triangle={selectedTriangle}
          textures={textures}
          onVertexChange={onVertexChange}
        />
      </div>
    </>
  );
} 