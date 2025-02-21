import { ExportImport } from "./ExportImport";

export function ExportImportSidebar() {
  return (
    <>
      <h3 className="text-sm font-medium">Export / Import geometry</h3>
      <div className="mt-2">
        <ExportImport />
      </div>
    </>
  );
} 