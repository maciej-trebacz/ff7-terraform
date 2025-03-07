import { Button } from "@/components/ui/button";
import { useMapState } from "@/hooks/useMapState";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGION_NAMES, TRIANGLE_TYPES } from "@/lib/map-data";
import { useState } from "react";

interface PaintingValues {
  type: string | null;
  region: string | null;
  scriptId: string;
  isChocobo: boolean;
  texture: string | null;
}

interface CopiedTriangleData {
  texture: number;
  uVertex0: number;
  vVertex0: number;
  uVertex1: number;
  vVertex1: number;
  uVertex2: number;
  vVertex2: number;
}

export function PaintingSidebar() {
  const { paintingSelectedTriangles, worldmap, updateSelectedTriangles, updateTriangle, textures, togglePaintingSelectedTriangle, triangleMap } = useMapState();
  const [values, setValues] = useState<PaintingValues>({
    type: null,
    region: null,
    scriptId: "0",
    isChocobo: false,
    texture: null
  });
  const [copiedTriangles, setCopiedTriangles] = useState<CopiedTriangleData[]>([]);

  const handleApply = () => {
    if (!worldmap || paintingSelectedTriangles.size === 0) return;

    const updates: any = {};
    if (values.type !== null) {
      updates.type = parseInt(values.type);
    }
    if (values.region !== null) {
      updates.locationId = parseInt(values.region);
    }
    if (values.scriptId) {
      updates.script = parseInt(values.scriptId);
    }
    if (values.texture !== null) {
      updates.texture = parseInt(values.texture);
    }
    updates.isChocobo = values.isChocobo;

    updateSelectedTriangles(updates);
  };

  const handleClearSelection = () => {
    // Remove each triangle from selection
    paintingSelectedTriangles.forEach(faceIndex => {
      togglePaintingSelectedTriangle(faceIndex, false);
    });
  };

  const handleCopyTextureAndUVs = () => {
    if (!triangleMap) return;
    const copied: CopiedTriangleData[] = [];
    paintingSelectedTriangles.forEach(faceIndex => {
      const triangle = triangleMap[faceIndex];
      if (!triangle) return;
      copied.push({
        texture: triangle.texture,
        uVertex0: triangle.uVertex0,
        vVertex0: triangle.vVertex0,
        uVertex1: triangle.uVertex1,
        vVertex1: triangle.vVertex1,
        uVertex2: triangle.uVertex2,
        vVertex2: triangle.vVertex2,
      });
    });
    setCopiedTriangles(copied);
    handleClearSelection();
  };

  const handlePasteTextureAndUVs = () => {
    if (!triangleMap || copiedTriangles.length === 0) return;
    const selectedTriangles = Array.from(paintingSelectedTriangles);
    selectedTriangles.forEach((faceIndex, i) => {
      const triangle = triangleMap[faceIndex];
      if (!triangle) return;

      const sourceTriangle = copiedTriangles[i % copiedTriangles.length];
      updateTriangle(triangle, {
        texture: sourceTriangle.texture,
        uVertex0: sourceTriangle.uVertex0,
        vVertex0: sourceTriangle.vVertex0,
        uVertex1: sourceTriangle.uVertex1,
        vVertex1: sourceTriangle.vVertex1,
        uVertex2: sourceTriangle.uVertex2,
        vVertex2: sourceTriangle.vVertex2,
      });
    });
    handleClearSelection();
  };

  return (
    <>
      <h3 className="text-sm font-medium">Painting Mode</h3>
      <div className="mt-4 space-y-4">
        <div className="flex space-x-1">
          <Button 
            variant="outline" 
            size="sm"
            className="h-6 text-xs px-2"
            onClick={handleCopyTextureAndUVs}
            disabled={paintingSelectedTriangles.size === 0}
          >
            Copy Texture & UVs
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={handlePasteTextureAndUVs}
            disabled={copiedTriangles.length === 0 || paintingSelectedTriangles.size === 0}
          >
            Paste Texture & UVs
          </Button>
        </div>
        <div className="space-y-1.5">
          <Label>Triangle Type</Label>
          <Select
            value={values.type ?? undefined}
            onValueChange={(value) => setValues(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select type" />
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

        <div className="space-y-1.5">
          <Label>Texture</Label>
          <Select
            value={values.texture ?? undefined}
            onValueChange={(value) => setValues(prev => ({ ...prev, texture: value }))}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select texture" />
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

        <div className="space-y-1.5">
          <Label>Region</Label>
          <Select
            value={values.region ?? undefined}
            onValueChange={(value) => setValues(prev => ({ ...prev, region: value }))}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REGION_NAMES).map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Script ID</Label>
          <Input 
            type="number" 
            className="h-8"
            min={0}
            max={255}
            value={values.scriptId}
            onChange={(e) => setValues(prev => ({ ...prev, scriptId: e.target.value }))}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="chocobo"
            checked={values.isChocobo}
            onCheckedChange={(checked) => setValues(prev => ({ ...prev, isChocobo: checked === true }))}
          />
          <Label htmlFor="chocobo">Is Chocobo Area</Label>
        </div>

        <Button 
          className="w-full" 
          size="sm"
          onClick={handleApply}
          disabled={paintingSelectedTriangles.size === 0}
        >
          Apply to {paintingSelectedTriangles.size} Selected
        </Button>

        <Button 
          className="w-full" 
          size="sm"
          variant="link"
          onClick={handleClearSelection}
          disabled={paintingSelectedTriangles.size === 0}
        >
          Clear Selected
        </Button>
      </div>
    </>
  );
} 