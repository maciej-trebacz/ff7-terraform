import { Button } from "@/components/ui/button";
import { ExportImport } from "./ExportImport";
import { Separator } from "@/components/ui/separator";
import { MapMode } from "@/hooks/useMapState";

interface ExportImportSidebarProps {
  setMode: (mode: MapMode) => void;
}

export function ExportImportSidebar({
  setMode,
}: ExportImportSidebarProps) {
  return (
    <>
      <Separator className="my-4" />
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Export / Import geometry</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setMode('selection')}
            className="h-6"
          >
            Back
          </Button>
        </div>
        <div className="mt-2">
          <div className="flex flex-col gap-2 w-72">
            <div className="space-y-2">
              <ExportImport />
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 